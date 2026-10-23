/**
 * Marketing copy and structured content shared across public pages.
 * Icons are referenced by key and resolved to Lucide components at render.
 */

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
] as const;

export const MARQUEE_ITEMS = [
  "No marketplace",
  "No algorithms",
  "Your links",
  "Your audience",
  "₹0 per month",
  "8% only when you sell",
] as const;

export const BENEFITS = [
  {
    icon: "Store",
    title: "A storefront with your name on it",
    body: "Your profile, your courses, your price tag. Share one link in your bio, DMs, or newsletter and it just works.",
  },
  {
    icon: "BadgePercent",
    title: "Keep 92% of every sale",
    body: "The plan is free forever. We take a flat 8% commission on successful eligible sales — and nothing at all until then.",
  },
  {
    icon: "Link2",
    title: "Sell where you already are",
    body: "Your buyers come from your YouTube, Instagram, or community. There is no feed competing for their attention here.",
  },
  {
    icon: "MonitorPlay",
    title: "A real home for your learners",
    body: "Buyers get a clean learner dashboard with their purchased courses, receipts, and instant email confirmations.",
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: "UserRound",
    title: "Claim your profile",
    body: "Sign up free and set up your personal creator page — photo, bio, and the links you already share everywhere.",
  },
  {
    step: "02",
    icon: "Clapperboard",
    title: "Publish a course",
    body: "Upload video lessons, attach files and worksheets, organise sections, set your price in rupees, and hit publish.",
  },
  {
    step: "03",
    icon: "Share2",
    title: "Share your link",
    body: "Drop your storefront or course link in your bio, video descriptions, and group chats. That's your entire funnel.",
  },
  {
    step: "04",
    icon: "IndianRupee",
    title: "Get paid per sale",
    body: "Buyers check out securely with UPI, cards, or net-banking. We keep 8%, you keep 92% on every successful eligible sale.",
  },
] as const;

export interface FeatureGroup {
  icon: string;
  title: string;
  lede: string;
  points: { title: string; body: string }[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    icon: "Fingerprint",
    title: "Profile & storefront",
    lede: "Your corner of the internet — pointed at by the one link you share everywhere.",
    points: [
      { title: "Personal creator profile", body: "Photo, bio, niche, and your external links in one tidy page." },
      { title: "Course storefront", body: "Every published course listed under your name with its own sales page." },
      { title: "Mobile-first design", body: "Built for buyers arriving from phones — because that's where your audience lives." },
    ],
  },
  {
    icon: "Clapperboard",
    title: "Course studio",
    lede: "Everything between “I should teach this” and a paid, published course.",
    points: [
      { title: "Video lessons", body: "Upload video lessons streamed securely from cloud storage." },
      { title: "File uploads", body: "Attach PDFs, presets, worksheets, and other downloads to lessons." },
      { title: "Structured curriculum", body: "Organise content into sections and lessons, draft privately, publish when ready." },
    ],
  },
  {
    icon: "ShieldCheck",
    title: "Selling & payments",
    lede: "Checkout your buyers already trust, money split transparently.",
    points: [
      { title: "Secure payments", body: "Checkout powered by Razorpay — UPI, cards, net-banking, and wallets." },
      { title: "Flat 8% commission", body: "Only on successful eligible sales. No subscription, no setup fee, no Pro tier." },
      { title: "Payout records", body: "Platform admins record creator payouts manually under the payment arrangement, subject to provider approval." },
    ],
  },
  {
    icon: "GraduationCap",
    title: "Learner experience",
    lede: "After the payment succeeds, your buyers land in a proper learning home.",
    points: [
      { title: "Learner dashboard", body: "One place with every course a buyer has purchased." },
      { title: "Email receipts", body: "Order confirmations and access emails delivered automatically." },
      { title: "Secure media delivery", body: "Course video and files served from cloud object storage, not a public folder." },
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqGroup {
  group: string;
  items: FaqItem[];
}

export const FAQS: FaqGroup[] = [
  {
    group: "The product",
    items: [
      {
        q: "What exactly is Beevo?",
        a: "A tool for creators who already have an audience — on YouTube, Instagram, a newsletter, anywhere — to package what they know into paid courses. You get a personal profile, a course storefront, and secure checkout, all under your own link.",
      },
      {
        q: "Is it a marketplace? Will people discover my course here?",
        a: "No — deliberately. There is no public course catalogue, no ranking feed, and no shared discovery. Your buyers arrive through the links you share. We build selling tools, not an attention algorithm.",
      },
      {
        q: "Do I need an existing audience to use it?",
        a: "You can build a course from day one either way. But because we don't distribute courses for you, sales come from the audience you bring. Creators with even a small, engaged community do best.",
      },
    ],
  },
  {
    group: "Money",
    items: [
      {
        q: "How much does Beevo cost?",
        a: "The creator plan is free — ₹0/month. We charge a flat 8% platform commission per successful eligible course sale. There is no Pro plan, no setup fee, and no paid tiers.",
      },
      {
        q: "How does the 8% commission work?",
        a: "On each successful eligible sale, 8% of the sale amount is retained as the platform fee and 92% is the creator share. Payment gateway charges and applicable taxes are settled separately as per the payment provider's terms. Any examples on this site are illustrative, not an earnings guarantee.",
      },
      {
        q: "How do creators get paid?",
        a: "Sales settle through our payment partner, Razorpay. Creator payouts are recorded manually by platform administration under the intended payment arrangement, subject to provider approval and settlement timelines.",
      },
      {
        q: "Which payment methods can my buyers use?",
        a: "Checkout runs on Razorpay, which supports UPI, major cards, net-banking, and popular wallets, subject to method availability at the time of purchase.",
      },
    ],
  },
  {
    group: "Courses & learners",
    items: [
      {
        q: "What can I put in a course?",
        a: "Video lessons, structured sections, and file downloads like PDFs, presets, and worksheets. You draft privately and publish when it's ready, priced in rupees.",
      },
      {
        q: "Where do my buyers watch the course?",
        a: "Every buyer gets a learner dashboard with their purchased courses, streamable on phone or desktop. They receive an email receipt and access link right after payment.",
      },
      {
        q: "Who owns my content?",
        a: "You do. You grant us a limited licence to host and deliver it to your paying learners. We never sell or redistribute your content.",
      },
    ],
  },
  {
    group: "Policies",
    items: [
      {
        q: "Do you offer refunds?",
        a: "Course purchases are digital goods and are non-refundable once access is granted. The exception is where a refund or other remedy is required by applicable law — those rights are always preserved. Read the full Refund Policy for details.",
      },
      {
        q: "What happens if a buyer loses access to a course they paid for?",
        a: "They should contact support and we'll restore access. If access genuinely cannot be delivered, we'll work with the creator to provide the appropriate remedy.",
      },
    ],
  },
];

export const PRICING_FAQS: FaqItem[] = [
  FAQS[1].items[0],
  FAQS[1].items[1],
  FAQS[1].items[2],
  FAQS[3].items[0],
];
