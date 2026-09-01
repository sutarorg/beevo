import crypto from "crypto";
import { db } from "@/db";
import {
  invoices,
  mediaAssets,
  metricsSnapshots,
  notifications,
  posts,
  postTargets,
  socialAccounts,
} from "@/db/schema";
import { encrypt } from "./crypto";
import type { PlatformId } from "@/lib/types";

/**
 * Demo workspace seeding (DEMO_SEED=true).
 * Creates obviously-flagged SIMULATED accounts/posts/snapshots so a fresh
 * signup immediately looks alive while every byte flows through the real
 * database and API layer. Set DEMO_SEED=false for real launches.
 */

function prng(seed: string) {
  let s = parseInt(crypto.createHash("md5").update(seed).digest("hex").slice(0, 8), 16);
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

interface SeedDef {
  caption: string;
  platforms: PlatformId[];
  status: "draft" | "scheduled" | "published" | "failed";
  day: number;
  hour: number;
  media?: string[];
  metrics?: { likes: number; comments: number; shares: number; impressions: number };
  ai?: boolean;
}

const SEED_POSTS: SeedDef[] = [
  { caption: "Golden hour, golden jar. Our small-batch wildflower honey drops this Friday — 200 jars only. Set your reminders.", platforms: ["instagram", "facebook"], status: "published", day: -6, hour: 18, media: ["/media/honey-jar.jpg"], metrics: { likes: 2412, comments: 184, shares: 96, impressions: 38400 } },
  { caption: "Behind the scenes: how 60,000 bees make your morning toast better. Full vlog on the channel now.", platforms: ["youtube", "facebook"], status: "published", day: -4, hour: 12, media: ["/media/team-desk.jpg"], metrics: { likes: 1180, comments: 92, shares: 141, impressions: 21900 } },
  { caption: "5 ways to style your oatmeal bowl that have nothing to do with talent and everything to do with honey. A thread.", platforms: ["twitter"], status: "published", day: -3, hour: 9, metrics: { likes: 864, comments: 47, shares: 210, impressions: 15200 } },
  { caption: "We measured our Q3 community growth: +41% engagement after switching to a 4-post weekly cadence. Here's the full breakdown.", platforms: ["linkedin"], status: "published", day: -2, hour: 10, metrics: { likes: 512, comments: 88, shares: 64, impressions: 9800 } },
  { caption: "The pour that started it all. Café Miel opens its second outlet in Indiranagar this Saturday — first 50 guests get honey lattes on us.", platforms: ["instagram", "pinterest"], status: "published", day: -1, hour: 17, media: ["/media/cafe-pour.jpg"], metrics: { likes: 3120, comments: 246, shares: 187, impressions: 42100 } },
  { caption: "Sunday reset: a flatlay ritual for slow mornings. Save this for your next self-care Sunday.", platforms: ["instagram", "pinterest"], status: "scheduled", day: 0, hour: 19, media: ["/media/flatlay-skincare.jpg"], ai: true },
  { caption: "Run club x Beevo: 5K at sunrise, honey shots at the finish line. Registration link in bio — 80 slots.", platforms: ["instagram", "twitter", "facebook"], status: "scheduled", day: 1, hour: 7, media: ["/media/sunset-run.jpg"] },
  { caption: "New on the blog: Why raw honey crystallizes (and why that's a good sign). 4-minute read.", platforms: ["linkedin", "twitter", "facebook"], status: "scheduled", day: 1, hour: 13 },
  { caption: "Pottery x honey tasting — a collaboration we didn't know we needed. 24 seats, book before Thursday.", platforms: ["instagram", "facebook"], status: "scheduled", day: 2, hour: 16, media: ["/media/workshop.jpg"], ai: true },
  { caption: "Poll: should our next limited flavour be (a) smoked chilli honey or (b) lavender-infused? Reply below.", platforms: ["twitter", "instagram"], status: "scheduled", day: 3, hour: 11 },
  { caption: "Quarterly creator report: what 1.2M impressions taught us about posting cadence, hooks and carousel lengths.", platforms: ["linkedin"], status: "scheduled", day: 4, hour: 10, ai: true },
  { caption: "Meet Maya — head beekeeper, chief honey taster, and the reason Batch 42 tastes like sunshine.", platforms: ["instagram", "youtube"], status: "scheduled", day: 5, hour: 18, media: ["/media/team-desk.jpg"] },
  { caption: "Weekend pinning guide: 12 honey-toned tablescapes for your autumn hosting era.", platforms: ["pinterest"], status: "draft", day: 6, hour: 12, media: ["/media/honey-jar.jpg"] },
  { caption: "Shorts drop: 30 seconds of hypnotic honeycomb being uncapped. Sound ON.", platforms: ["youtube", "instagram"], status: "draft", day: 7, hour: 15 },
  { caption: "Our Diwali gifting catalogue is here — custom hampers from ₹799. Corporate orders open till Oct 20.", platforms: ["linkedin", "facebook"], status: "scheduled", day: 8, hour: 11 },
  { caption: "Founder AMA: ask anything about building a D2C food brand in India. Best questions get a jar.", platforms: ["twitter", "linkedin"], status: "failed", day: -1, hour: 20, metrics: { likes: 0, comments: 0, shares: 0, impressions: 0 } },
];

const HUES: Record<PlatformId, number> = { instagram: 335, facebook: 215, twitter: 40, linkedin: 210, pinterest: 0, youtube: 5 };

export async function seedWorkspace(workspaceId: string, userId: string, opts: { demo: boolean }) {
  if (!opts.demo) return;
  const rand = prng(workspaceId);

  /* accounts: 3 connected simulated, 3 disconnected */
  const accountRows = (
    [
      ["instagram", "@beevo.studio", 48210, true],
      ["facebook", "Beevo Studio", 19340, true],
      ["twitter", "@beevostudio", 0, false],
      ["linkedin", "Beevo Studio Pvt. Ltd.", 8920, true],
      ["pinterest", "beevostudio", 0, false],
      ["youtube", "@BeevoStudio", 0, false],
    ] as [PlatformId, string, number, boolean][]
  ).map(([platform, handle, followers, connected]) => ({
    workspaceId,
    platform,
    platformAccountId: `sim_${platform}_${Math.floor(rand() * 1e6)}`,
    handle,
    displayName: "Beevo Studio",
    followers,
    avatarHue: HUES[platform],
    accessTokenEnc: connected ? `sim.${crypto.randomUUID()}` : null,
    status: connected ? ("simulated" as const) : ("disconnected" as const),
    lastSyncAt: connected ? new Date() : null,
  }));
  await db.insert(socialAccounts).values(accountRows);
  const insertedAccounts = await db.select().from(socialAccounts);
  const byPlatform = new Map(insertedAccounts.filter((a) => a.workspaceId === workspaceId).map((a) => [a.platform, a]));

  /* posts — createdAt is backdated so the free-plan monthly counter
     only reflects genuinely new user posts */
  for (const [i, s] of SEED_POSTS.entries()) {
    const when = at(s.day, s.hour, (i * 7) % 60);
    const backdated = at(s.day - 3, 9);
    const createdAt = backdated.getTime() > Date.now() - 2 * 3600_000 ? new Date(Date.now() - 2 * 3600_000 - i * 300_000) : backdated;
    const [row] = await db
      .insert(posts)
      .values({
        workspaceId,
        createdById: userId,
        caption: s.caption,
        platforms: s.platforms,
        status: s.status,
        scheduledAt: s.status === "scheduled" || s.status === "failed" ? when : null,
        publishedAt: s.status === "published" ? when : null,
        media: s.media ?? [],
        metrics: s.metrics ?? { likes: 0, comments: 0, shares: 0, impressions: 0 },
        aiAssisted: s.ai ? 1 : 0,
        createdAt,
      })
      .returning();
    if (s.status === "scheduled") {
      for (const p of s.platforms) {
        await db.insert(postTargets).values({ postId: row.id, platform: p, socialAccountId: byPlatform.get(p)?.id ?? null });
      }
    }
  }

  /* 30 days of metric snapshots */
  const platforms: PlatformId[] = ["instagram", "facebook", "twitter", "linkedin", "pinterest", "youtube"];
  const base: Record<PlatformId, number> = { instagram: 46000, facebook: 19000, twitter: 8400, linkedin: 8700, pinterest: 5100, youtube: 9600 };
  const snapRows: (typeof metricsSnapshots.$inferInsert)[] = [];
  for (let d = 29; d >= 0; d--) {
    const date = at(-d, 12);
    const dateStr = date.toISOString().slice(0, 10);
    for (const p of platforms) {
      const connected = p === "instagram" || p === "facebook" || p === "linkedin";
      snapRows.push({
        workspaceId,
        date: dateStr,
        platform: p,
        impressions: connected ? Math.round((base[p] / 30) * (0.7 + rand() * 0.6)) : Math.round(rand() * 40),
        engagement: connected ? Math.round((base[p] / 30) * (0.045 + rand() * 0.03)) : 0,
        followers: Math.round(base[p] + (29 - d) * (rand() * 60 - 12)),
      });
    }
  }
  await db.insert(metricsSnapshots).values(snapRows);

  /* media library */
  const mediaDefs = [
    ["/media/honey-jar.jpg", "Golden jar — hero shot"],
    ["/media/cafe-pour.jpg", "Café latte pour"],
    ["/media/flatlay-skincare.jpg", "Skincare flatlay"],
    ["/media/sunset-run.jpg", "Sunset run club"],
    ["/media/workshop.jpg", "Pottery workshop"],
    ["/media/team-desk.jpg", "Studio team at work"],
  ] as const;
  await db.insert(mediaAssets).values(
    mediaDefs.map(([url, name]) => ({
      workspaceId,
      uploadedById: userId,
      url,
      name,
      mime: "image/jpeg",
      size: 0,
      storageKey: "seed",
    }))
  );

  /* notifications + a sample invoice */
  await db.insert(notifications).values([
    { workspaceId, kind: "published", title: "Post published to Instagram", body: "“The pour that started it all…” is live on 2 channels.", read: false },
    { workspaceId, kind: "failed", title: "1 post needs attention", body: "Founder AMA failed to publish to X — token expired.", read: false },
    { workspaceId, kind: "account", title: "LinkedIn token expiring", body: "Reconnect LinkedIn within 3 days to keep scheduling.", read: false },
    { workspaceId, kind: "tip", title: "Best time spotted", body: "Your Instagram audience peaks Sunday 6–8 pm.", read: true },
    { workspaceId, kind: "plan", title: "Welcome to Beevo", body: "You're on the Free plan — upgrade anytime for unlimited scheduling.", read: true },
  ]);
  await db.insert(invoices).values([
    { workspaceId, number: "INV-2026-009", description: "Beevo Pro — Monthly", amountInr: 799, gstInr: 144, status: "paid" },
    { workspaceId, number: "INV-2026-004", description: "Beevo Pro — Monthly", amountInr: 799, gstInr: 144, status: "paid" },
  ]);
}
