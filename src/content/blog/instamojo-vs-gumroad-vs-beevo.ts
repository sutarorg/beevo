import type { BlogArticle } from "@/lib/blog";

export const instamojoVsGumroadVsBeevo: BlogArticle = {
  slug: "instamojo-vs-gumroad-vs-beevo",
  title: "Instamojo vs Gumroad vs Beevo: three tools, three different jobs",
  seoTitle: "Instamojo vs Gumroad vs Beevo (2026)",
  description:
    "Instamojo is a payments company, Gumroad is a global marketplace of links, Beevo is a course storefront. Fees, GST and buyer experience compared.",
  excerpt:
    "The three are not really alternatives — they are a payments company, a global selling link, and a course storefront. That difference decides it.",
  category: "Comparisons",
  tags: ["Instamojo", "Gumroad", "Beevo", "GST", "payments"],
  publishedAt: "2026-10-19",
  image: {
    src: "/images/blog/instamojo-vs-gumroad-vs-beevo.jpg",
    alt: "Three payment cards fanned out, each paired with a symbol for links, deliveries and course video",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "Instamojo charges 5% + ₹3 + 18% GST on digital goods on its store plans; Beevo charges a flat 8%; Gumroad charges 10% + $0.50 plus processing in dollars.",
    "Instamojo is checkout-first: excellent for payment links and mixed catalogues, but it does not give you a learner dashboard or lesson delivery.",
    "Gumroad is the only one of the three built for cross-border selling, and the only one that is merchant of record.",
    "Beevo is courses only, in rupees, with no marketplace — which is a strength for one audience and a hard limitation for another.",
  ],
  blocks: [
    {
      type: "p",
      text: "Three platforms get compared constantly, and the comparison usually happens in a spreadsheet of percentages. That spreadsheet will lead you to the wrong tool, because these products are not the same category.",
    },
    {
      type: "ul",
      items: [
        "**Instamojo** is an Indian payments company that gives small businesses a store and a payment link.",
        "**Gumroad** is a global selling link with a marketplace attached, priced in dollars.",
        "**Beevo** is a course storefront for a creator's own audience, priced in rupees. We build it — declared here, once, at the top.",
      ],
    },
    {
      type: "p",
      text: "Here is the comparison, including the places where we are the weaker option.",
    },
    {
      type: "h2",
      text: "Published pricing, side by side",
    },
    {
      type: "table",
      caption: "Rates as published on each platform's own pages, checked 26 October 2026",
      head: ["", "Instamojo", "Gumroad", "Beevo"],
      rows: [
        ["Monthly fee", "₹0 on the store plan", "$0", "₹0"],
        ["Digital-goods fee", "5% + ₹3 (Lite/Starter), 2% + ₹3 (Growth)", "10% + $0.50 direct; 30% Discover", "Flat 8%"],
        ["Regular-product fee", "2% + ₹3", "—", "—"],
        ["Payment processing", "Included in the fee", "2.9% + $0.30, on top", "Gateway charges settled separately"],
        ["Tax on the fee", "18% GST, stated separately", "Not applicable in the same way", "Applicable taxes per provider terms"],
        ["Currency", "Rupees", "Dollars", "Rupees"],
        ["Merchant of record", "You", "Gumroad", "You"],
      ],
      note: "“Included” does not mean free. Instamojo's 5% + ₹3 already contains the payment processing — which is why its percentage looks higher than a bare gateway's 2%.",
    },
    {
      type: "h2",
      text: "What that costs on a real rupee sale",
    },
    {
      type: "widget",
      widget: "fee-calculator",
    },
    {
      type: "p",
      text: "The calculator above uses published rates and shows its assumptions. Two things to notice when you move the slider: **the two lines converge above roughly ₹170** — below that, Instamojo's fixed ₹3 plus GST on the fee costs more than Beevo's 8% — and above it the difference stays within a couple of percentage points, which is exactly why a fee difference alone should not decide your platform.",
    },
    {
      type: "h2",
      text: "Instamojo: a payments company, and good at it",
    },
    {
      type: "p",
      text: "Instamojo's strength is breadth. Physical or digital, payment link or storefront, UPI or card, it will take the money and settle in rupees. Indian small businesses have used it for years for exactly that reason, and its published fee breakdown — including GST — is more transparent than most.",
    },
    {
      type: "ul",
      items: [
        "**Where it wins:** mixed physical + digital catalogues, payment links you can paste anywhere, a familiar Indian checkout, rupee settlement.",
        "**Where it stops:** a course is a file or a link to it. There is no curriculum, no lesson player that tracks progress, no learner dashboard, no video streaming built for lessons. You are buying a cash register, then building the classroom.",
      ],
    },
    {
      type: "h2",
      text: "Gumroad: the only cross-border option here",
    },
    {
      type: "p",
      text: "Gumroad's value is not its percentage; it is that a buyer in Toronto can pay by card in dollars without you registering for anything abroad, and Gumroad handles the sales tax as merchant of record. It also has Discover, which is real distribution for creators with no audience yet.",
    },
    {
      type: "ul",
      items: [
        "**Where it wins:** international buyers, dollar pricing, PayPal, tax handled, non-course products, a decade of operating history.",
        "**Where it stops:** 10% + $0.50 plus 2.9% + $0.30 processing on direct sales, 30% on Discover, a $100 payout minimum, and an Indian buyer staring at a dollar price and a foreign card form.",
      ],
    },
    {
      type: "h2",
      text: "Beevo: narrow on purpose",
    },
    {
      type: "p",
      text: "Beevo does one thing: a creator's course, sold to that creator's own audience, in rupees. Storefront at `/@yourname`, sales page, sections and lessons, video streaming, file attachments, Razorpay checkout, learner dashboard with progress, email receipts. ₹0/month, a flat 8% commission per successful eligible sale.",
    },
    {
      type: "ul",
      items: [
        "**Where it wins:** course delivery out of the box, rupee checkout with UPI, one simple fee, no marketplace competing for your buyer's attention, no Pro tier.",
        "**Where it stops:** no foreign-currency sales, no physical products, no discovery, no mobile app, and payouts are recorded manually by Beevo admins under the payment arrangement rather than on a self-serve schedule.",
      ],
    },
    {
      type: "callout",
      tone: "ink",
      title: "The test that cuts through all three",
      text: "Ask: “After the payment succeeds, what exactly does my buyer get, and who is responsible if it breaks?” Instamojo hands you a receipt and a file link. Gumroad hands you a library page. Beevo hands your buyer a login, a lesson list and progress tracking — and the support question comes to you either way.",
    },
    {
      type: "h2",
      text: "So which one?",
    },
    {
      type: "table",
      caption: "A blunt recommendation",
      head: ["If this is you", "Use"],
      rows: [
        ["Indian audience, selling a course, already posting somewhere", "Beevo"],
        ["Indian audience, selling mix of physical and digital", "Instamojo"],
        ["Global audience, digital downloads, want tax handled", "Gumroad"],
        ["You write code and want the cheapest per-sale rate", "A gateway's payment pages, built out yourself"],
      ],
    },
    {
      type: "p",
      text: "One caution about stacking tools: creators often pay for a course platform **and** a payment link **and** an email tool, then wonder why 20% of revenue disappears. Count the total stack, not the headline of any single vendor. If you want to see what the Beevo stack replaces, read [Features](/features); if fees are your main worry, [this breakdown](/blog/stop-losing-sales-to-platform-fees) does the arithmetic slowly.",
    },
    {
      type: "cta",
      title: "Compare it by using it",
      body: "Set up a free storefront, publish one lesson, and look at the buyer's side. Ten minutes, no card, nothing to cancel.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is Instamojo cheaper than Beevo?",
          a: "On a digital product at 5% + ₹3 + 18% GST, Instamojo's total cost works out to about 5.9% of the price plus ₹3.54, so it is marginally cheaper than Beevo's flat 8% above roughly ₹170 — and more expensive below it, because the fixed ₹3 and the GST on the fee weigh more on tiny tickets. The gap is a couple of percentage points either way; use the calculator above with your actual price.",
        },
        {
          q: "Does Beevo handle GST for me?",
          a: "No. On Beevo you are the seller, so GST registration and filing are your responsibility once you cross the applicable threshold. Gumroad is the merchant of record on its own sales; Instamojo and Beevo are not.",
        },
        {
          q: "Can I sell physical products on Beevo?",
          a: "Not today. Beevo is built around courses with sections, lessons and secure video. Physical goods with shipping and inventory belong on Instamojo, Shopify or a marketplace.",
        },
        {
          q: "Which platform pays out fastest?",
          a: "Instamojo settles through its gateway cycle (commonly T+3), with instant payout options at an extra fee. Gumroad has a $100 payout minimum. Beevo records payouts manually under the payment arrangement, subject to the provider's settlement timelines.",
        },
      ],
    },
  ],
  sources: [
    {
      label: "Instamojo — transaction fees and GST example",
      url: "https://support.instamojo.com/hc/en-us/articles/208482245-Instamojo-Transaction-Fees-No-Setup-or-Maintenance-Fees",
      checked: "2026-10-26",
    },
    {
      label: "Instamojo — convenience fees on stores (digital vs regular)",
      url: "https://support.instamojo.com/hc/en-us/articles/115000347011-Convenience-Fee-for-Instamojo-Transactions",
      checked: "2026-10-26",
    },
    { label: "Gumroad — pricing", url: "https://gumroad.com/pricing", checked: "2026-10-26" },
    { label: "Beevo — pricing", url: "https://beevo.in/pricing", checked: "2026-10-26" },
  ],
  related: ["gumroad-vs-beevo", "best-gumroad-alternatives-india", "best-platforms-to-sell-online-courses-india"],
};
