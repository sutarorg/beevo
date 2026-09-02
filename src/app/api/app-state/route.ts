import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { invoices, mediaAssets, notifications, payments, posts, socialAccounts } from "@/db/schema";
import { handler, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { buildAnalytics } from "@/lib/server/analytics-service";
import { priceFor } from "@/lib/pricing";
import type { AppStatePayload, PlatformId, SocialAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const { user, workspace, member } = await requireUser();

  const [accounts, notifs, media, analytics, invoiceRows, monthPosts, allPosts, paymentRows] =
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
      db
        .select()
        .from(payments)
        .where(and(eq(payments.workspaceId, workspace.id), inArray(payments.status, ["paid", "demo"])))
        .orderBy(desc(payments.createdAt))
        .limit(10),
    ]);

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
  const monthlyPrice = priceFor("monthly");

  const payload: AppStatePayload = {
    user: {
      name: user.name,
      email: user.email,
      workspace: workspace.name,
      plan,
      timezone: user.prefs?.timezone ?? "Asia/Kolkata (GMT+5:30)",
      digest: user.prefs?.digest ?? true,
      avatarUrl: user.avatarUrl ?? null,
      role: member.role,
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
      price: {
        basePaise: monthlyPrice.basePaise,
        gstPaise: monthlyPrice.gstPaise,
        totalPaise: monthlyPrice.totalPaise,
        gstPercent: 18,
      },
      /** Real instruments actually used — no hardcoded cards. */
      paymentMethods: Array.from(
        new Map(
          paymentRows
            .filter((p) => p.methodDetail)
            .map((p) => [
              p.methodDetail!,
              {
                id: p.id,
                method: p.method ?? "card",
                detail: p.methodDetail!,
                lastUsedAt: p.updatedAt.toISOString(),
              },
            ])
        ).values()
      ),
      invoices: invoiceRows.map((i) => ({
        id: i.number,
        date: i.createdAt.toISOString(),
        description: i.description,
        amountInr: i.amountInr,
        basePaise: i.basePaise || Math.round((i.amountInr - i.gstInr) * 100),
        gstPaise: i.gstPaise || Math.round(i.gstInr * 100),
        totalPaise: i.totalPaise || Math.round(i.amountInr * 100),
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
