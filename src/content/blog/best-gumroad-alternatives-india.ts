import type { BlogArticle } from "@/lib/blog";

export const bestGumroadAlternatives: BlogArticle = {
  slug: "best-gumroad-alternatives-india",
  title: "Best Gumroad alternatives for Indian creators (2026)",
  seoTitle: "Best Gumroad alternatives for Indian creators (2026)",
  description:
    "Payhip, Lemon Squeezy, Instamojo, Razorpay payment pages and Beevo — what each costs, who each is really for, and how to pick without overpaying.",
  excerpt:
    "Five real alternatives, their published fees, and the one question that settles the choice faster than any feature grid.",
  category: "Comparisons",
  tags: ["Gumroad", "Payhip", "Lemon Squeezy", "Instamojo", "alternatives"],
  publishedAt: "2026-10-24",
  image: {
    src: "/images/blog/best-gumroad-alternatives-india.jpg",
    alt: "A signpost with three arrows in different colours, a moving box and a stack of coins at its base",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "The honest shortlist for an Indian creator is Payhip, Lemon Squeezy, Instamojo, Razorpay payment pages, and Beevo.",
    "Only Instamojo and Beevo price and settle in rupees; the rest bill in dollars.",
    "Published rates: Payhip 5% on free, Lemon Squeezy 5% + $0.50, Instamojo 5% + ₹3 + GST on digital goods, Beevo a flat 8%.",
    "A “5%” platform fee is not cheaper than an 8% one if the 5% charges in dollars to rupee buyers.",
    "We build Beevo, so read our entry with that bias declared — the comparison table below includes the numbers that make us look worse.",
  ],
  blocks: [
    {
      type: "p",
      text: "Gumroad is the default recommendation for “sell a digital product online”, and for a creator selling in dollars to a global audience it is still a reasonable default. But it charges **10% + $0.50 per direct sale plus card processing**, pays out in dollars, and keeps a **$100 minimum payout**. For an Indian creator whose buyers are on UPI, each of those is friction.",
    },
    {
      type: "p",
      text: "Here are five real alternatives, with their published fees and the specific creator each one fits. **Disclosure: we build Beevo**, which is one of the five. We have written the entry for Beevo the way we would want a competitor to write it — including what it cannot do.",
    },
    {
      type: "h2",
      text: "The shortlist, in one table",
    },
    {
      type: "table",
      caption: "Published pricing, checked 26 October 2026",
      head: ["Platform", "Monthly", "Per-sale fee", "Currency", "Best for"],
      rows: [
        ["Gumroad", "$0", "10% + $0.50, plus 2.9% + $0.30 processing", "USD", "Global audience, non-course products"],
        ["Payhip", "$0 / $29 / $99", "5% / 2% / 0%, plus Stripe or PayPal fees", "USD", "Downloads and memberships, low volume"],
        ["Lemon Squeezy", "$0", "5% + $0.50, +1.5% international", "USD", "Selling software globally, tax handled"],
        ["Instamojo", "₹0 store plan", "5% + ₹3 + 18% GST on digital goods", "INR", "Mixed physical + digital, Indian buyers"],
        ["Razorpay payment pages", "₹0", "~2% + 18% GST gateway fee", "INR", "You already have a site and a developer"],
        ["Beevo", "₹0", "Flat 8% platform commission", "INR", "Courses sold to your own Indian audience"],
      ],
      note: "Every row except the last two involves a dollar price. If your buyers pay in rupees, the exchange rate is part of your fee — the rate you see and the rate you settle at are rarely identical.",
    },
    {
      type: "h2",
      text: "1. Payhip — the cheapest percentage, if you are already global",
    },
    {
      type: "p",
      text: "Payhip runs three plans on identical features: **Free at 5% per sale, Plus at $29/month with 2%, and Pro at $99/month with 0%**, with Stripe or PayPal processing on top of all three. The published advice is that Plus starts paying for itself somewhere around $1,000–1,500 a month in sales, and Pro past roughly $3,500 — do that maths on your own numbers, because it depends on your average price.",
    },
    {
      type: "ul",
      items: [
        "**Good for:** digital downloads, memberships, and simple courses; anyone already comfortable with Stripe.",
        "**Watch out for:** processing fees are separate; Payhip is not the merchant of record for most taxes, so EU/UK VAT is handled but other jurisdictions are your problem; and prices are in USD.",
      ],
    },
    {
      type: "h2",
      text: "2. Lemon Squeezy — merchant of record, aimed at software",
    },
    {
      type: "p",
      text: "Lemon Squeezy charges **5% + $0.50 per transaction with no monthly fee**, and adds 1.5% for international transactions, 1.5% for PayPal and 0.5% for subscription payments. In exchange it acts as merchant of record, which means it is the legal seller, files sales tax and VAT, and absorbs chargeback liability. It is owned by Stripe and is being steered toward Stripe Managed Payments — worth knowing before you build a business on it.",
    },
    {
      type: "ul",
      items: [
        "**Good for:** selling software licences, SaaS-style products, or anything where tax compliance across many countries would otherwise be your job.",
        "**Watch out for:** it is engineered for global digital goods, not rupee course sales; domestic Indian cards and UPI are not its centre of gravity; the platform's own future path is a migration to Stripe.",
      ],
    },
    {
      type: "h2",
      text: "3. Instamojo — the Indian workhorse for mixed catalogues",
    },
    {
      type: "p",
      text: "Instamojo publishes **5% + ₹3 on digital goods and 2% + ₹3 on regular products on its store plans, with 18% GST charged on the fee itself**, and its Growth plan drops the percentage on regular products to 2%. Payment links are priced separately at around 3% + ₹3. It is a genuine Indian payments company with UPI support and rupee settlement, which is why so many small Indian businesses start there.",
    },
    {
      type: "ul",
      items: [
        "**Good for:** sellers mixing physical goods with digital ones, and anyone who needs a payment link more than a course platform.",
        "**Watch out for:** a course is not its native shape — there is no learner dashboard tracking lesson progress, no curriculum structure, and no built-in video streaming for lessons. You are buying checkout, not a classroom.",
      ],
    },
    {
      type: "h2",
      text: "4. Razorpay payment pages — the do-it-yourself route",
    },
    {
      type: "p",
      text: "Razorpay's standard platform fee is about **2% + 18% GST** on domestic transactions with no setup or annual fee, and UPI carries zero MDR by RBI mandate while still attracting the gateway's platform fee. You can create a payment page in minutes and deliver the course by email or a private link. On paper it is the cheapest per-sale option on this list by a distance.",
    },
    {
      type: "ul",
      items: [
        "**Good for:** creators with a website, a developer, or a strong ops instinct.",
        "**Watch out for:** you are building the rest yourself — access control, receipts, refunds, a place to actually watch the videos, and support when a buyer cannot log in. The 2% is the cheapest line item and the most expensive total, in hours.",
      ],
    },
    {
      type: "h2",
      text: "5. Beevo — rupees, flat 8%, courses only",
    },
    {
      type: "p",
      text: "Beevo is a creator storefront at `/@yourname` with course sales pages, secure Razorpay checkout in rupees, a learner dashboard, and email receipts. Pricing is **₹0/month and a flat 8% platform commission per successful eligible sale**, with gateway charges and applicable taxes settled separately under the provider's terms. There is no marketplace, no Pro plan, and no per-transaction fixed fee.",
    },
    {
      type: "ul",
      items: [
        "**Good for:** an Indian creator with an existing audience selling a course priced in rupees.",
        "**Watch out for:** no foreign-currency checkout, no mobile app, payouts recorded manually by Beevo admins under the payment arrangement, and no discovery — nobody finds you through Beevo, by design. If you need a catalogue to shop in, we are the wrong tool.",
      ],
    },
    {
      type: "h2",
      text: "The question that settles it in thirty seconds",
    },
    {
      type: "p",
      text: "Not “which is cheapest” — **which currency does my buyer hold?**",
    },
    {
      type: "ol",
      items: [
        "**Rupees, paid by UPI.** Your shortlist is Instamojo, Razorpay pages and Beevo. A dollar-priced platform adds conversion and a checkout your buyer may not trust.",
        "**Dollars, paid by card or PayPal.** Your shortlist is Payhip, Lemon Squeezy and Gumroad. Rupee platforms cannot take the payment cleanly.",
        "**Both.** Pick the primary one and treat the other as a second shop. Running two catalogues badly is worse than running one well.",
      ],
    },
    {
      type: "callout",
      tone: "lime",
      title: "A fee rule worth taping to your monitor",
      text: "Compare effective cost at your actual price, not headline percentages. A 5% fee plus 2.9% + $0.30 processing on a $9 product is 21.8%. An 8% fee with no fixed component on a ₹499 product is 8%. The percentage you were quoted and the percentage you paid are rarely the same number.",
    },
    {
      type: "h2",
      text: "What we would tell a friend",
    },
    {
      type: "ul",
      items: [
        "**Selling a first course to your own Instagram or YouTube audience in India?** Beevo. The 8% is the whole fee structure, and the buyer experience is built for a phone.",
        "**Selling templates or e-books to a global list?** Payhip's free plan, or Gumroad if you want Discover.",
        "**Selling software or anything with tax complexity abroad?** Lemon Squeezy, with an eye on the Stripe migration.",
        "**Already have a site and someone technical?** Razorpay pages and keep the 2%.",
      ],
    },
    {
      type: "cta",
      title: "See the sales page before you compare anything else",
      body: "A free Beevo storefront takes about ten minutes to set up. Publish nothing, share nothing, and just look at what your buyers would see.",
    },
    {
      type: "faq",
      items: [
        {
          q: "What is the cheapest Gumroad alternative for Indian creators?",
          a: "By percentage alone, a Razorpay payment page at roughly 2% + GST is cheapest — but it is only checkout, and you build delivery, access control and support yourself. Among hosted platforms, Beevo's flat 8% has no fixed fee, and Instamojo's 5% + ₹3 + GST is comparable on higher-priced digital goods.",
        },
        {
          q: "Do any of these platforms pay out in rupees?",
          a: "Instamojo and Beevo settle in rupees. Gumroad, Payhip and Lemon Squeezy price in US dollars, so an Indian seller receives a converted payout with the exchange rate applied by the platform or bank.",
        },
        {
          q: "Which alternative has no monthly fee?",
          a: "Gumroad, Lemon Squeezy, Beevo, Instamojo's store plan and Payhip's Free plan all have ₹0/$0 monthly tiers. Payhip's $29 Plus and $99 Pro plans trade a monthly fee for a lower percentage.",
        },
        {
          q: "Can I migrate my Gumroad products to Beevo?",
          a: "Courses need to be re-created as Beevo courses — sections, lessons, video uploads and files. There is no one-click import. Creators usually rebuild the flagship course first and leave the long tail on Gumroad.",
        },
      ],
    },
  ],
  sources: [
    { label: "Gumroad — pricing", url: "https://gumroad.com/pricing", checked: "2026-10-26" },
    { label: "Payhip — pricing", url: "https://payhip.com/pricing", checked: "2026-10-26" },
    {
      label: "Lemon Squeezy — pricing",
      url: "https://www.lemonsqueezy.com/pricing",
      checked: "2026-10-26",
    },
    {
      label: "Instamojo — transaction fees (digital goods 5% + ₹3 + GST)",
      url: "https://support.instamojo.com/hc/en-us/articles/208482245-Instamojo-Transaction-Fees-No-Setup-or-Maintenance-Fees",
      checked: "2026-10-26",
    },
    {
      label: "Razorpay — pricing (2% + 18% GST, zero MDR on UPI)",
      url: "https://razorpay.com/pricing/",
      checked: "2026-10-26",
    },
    { label: "Beevo — pricing", url: "https://beevo.in/pricing", checked: "2026-10-26" },
  ],
  related: ["gumroad-vs-beevo", "instamojo-vs-gumroad-vs-beevo", "stop-losing-sales-to-platform-fees"],
};
