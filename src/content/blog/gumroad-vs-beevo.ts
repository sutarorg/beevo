import type { BlogArticle } from "@/lib/blog";

/**
 * Facts checked 26 October 2026 against the pages listed in `sources`.
 * Gumroad figures are quoted in USD exactly as published; no exchange-rate
 * conversion is asserted anywhere in the copy.
 */
export const gumroadVsBeevo: BlogArticle = {
  slug: "gumroad-vs-beevo",
  title: "Gumroad vs Beevo: which one should an Indian creator actually use?",
  seoTitle: "Gumroad vs Beevo for Indian creators (2026)",
  description:
    "Gumroad takes 10% + $0.50 and bills in dollars; Beevo takes a flat 8% in rupees. A side-by-side on fees, UPI checkout, GST and who your buyers are.",
  excerpt:
    "One is a global marketplace-of-links priced in dollars. One is a rupee-first storefront with a flat 8%. Here is the honest split.",
  category: "Comparisons",
  tags: ["Gumroad", "Beevo", "course platforms", "fees", "India"],
  publishedAt: "2026-10-26",
  featured: true,
  image: {
    src: "/images/blog/gumroad-vs-beevo.jpg",
    alt: "Two market stalls side by side — a plain parcel on one, a course video tile on the other — with a balance scale above them",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "Gumroad charges 10% + $0.50 per direct sale, plus card processing of 2.9% + $0.30 on top, and 30% on sales through its Discover marketplace.",
    "Beevo charges ₹0/month and a flat 8% platform commission per successful eligible sale, priced in rupees through Razorpay (UPI, cards, net-banking).",
    "Gumroad is the stronger choice if your buyers are mostly outside India and paying in dollars.",
    "Beevo is the stronger choice if your buyers are in India, your product is a course, and you already have the audience.",
    "On a US$30 sale, Gumroad's platform fee plus processing comes to about 15.6% of the order. On a ₹1,500 sale, Beevo's platform commission is ₹120 — 8% before gateway charges.",
  ],
  blocks: [
    {
      type: "p",
      text: "Search “Gumroad vs Beevo” and you will find pages that compare the two by listing features in a grid. That is not the decision you are actually making. The decision is about **who your buyer is, what currency they pay in, and what happens to the last 10–15% of every sale.**",
    },
    {
      type: "p",
      text: "This post answers that question for an Indian creator in 2026 — someone with an audience on YouTube, Instagram or WhatsApp, selling a course or a digital download. Both platforms are legitimate. They are simply built for different buyers.",
    },
    {
      type: "h2",
      text: "The 60-second answer",
    },
    {
      type: "ul",
      items: [
        "**Your buyers are mostly in India, paying with UPI.** Use Beevo. Rupee pricing, an Indian checkout, a flat 8% platform commission, and no dollar conversion anywhere in the chain.",
        "**Your buyers are mostly outside India, paying by card in USD.** Use Gumroad, or expect to solve international payments some other way. It handles cross-border checkout and acts as merchant of record for sales tax and VAT.",
        "**You are selling a $9 PDF to a global audience.** Check the maths first — Gumroad's $0.50 fixed component hurts small tickets (see the table below).",
        "**You are selling a ₹1,500 course to your own Instagram audience.** Beevo's storefront is the shorter path: sign up, publish, share one link.",
      ],
    },
    {
      type: "h2",
      text: "What each platform actually charges",
    },
    {
      type: "p",
      text: "These are the published rates as of 26 October 2026. Gumroad's numbers come from its own pricing page and help article; Beevo's come from [our pricing page](/pricing), which is the same plan every creator gets.",
    },
    {
      type: "table",
      caption: "Published pricing, checked 26 October 2026",
      head: ["", "Gumroad", "Beevo"],
      rows: [
        ["Monthly fee", "$0", "₹0"],
        ["Platform fee per sale", "10% + $0.50", "Flat 8%"],
        ["Card processing", "2.9% + $0.30, charged on top", "Settled with the gateway per its terms"],
        ["Marketplace/discovery fee", "30% on Discover sales", "No marketplace — there is nothing to opt into"],
        ["High-volume discount", "5% + $0.50 after $20,000 in a calendar month", "None — 8% is the only rate"],
        ["Currency of sale", "US dollars (prices are set in USD)", "Indian rupees"],
        ["Payouts", "Bank/PayPal payout, $100 minimum, available in local currency in most countries", "Recorded manually by Beevo admins under the payment arrangement"],
        ["Payment methods for buyers", "Cards, PayPal, Apple Pay, Google Pay", "UPI, cards, net-banking, wallets via Razorpay"],
      ],
      note: "Gumroad's help article states plainly that the 10% + $0.50 does not include credit-card processing or PayPal fees. Read a fee page that omits that line with suspicion.",
    },
    {
      type: "h2",
      text: "The fee maths on real prices",
    },
    {
      type: "p",
      text: "Percentages hide things. Fixed cents and fixed rupees do not. Below is what each platform's **platform fee plus card processing** leaves you, on a direct sale to a buyer you brought yourself — the only kind of sale Beevo has, and the cheapest kind on Gumroad.",
    },
    {
      type: "table",
      caption: "Gumroad direct sale — platform fee (10% + $0.50) plus 2.9% + $0.30 card processing",
      head: ["Sale price", "Gumroad fee", "Processing", "You keep", "Effective cost"],
      rows: [
        ["$9", "$1.40", "$0.56", "$7.04", "21.8%"],
        ["$30", "$3.50", "$1.17", "$25.33", "15.6%"],
        ["$99", "$10.40", "$3.17", "$85.43", "13.7%"],
        ["$299", "$30.40", "$8.97", "$259.63", "13.2%"],
      ],
      note: "The $0.50 platform component and the $0.30 processing component together are $0.80 — which is 8.9% of a $9 product before any percentage fee is applied. Small prices and fixed fees are a bad pair.",
    },
    {
      type: "table",
      caption: "Beevo — flat 8% platform commission",
      head: ["Sale price", "Platform commission", "Creator share", "Effective cost"],
      rows: [
        ["₹499", "₹39.92", "₹459.08", "8%"],
        ["₹1,500", "₹120.00", "₹1,380.00", "8%"],
        ["₹4,999", "₹399.92", "₹4,599.08", "8%"],
      ],
      note: "Beevo's 8% is a platform commission only. Payment-gateway charges and applicable taxes are settled separately under the payment provider's terms — the same caveat Gumroad makes about processing, stated in the same place: next to the number.",
    },
    {
      type: "callout",
      tone: "accent",
      title: "The honest caveat about Beevo's numbers",
      text: "₹1,380 is what you keep after Beevo's commission, before the payment gateway's own charge crosses your account. We do not pretend the gateway is free — nobody's is, including Gumroad's card processor at 2.9% + $0.30.",
    },
    {
      type: "h2",
      text: "Where Gumroad is genuinely the better tool",
    },
    {
      type: "p",
      text: "If this section feels short, it is not because Gumroad is weak. It is because its advantages cluster around one thing: **selling to strangers abroad.**",
    },
    {
      type: "ol",
      items: [
        "**International buyers.** Gumroad takes cards and PayPal in USD and handles the tax side as merchant of record. If your audience is a photography community in Germany or a design list in the US, that matters more than a few percentage points.",
        "**Discover.** The 30% Discover rate is expensive, but it is real distribution — Gumroad's own marketplace surfacing your product to people who have never heard of you. Beevo has no equivalent, and deliberately so: there is no public catalogue to be listed in.",
        "**Non-course products.** Physical zines, memberships, license keys, pay-what-you-want downloads. Beevo is built around courses with sections and lessons; if you sell a sticker pack, Beevo is the wrong shape of tool.",
        "**A long track record.** Gumroad has processed payouts for creators for over a decade. That history is real, and if certainty matters more than margin, it counts.",
      ],
    },
    {
      type: "h2",
      text: "Where Beevo is the better fit",
    },
    {
      type: "ol",
      items: [
        "**Your buyer pays in rupees.** A ₹1,499 course priced in rupees, paid by UPI, settled to a rupee account, with no exchange rate between you and your money. Indian buyers bounce off dollar-priced checkouts more often than creators expect.",
        "**The sale carries no fixed fee.** A ₹199 worksheet and a ₹9,999 course both cost 8%. There is no per-transaction cent behaving like a tax on small products.",
        "**The product is a course.** Sections, lessons, video streaming, file attachments, a learner dashboard that remembers progress, and email receipts. Not a file link in an email.",
        "**You bring the audience.** No marketplace, no feed, no “similar courses” shelf pointing your buyer at someone else. Your storefront at `/@yourname` is yours — see [how it works](/how-it-works).",
        "**No upsell ladder.** One plan, ₹0/month, 8% when you sell. There is no Pro tier waiting with the useful features locked inside. The [FAQ](/faq) answers the awkward questions about payouts and refunds.",
      ],
    },
    {
      type: "h2",
      text: "What Beevo can't do (yet)",
    },
    {
      type: "ul",
      items: [
        "**Sell in foreign currency.** Checkout is in rupees. If your buyers are abroad, their bank converts — and that is between them and their bank.",
        "**Act as merchant of record.** On Beevo you are the seller. Your GST obligations are yours, in the same way they are for any Indian freelancer or business selling services.",
        "**Pay you instantly.** Payouts are recorded manually by Beevo admins under the payment arrangement, subject to the payment provider's settlement timelines. There is no “withdraw now” button yet.",
        "**Rank you in a catalogue.** There is no discovery. Traffic is your job; the tool's job is to convert it cleanly.",
      ],
    },
    {
      type: "h2",
      text: "GST, invoices, and who the tax authority sees",
    },
    {
      type: "p",
      text: "This is the part that comparison posts usually skip, and it changes the answer for some creators.",
    },
    {
      type: "ul",
      items: [
        "**Gumroad** is the merchant of record on its sales. It calculates, collects and remits sales tax and VAT on transactions, and your buyer's statement shows Gumroad. That removes a chunk of cross-border tax admin — and it is a large part of what the 10% buys.",
        "**Beevo** is your storefront and your checkout; you are the seller. Online courses and coaching are generally taxed at 18% GST in India once your aggregate turnover crosses the registration threshold — ₹20 lakh for services in most states, ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura. Below that, registration is usually not mandatory for a purely intra-state service business, though voluntary registration is allowed.",
        "**Neither platform is your accountant.** The thresholds above are the general rule for service providers; your situation may differ. Talk to a CA before you cross a threshold, not after.",
      ],
    },
    {
      type: "h2",
      text: "The decision rule that actually works",
    },
    {
      type: "p",
      text: "Skip the feature grid. Answer these four questions in order:",
    },
    {
      type: "ol",
      items: [
        "**Where do my buyers live?** Mostly India → Beevo. Mostly abroad → Gumroad.",
        "**How do they pay?** UPI and Indian cards → Beevo. PayPal and foreign cards → Gumroad.",
        "**What is my average price?** Under ₹1,000, fixed fees hurt → Beevo. Over $100, Gumroad's percentage converges with everyone else's.",
        "**Is the product a course?** Yes → Beevo was built for exactly that. No → Gumroad is more flexible.",
      ],
    },
    {
      type: "p",
      text: "If you answered India, UPI, under ₹1,000 and “yes, a course” — you are the creator Beevo was built for. [Start a storefront](/signup) and see the sales page before you decide anything else. If you answered abroad, dollars and PayPal, Gumroad is doing a job Beevo does not do.",
    },
    {
      type: "cta",
      title: "Sell your first course in rupees, not dollars",
      body: "₹0/month, a flat 8% only when you make a successful eligible sale, and a checkout your Indian buyers already trust. No card required to start.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is Beevo cheaper than Gumroad?",
          a: "For a direct sale, Beevo's platform fee is 8% with no fixed per-sale charge; Gumroad's is 10% + $0.50 plus card processing of 2.9% + $0.30. Which is cheaper in rupees depends on the exchange rate and your price — but there is no version of the maths where a fixed $0.50 helps a small Indian ticket.",
        },
        {
          q: "Does Beevo let me sell to customers outside India?",
          a: "Yes, but the price and payment are in rupees. An overseas buyer's bank or card converts the amount. If international sales are the core of your business, a dollar-priced platform is usually the better fit.",
        },
        {
          q: "Can I use both Gumroad and Beevo?",
          a: "Nothing stops you. Many creators keep a dollar-priced product abroad and run their Indian course sales on Beevo. Just keep the two catalogues and prices clearly separate so you are not fielding “why is it cheaper on the other link?” messages.",
        },
        {
          q: "Who handles GST on a Beevo sale?",
          a: "You are the seller, so GST registration and filing are yours once you cross the applicable threshold — generally ₹20 lakh aggregate turnover for services, ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura. Beevo provides the selling tools; it is not your tax adviser.",
        },
        {
          q: "Does Gumroad really take 30%?",
          a: "Only on sales that come through its Discover marketplace, where Gumroad sourced the customer. Direct sales through your own link are 10% + $0.50 plus processing. The trade-off is distribution versus margin.",
        },
      ],
    },
    {
      type: "p",
      text: "Next: if fees are your concern, read [Stop losing sales to platform fees](/blog/stop-losing-sales-to-platform-fees). If you are still choosing, the wider field is in [Best platforms to sell online courses in India](/blog/best-platforms-to-sell-online-courses-india).",
    },
  ],
  sources: [
    {
      label: "Gumroad — pricing (10% + $0.50 direct, 30% Discover)",
      url: "https://gumroad.com/pricing",
      checked: "2026-10-26",
    },
    {
      label: "Gumroad Help — “Gumroad's fees” (excludes card processing)",
      url: "https://gumroad.com/help/article/66-gumroads-fees",
      checked: "2026-10-26",
    },
    {
      label: "Beevo — pricing (₹0/month, flat 8%)",
      url: "https://beevo.in/pricing",
      checked: "2026-10-26",
    },
  ],
  related: [
    "best-gumroad-alternatives-india",
    "stop-losing-sales-to-platform-fees",
    "instamojo-vs-gumroad-vs-beevo",
  ],
};
