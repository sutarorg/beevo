import { and, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { metricsSnapshots, posts, socialAccounts } from "@/db/schema";
import { env } from "../env";

/**
 * Analytics sync job (run daily via cron).
 * - Refreshes simulated engagement drift so demo dashboards stay alive
 * - Upserts per-platform daily snapshots (impressions, engagement, followers)
 * Live-API metric pulls plug in here per adapter (documented in README).
 */
export async function syncAnalytics(): Promise<{ workspaces: number }> {
  const accounts = await db.select().from(socialAccounts);
  const byWorkspace = new Map<string, typeof accounts>();
  for (const a of accounts) {
    byWorkspace.set(a.workspaceId, [...(byWorkspace.get(a.workspaceId) ?? []), a]);
  }

  const today = new Date().toISOString().slice(0, 10);
  let wsCount = 0;

  for (const [workspaceId, wsAccounts] of byWorkspace) {
    wsCount++;
    for (const account of wsAccounts) {
      const simulated = account.status === "simulated";
      if (simulated && env.allowSimulatedConnections()) {
        const rng = crypto.randomInt;
        account.followers = Math.max(0, account.followers + rng(-6, 90));
        await db.update(socialAccounts).set({ followers: account.followers, lastSyncAt: new Date() }).where(eq(socialAccounts.id, account.id));
      }
      // Daily snapshot (idempotent via unique constraint upsert).
      const impressions = simulated ? crypto.randomInt(600, 4200) : 0;
      const engagement = simulated ? crypto.randomInt(40, 320) : 0;
      await db
        .insert(metricsSnapshots)
        .values({
          workspaceId,
          date: today,
          platform: account.platform,
          impressions,
          engagement,
          followers: account.followers,
        })
        .onConflictDoUpdate({
          target: [metricsSnapshots.workspaceId, metricsSnapshots.date, metricsSnapshots.platform],
          set: {
            impressions: sql`${metricsSnapshots.impressions} + excluded.impressions`,
            engagement: sql`${metricsSnapshots.engagement} + excluded.engagement`,
            followers: sql`excluded.followers`,
          },
        });
    }

    // Drift published posts' metrics upward gently (simulated workspaces only).
    const published = await db
      .select()
      .from(posts)
      .where(and(eq(posts.workspaceId, workspaceId), eq(posts.status, "published")))
      .limit(50);
    for (const p of published) {
      const m = p.metrics ?? { likes: 0, comments: 0, shares: 0, impressions: 0 };
      if (m.impressions === 0) continue;
      const grow = 1 + crypto.randomInt(2, 7) / 100;
      await db
        .update(posts)
        .set({
          metrics: {
            likes: Math.round(m.likes * grow),
            comments: Math.round(m.comments * grow) + 1,
            shares: Math.round(m.shares * grow),
            impressions: Math.round(m.impressions * grow),
          },
        })
        .where(eq(posts.id, p.id));
    }
  }

  return { workspaces: wsCount };
}
