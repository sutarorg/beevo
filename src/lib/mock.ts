import type {
  AnalyticsPayload,
  BestTimeCell,
  Invoice,
  MediaAsset,
  NotificationItem,
  PlatformId,
  Post,
  SocialAccount,
} from "./types";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random so mock analytics look stable           */
/* ------------------------------------------------------------------ */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

/* ------------------------------------------------------------------ */
/* Media library (generated brand assets)                              */
/* ------------------------------------------------------------------ */
export const mockMedia: MediaAsset[] = [
  { id: "med_1", src: "/media/honey-jar.jpg", label: "Golden jar — hero shot", kind: "image", tags: ["product", "launch"], usedIn: 6 },
  { id: "med_2", src: "/media/cafe-pour.jpg", label: "Café latte pour", kind: "image", tags: ["cafe", " reel cover"], usedIn: 3 },
  { id: "med_3", src: "/media/flatlay-skincare.jpg", label: "Skincare flatlay", kind: "image", tags: ["beauty", "flatlay"], usedIn: 4 },
  { id: "med_4", src: "/media/sunset-run.jpg", label: "Sunset run club", kind: "image", tags: ["fitness", "outdoor"], usedIn: 2 },
  { id: "med_5", src: "/media/workshop.jpg", label: "Pottery workshop", kind: "image", tags: ["event", "community"], usedIn: 1 },
  { id: "med_6", src: "/media/team-desk.jpg", label: "Studio team at work", kind: "image", tags: ["culture", "bts"], usedIn: 5 },
];

/* ------------------------------------------------------------------ */
/* Social accounts                                                     */
/* ------------------------------------------------------------------ */
export const mockAccounts: SocialAccount[] = [
  { id: "acc_ig", platform: "instagram", handle: "@beevo.studio", name: "Beevo Studio", connected: true, followers: 48210, avatarHue: 335, lastSync: at(0, 8), health: "good", postsThisWeek: 5 },
  { id: "acc_fb", platform: "facebook", handle: "Beevo Studio", name: "Beevo Studio", connected: true, followers: 19340, avatarHue: 215, lastSync: at(0, 8), health: "good", postsThisWeek: 3 },
  { id: "acc_tw", platform: "twitter", handle: "@beevostudio", name: "Beevo Studio", connected: false, followers: 0, avatarHue: 40, lastSync: null, health: "disconnected", postsThisWeek: 0 },
  { id: "acc_li", platform: "linkedin", handle: "Beevo Studio Pvt. Ltd.", name: "Beevo Studio", connected: true, followers: 8920, avatarHue: 210, lastSync: at(-1, 18), health: "expiring", postsThisWeek: 2 },
  { id: "acc_pi", platform: "pinterest", handle: "beevostudio", name: "Beevo Studio", connected: false, followers: 0, avatarHue: 0, lastSync: null, health: "disconnected", postsThisWeek: 0 },
  { id: "acc_yt", platform: "youtube", handle: "@BeevoStudio", name: "Beevo Studio", connected: false, followers: 0, avatarHue: 5, lastSync: null, health: "disconnected", postsThisWeek: 0 },
];

/* ------------------------------------------------------------------ */
/* Seed posts — offsets keep the calendar alive around "today"         */
/* ------------------------------------------------------------------ */
interface SeedDef {
  caption: string;
  platforms: PlatformId[];
  status: Post["status"];
  day: number;
  hour: number;
  media?: string[];
  metrics?: Post["metrics"];
  ai?: boolean;
}

