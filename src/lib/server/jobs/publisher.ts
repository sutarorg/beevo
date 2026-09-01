import { and, desc, eq, inArray, lte } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { notifications, posts, postTargets, socialAccounts, users } from "@/db/schema";
import { adapterFor, isSimulatedToken, simulatedPublish, type PlatformAdapter } from "../platforms";
import { decrypt } from "../crypto";
import { emails, sendMail } from "../email";
import { env } from "../env";
import type { PlatformId } from "@/lib/types";

/**
 * Background scheduling engine.
 * Finds due posts, publishes every pending target to its platform,
 * updates statuses, notifies + emails. Idempotent per target and safe
 * to run every minute (targets carry their own state machine).
 */

export interface PublishSummary {
  processed: number;
  targetsPublished: number;
  targetsFailed: number;
}

function toAbsoluteMedia(media: string[]): string[] {
  const base = env.appUrl();
  return media.map((m) => (m.startsWith("http") ? m : `${base}${m}`));
}

async function publishOneTarget(
  target: typeof postTargets.$inferSelect,
  account: typeof socialAccounts.$inferSelect | null,
  caption: string,
  media: string[]
): Promise<{ ok: boolean; error?: string; platformPostId?: string | null; url?: string | null }> {
  const platform = target.platform as PlatformId;
  if (!account || account.status === "disconnected") {
    return { ok: false, error: `No connected ${platform} account in this workspace` };
  }
  const simulated = account.status === "simulated" || isSimulatedToken(account.accessTokenEnc);
  if (simulated) {
    if (!env.allowSimulatedConnections()) {
      return { ok: false, error: "Simulated account — reconnect with real OAuth credentials" };
    }
    const out = simulatedPublish(platform);
    return { ok: true, platformPostId: out.platformPostId, url: out.url };
  }
  const adapter: PlatformAdapter = adapterFor(platform);
  if (!adapter.configured()) {
    return { ok: false, error: `${platform} app credentials are not configured on the server` };
  }
  try {
    const accessToken = account.accessTokenEnc ? decrypt(account.accessTokenEnc) : "";
    const refreshToken = account.refreshTokenEnc ? decrypt(account.refreshTokenEnc) : null;
    const out = await adapter.publish(
      { accessToken, refreshToken, expiresAt: account.tokenExpiresAt },
      { caption, media: toAbsoluteMedia(media) }
    );
    return { ok: true, platformPostId: out.platformPostId, url: out.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 400) : "Unknown platform error" };
  }
}

export async function publishDuePosts(limit = 25): Promise<PublishSummary> {
  const now = new Date();
  const due = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, now)))
    .orderBy(posts.scheduledAt)
    .limit(limit);

  let targetsPublished = 0;
  let targetsFailed = 0;

  for (const post of due) {
    const targets = await db
      .select()
      .from(postTargets)
      .where(and(eq(postTargets.postId, post.id), inArray(postTargets.status, ["pending", "failed"])));

    const attempts = targets.filter((t) => t.status === "pending" || (t.status === "failed" && t.attempts < 3));

    const succeeded: string[] = [];
    const errors: string[] = [];

    for (const target of attempts) {
      await db.update(postTargets).set({ status: "publishing", attempts: target.attempts + 1 }).where(eq(postTargets.id, target.id));
      const [account] = target.socialAccountId
        ? await db.select().from(socialAccounts).where(eq(socialAccounts.id, target.socialAccountId)).limit(1)
        : [null];
      const result = await publishOneTarget(target, account ?? null, post.caption, post.media ?? []);
      if (result.ok) {
        targetsPublished++;
        succeeded.push(target.platform);
        await db
          .update(postTargets)
          .set({ status: "published", platformPostId: result.platformPostId ?? null, url: result.url ?? null, publishedAt: now, error: null })
          .where(eq(postTargets.id, target.id));
        // Simulated posts get a believable baseline of engagement.
        const sim = account?.status === "simulated";
        if (sim) {
          const rng = crypto.randomInt;
          const m = post.metrics ?? { likes: 0, comments: 0, shares: 0, impressions: 0 };
          await db
            .update(posts)
            .set({
              metrics: {
                likes: m.likes + rng(800, 4200),
                comments: m.comments + rng(40, 240),
                shares: m.shares + rng(20, 160),
                impressions: m.impressions + rng(12000, 52000),
              },
            })
            .where(eq(posts.id, post.id));
        }
      } else {
        targetsFailed++;
        errors.push(`${target.platform}: ${result.error}`);
        await db
          .update(postTargets)
          .set({ status: "failed", error: result.error ?? "Publish failed" })
          .where(eq(postTargets.id, target.id));
      }
    }

    const finalStatus = errors.length > 0 ? "failed" : "published";
    await db
      .update(posts)
      .set({
        status: finalStatus,
        publishedAt: finalStatus === "published" ? now : null,
        scheduledAt: null,
        updatedAt: now,
      })
      .where(eq(posts.id, post.id));

    await db.insert(notifications).values({
      workspaceId: post.workspaceId,
      kind: finalStatus === "published" ? "published" : "failed",
      title:
        finalStatus === "published"
          ? `Post published to ${succeeded.join(", ") || "channels"}`
          : "A post failed to publish",
      body:
        finalStatus === "published"
          ? `“${post.caption.slice(0, 90)}${post.caption.length > 90 ? "…" : ""}” is live.`
          : errors.join(" · ").slice(0, 250),
    });

    // Email the creator (fire & forget).
    if (post.createdById) {
      const [creator] = await db.select().from(users).where(eq(users.id, post.createdById)).limit(1);
      if (creator?.email) {
        const appUrl = env.appUrl();
        const html =
          finalStatus === "published"
            ? emails.publishSuccess(post.caption, succeeded, appUrl)
            : emails.publishFailed(post.caption, errors.join(" · ") || "Unknown error", appUrl);
        void sendMail({
          to: creator.email,
          subject: finalStatus === "published" ? "Your Beevo post is live" : "Beevo: a post needs attention",
          html,
        });
      }
    }
  }

  return { processed: due.length, targetsPublished, targetsFailed };
}

/** Quick health peek for monitoring. */
export async function countDue(): Promise<number> {
  const due = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, new Date())))
    .orderBy(desc(posts.scheduledAt))
    .limit(100);
  return due.length;
}
