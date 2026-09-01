import { and, count, desc, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { invoices, mediaAssets, notifications, posts, socialAccounts } from "@/db/schema";
import { handler, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { buildAnalytics } from "@/lib/server/analytics-service";
import type { AppStatePayload, PlatformId, SocialAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const { user, workspace } = await requireUser();

  const [accounts, notifs, media, analytics, invoiceRows, monthPosts, allPosts, mediaUsage] =
    await Promise.all([
      db.select().from(socialAccounts).where(eq(socialAccounts.workspaceId, workspace.id)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.workspaceId, workspace.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
      db.select().from(mediaAssets).where(eq(mediaAssets.workspaceId, workspace.id)).orderBy(desc(mediaAssets.createdAt)).limit(60),
      buildAnalytics(workspace.id),
      db.select().from(invoices).where(eq(invoices.workspaceId, workspace.id)).orderBy(desc(invoices.createdAt)).limit(12),
      db
        .select({ value: count() })
        .from(posts)
        .where(
          and(
            eq(posts.workspaceId, workspace.id),
            gte(posts.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
            lt(posts.createdAt, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))
          )
        ),
      db.select({ media: posts.media }).from(posts).where(eq(posts.workspaceId, workspace.id)),
      Promise.resolve(1),
    ]);
  void mediaUsage;

  const usedUrls = new Map<string, number>();
  for (const row of allPosts) for (const url of row.media ?? []) usedUrls.set(url, (usedUrls.get(url) ?? 0) + 1);

  const mappedAccounts: SocialAccount[] = accounts.map((a) => ({
    id: a.id,
    platform: a.platform as PlatformId,
    handle: a.handle,
    name: a.displayName,
    connected: a.status === "connected" || a.status === "simulated",
    followers: a.followers,
    avatarHue: a.avatarHue,
    lastSync: a.lastSyncAt ? a.lastSyncAt.toISOString() : null,
    health: a.status === "expiring" ? "expiring" : a.status === "disconnected" ? "disconnected" : "good",
    postsThisWeek: 0,
  }));

  const plan = workspace.plan === "pro" ? "pro" : "free";
  const connectedCount = accounts.filter((a) => a.status === "connected" || a.status === "simulated").length;

  const payload: AppStatePayload = {
    user: {
      name: user.name,
      email: user.email,
      workspace: workspace.name,
      plan,
      timezone: user.prefs?.timezone ?? "Asia/Kolkata (GMT+5:30)",
      digest: user.prefs?.digest ?? true,
    },
    plan,
    accounts: mappedAccounts,
    notifications: notifs.map((n) => ({
      id: n.id,
      kind: n.kind as AppStatePayload["notifications"][number]["kind"],
      title: n.title,
      body: n.body,
      time: n.createdAt.toISOString(),
      read: n.read,
    })),
    analytics,
    media: media.map((m) => ({
      id: m.id,
      src: m.url,
      label: m.name,
      kind: m.mime.startsWith("video/") ? "video" : "image",
      tags: [],
      usedIn: usedUrls.get(m.url) ?? 0,
    })),
    billing: {
      plan,
      renewsOn: plan === "pro" && workspace.planRenewsAt ? workspace.planRenewsAt.toISOString() : null,
      invoices: invoiceRows.map((i) => ({
        id: i.number,
        date: i.createdAt.toISOString(),
        description: i.description,
        amountInr: i.amountInr,
        status: "paid" as const,
      })),
      usage: {
        postsThisMonth: monthPosts[0]?.value ?? 0,
        postsLimit: plan === "free" ? 10 : null,
        accountsUsed: connectedCount,
        accountsLimit: plan === "free" ? 2 : 12,
      },
    },
  };
  return ok(payload);
});