const seedDefs: SeedDef[] = [
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

export function seedPosts(): Post[] {
  return seedDefs.map((s, i) => {
    const when = at(s.day, s.hour, (i * 7) % 60);
    const published = s.status === "published";
    return {
      id: `post_${(i + 1).toString().padStart(3, "0")}`,
      caption: s.caption,
      platforms: s.platforms,
      status: s.status,
      scheduledAt: s.status === "scheduled" || s.status === "failed" ? when : null,
      publishedAt: published ? when : null,
      media: s.media ?? [],
      metrics: s.metrics ?? { likes: 0, comments: 0, shares: 0, impressions: 0 },
      aiAssisted: !!s.ai,
      createdAt: at(s.day - 2, 9),
      updatedAt: at(s.day - 1, 9),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */
export const mockNotifications: NotificationItem[] = [
  { id: "ntf_1", kind: "published", title: "Post published to Instagram", body: "“The pour that started it all…” is live on 2 channels.", time: at(0, 6), read: false },
  { id: "ntf_2", kind: "failed", title: "1 post needs attention", body: "Founder AMA failed to publish to X — token expired.", time: at(-1, 20), read: false },
  { id: "ntf_3", kind: "account", title: "LinkedIn token expiring", body: "Reconnect LinkedIn within 3 days to keep scheduling.", time: at(-1, 9), read: false },
  { id: "ntf_4", kind: "tip", title: "Best time spotted", body: "Your Instagram audience peaks Sunday 6–8 pm. 1 scheduled post matches.", time: at(-2, 15), read: true },
  { id: "ntf_5", kind: "plan", title: "You're on the Free plan", body: "7 of 10 posts used this month. Upgrade for unlimited scheduling.", time: at(-2, 10), read: true },
];

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */
export function mockAnalytics(): AnalyticsPayload {
  const rand = seededRandom(42);
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const base = 8200 + i * 210 + rand() * 2600;
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      impressions: Math.round(base + (i % 7 === 5 ? 3400 : 0)),
      engagement: Math.round(base * (0.052 + rand() * 0.025)),
      followers: Math.round(72800 + i * 165 + rand() * 220),
    };
  });

  const splitRand = seededRandom(7);
  const raw: [PlatformId, number][] = [
    ["instagram", 42],
    ["facebook", 18],
    ["twitter", 14],
    ["linkedin", 11],
    ["pinterest", 9],
    ["youtube", 6],
  ];
  const split = raw.map(([platform, v]) => ({ platform, value: Math.round(v + splitRand() * 3) }));

  const btRand = seededRandom(99);
  const bestTimes: BestTimeCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 7; slot++) {
      let score = Math.round(btRand() * 45) + 8;
      if ((day === 6 || day === 0) && slot === 5) score = 88 + Math.round(btRand() * 12);
      if (day === 4 && slot === 4) score = 78 + Math.round(btRand() * 10);
      bestTimes.push({ day, slot, score });
    }
  }

  return {
    kpis: {
      followers: 77746, followersDelta: 6.4,
      impressions: 312480, impressionsDelta: 12.8,
      engagementRate: 5.9, engagementDelta: 0.8,
      linkClicks: 9342, clicksDelta: -2.1,
    },
    series,
    split,
    bestTimes,
    topPosts: [
      { id: "post_005", caption: "The pour that started it all. Café Miel opens its second outlet…", platform: "instagram", impressions: 42100, engagement: 3553 },
      { id: "post_001", caption: "Golden hour, golden jar. Small-batch wildflower honey drops…", platform: "instagram", impressions: 38400, engagement: 2692 },
      { id: "post_002", caption: "Behind the scenes: how 60,000 bees make your morning better…", platform: "youtube", impressions: 21900, engagement: 1413 },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */
export const mockInvoices: Invoice[] = [
  { id: "INV-2026-009", date: at(-32, 10), description: "Beevo Pro — Monthly", amountInr: 799, status: "paid" },
  { id: "INV-2026-004", date: at(-62, 10), description: "Beevo Pro — Monthly", amountInr: 799, status: "paid" },
  { id: "INV-2025-118", date: at(-92, 10), description: "Beevo Pro — Monthly", amountInr: 799, status: "paid" },
];

export const AI_SUGGESTIONS: string[] = [
  "Golden hour hits different when the jar is still warm. Batch 42 drops Friday — 200 jars, no restocks. Which flavour are you grabbing first?",
  "POV: it's 7:04 am, the toast is perfect, and the honey actually tastes like the flowers it came from. Small-batch wildflower, live Friday.",
  "We counted. One jar of Batch 42 = 1.2 million flower visits by 60,000 very focused employees. Meet them this Friday.",
  "No syrups, no shortcuts, no apologies. Just honey the way the bees intended. Batch 42 — this Friday, while it lasts.",
  "Your morning ritual deserves better than a squeezy bottle. Wildflower, raw, unfiltered — Batch 42 drops Friday at 9 am IST.",
];
