import type { BlogArticle } from "@/lib/blog";

export const stopLosingSalesToPlatformFees: BlogArticle = {
  slug: "stop-losing-sales-to-platform-fees",
  title: "Stop losing sales to platform fees: four levers that actually move the number",
  seoTitle: "Stop losing sales to platform fees",
  description:
    "Fixed fees, processing fees and GST compound quietly. Here is how to calculate your real take-home per sale — and the four levers that change it.",
  excerpt:
    "Your platform fee is not the number you were quoted. It is the number that lands after fixed charges, processing and tax. Here is how to see it clearly.",
  category: "Pricing",
  tags: ["fees", "pricing", "Gumroad", "Instamojo", "margin"],
  publishedAt: "2026-10-22",
  image: {
    src: "/images/blog/stop-losing-sales-to-platform-fees.jpg",
    alt: "A stack of rupee coins being cut by oversized scissors under a striped shop awning",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "A quoted percentage is not your cost. Fixed per-sale charges hit small prices hardest: $0.80 of fixed fees on a $9 sale is 8.9% before any percentage applies.",
    "GST on a platform fee is charged on the fee itself — 18% on a 5% fee makes the effective cost 5.9%, not 5%.",
    "Marketplace sales can carry a 30% fee versus 10% on your own links. The most expensive fee is the one you did not choose.",
    "The four levers: your price ladder, your fee model, where the sale happens, and what you bundle.",
  ],
  blocks: [
    {
      type: "p",
      text: "Nobody minds paying for a tool that earns them money. What creators mind is discovering, three payouts later, that the number on the pricing page was never the number they paid.",
    },
    {
      type: "p",
      text: "This is a short, practical guide to the four things that actually change how much of a sale reaches your bank account — with the arithmetic shown, because the arithmetic is the entire argument.",
    },
    {
      type: "h2",
      text: "First, calculate what you really keep",
    },
    {
      type: "p",
      text: "Take one real product at one real price and subtract, in this order: **platform commission → fixed per-sale fee → payment processing → tax on the fees.** Most platform pages list these across two or three different help articles, which is exactly why the total surprises people.",
    },
    {
      type: "widget",
      widget: "fee-calculator",
    },
    {
      type: "h2",
      text: "Lever 1: fixed fees versus your price ladder",
    },
    {
      type: "p",
      text: "A percentage fee scales with price; a fixed fee does not. That means the same platform can be cheap at ₹5,000 and expensive at ₹199.",
    },
    {
      type: "table",
      caption: "The same $0.80 of fixed fees, expressed as a percentage of the sale",
      head: ["Sale price", "Fixed fees", "Fixed fees as % of sale"],
      rows: [
        ["$9", "$0.80", "8.9%"],
        ["$30", "$0.80", "2.7%"],
        ["$99", "$0.80", "0.8%"],
        ["$299", "$0.80", "0.3%"],
      ],
      note: "Fixed fees shown are Gumroad's $0.50 platform component plus its stated $0.30 card-processing component. Instamojo's ₹3 plays the same role on small rupee tickets.",
    },
    {
      type: "p",
      text: "**What to do about it:** if your platform charges a fixed amount, raise your entry price or stop selling small items one at a time. A ₹199 worksheet that costs 8% plus a fixed fee is often better as a ₹499 bundle of three worksheets — same buyer, one transaction, one fee.",
    },
    {
      type: "h2",
      text: "Lever 2: the fee model you picked",
    },
    {
      type: "p",
      text: "Most platforms offer three shapes: **pay monthly with no percentage**, **pay nothing monthly with a percentage**, or **a fixed per-sale fee with no subscription**. They are not equally good at every revenue level — the crossover points are arithmetic, not opinion.",
    },
    {
      type: "ul",
      items: [
        "**Zero monthly, percentage per sale:** free to start, costs more as you grow. Best when monthly sales are volatile or below roughly ₹20,000.",
        "**Monthly subscription, zero percentage:** costs the same whether you sell nothing or ₹5 lakh. Best once revenue is predictable and above the crossover.",
        "**Hybrid (monthly + small percentage):** worth checking against both of the above at your own average price, not at the platform's example price.",
      ],
    },
    {
      type: "p",
      text: "Worked example with published numbers: Payhip's free plan charges 5% per sale, its Plus plan charges $29/month plus 2%. At $1,000 of monthly sales, free costs $50 and Plus costs $20 + $29 = $49. The crossover sits close to $1,000 — which is why every comparison article quotes “around $967”.",
    },
    {
      type: "h2",
      text: "Lever 3: where the sale happens",
    },
    {
      type: "p",
      text: "This is the lever creators ignore, and it is the biggest one. On Gumroad, **a sale through your own link costs 10% + $0.50; a sale through Discover costs 30%.** On marketplaces generally, the fee is the price of the introduction.",
    },
    {
      type: "table",
      caption: "Gumroad's two sale routes, published rates",
      head: ["Route", "Platform fee", "Processing", "Who found the buyer"],
      rows: [
        ["Your profile or direct link", "10% + $0.50", "2.9% + $0.30 extra", "You"],
        ["Discover marketplace", "30% flat", "Included", "Gumroad"],
        ["Direct sales after $20,000/month", "5% + $0.50", "2.9% + $0.30 extra", "You"],
      ],
      note: "If most of your sales come from your own audience, you are paying a discovery fee you did not use. That is the quiet problem with marketplace pricing.",
    },
    {
      type: "callout",
      tone: "accent",
      title: "The 30% is not a rip-off — it is a pricing decision",
      text: "If a platform introduces you to a buyer who would never have found you, 30% can be a bargain, because 70% of a new customer beats 100% of nothing. The mistake is paying for discovery on sales you generated yourself.",
    },
    {
      type: "h2",
      text: "Lever 4: what you bundle, and how you price",
    },
    {
      type: "p",
      text: "Every sale carries roughly the same platform and processing overhead. So increasing the average order value is usually worth more than cutting fees by a point or two.",
    },
    {
      type: "ul",
      items: [
        "**Bundle instead of discounting.** Two ₹799 courses at ₹1,299 is one transaction, one fee, and a higher total than one ₹799 sale at 10% off.",
        "**Add a paid add-on** — a feedback pass, a template pack, a group call — rather than raising the course price across the board.",
        "**Charge in a round, trustworthy number.** ₹1,499 is easier to justify and to say out loud than ₹1,437, and it does not look like a converted dollar price.",
      ],
    },
    {
      type: "h2",
      text: "The GST line nobody mentions",
    },
    {
      type: "p",
      text: "In India, GST is charged on the platform's fee, not just on your price. Instamojo's published example is explicit: a ₹1,000 payment on a 5% + ₹3 plan attracts ₹53 in fees, then ₹9.54 of GST on that fee, leaving ₹937.46. The headline was 5%; the effect was 6.25%.",
    },
    {
      type: "table",
      caption: "Instamojo's own worked example (5% + ₹3, digital goods)",
      head: ["Line", "Amount"],
      rows: [
        ["Customer pays", "₹1,000.00"],
        ["Platform fee (5% + ₹3)", "₹53.00"],
        ["GST on the fee (18%)", "₹9.54"],
        ["Amount paid out", "₹937.46"],
      ],
      note: "Effective cost on this example: 6.25%. Their page says it plainly — which is more than most competitors do.",
    },
    {
      type: "p",
      text: "Beevo's 8% is a platform commission; gateway charges and applicable taxes are settled separately under the payment provider's terms, exactly as Gumroad treats card processing. When you compare two platforms, compare **commission + processing + tax on fees**, at your own price. Any comparison that stops at the headline percentage is marketing, including ours if we ever do it.",
    },
    {
      type: "h2",
      text: "A five-minute audit you can do today",
    },
    {
      type: "ol",
      items: [
        "Open your last ten sales. Note the gross price of each.",
        "Write down every deduction that appeared: platform fee, processing, GST, payout fee.",
        "Divide total deductions by gross revenue. That is your real cost rate.",
        "Compare it with the headline rate you thought you were paying.",
        "If the gap is more than two percentage points, one of the four levers above is loose.",
      ],
    },
    {
      type: "p",
      text: "If the gap is because you are paying a marketplace fee on your own audience, the fix is structural, not cosmetic — [see how Beevo's flat 8% works](/pricing) with no discovery fee and no fixed per-sale charge. If the gap is because your prices are too low for fixed fees, the fix is your price ladder: read [How much to charge for your online course in India](/blog/how-much-to-charge-online-course-india) next.",
    },
    {
      type: "cta",
      title: "One fee. 8%, when you sell.",
      body: "No monthly plan, no fixed per-sale charge, no Pro tier — and no marketplace taking a cut of buyers you brought yourself.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is it better to pay a monthly fee or a percentage?",
          a: "Below roughly ₹20,000 of monthly sales, percentage-only plans are usually cheaper. Above it, do the crossover maths at your own average price — the break-even depends on your price mix, not on a general rule.",
        },
        {
          q: "Why does GST make a platform fee more expensive?",
          a: "GST at 18% is charged on the platform's fee, so a 5% fee becomes roughly 5.9% and a 2% gateway fee roughly 2.36%. The tax applies to the service charge, not to your course price.",
        },
        {
          q: "Do fixed per-sale fees apply to free products?",
          a: "Usually not, because there is no transaction to charge. But a “free” download still carries support and delivery cost, which is why free lead magnets should have a clear job: creating a buyer, not just a downloader.",
        },
        {
          q: "Can I negotiate platform fees?",
          a: "On large platforms, generally no; on payment gateways, yes — Razorpay and similar providers quote custom rates for higher volumes. On Beevo, the 8% is fixed for everyone, which is the trade-off for having no tiers.",
        },
      ],
    },
  ],
  sources: [
    {
      label: "Gumroad — pricing (10%/30% routes, $0.50 component)",
      url: "https://gumroad.com/pricing",
      checked: "2026-10-26",
    },
    {
      label: "Gumroad Help — fees exclude 2.9% + $0.30 processing",
      url: "https://gumroad.com/help/article/66-gumroads-fees",
      checked: "2026-10-26",
    },
    {
      label: "Instamojo — worked example with GST on the fee",
      url: "https://support.instamojo.com/hc/en-us/articles/208482245-Instamojo-Transaction-Fees-No-Setup-or-Maintenance-Fees",
      checked: "2026-10-26",
    },
    { label: "Payhip — pricing ($0/5%, $29/2%, $99/0%)", url: "https://payhip.com/pricing", checked: "2026-10-26" },
    { label: "Beevo — pricing", url: "https://beevo.in/pricing", checked: "2026-10-26" },
  ],
  related: ["how-much-to-charge-online-course-india", "gumroad-vs-beevo", "instamojo-vs-gumroad-vs-beevo"],
};
