import type { BlogArticle } from "@/lib/blog";

export const sellDigitalProductsWithoutWebsite: BlogArticle = {
  slug: "sell-digital-products-india-without-website",
  title: "How to sell digital products in India without building a website",
  seoTitle: "Sell digital products in India without a website",
  description:
    "You need a link, a rupee checkout, instant delivery and a receipt — not a website. A step-by-step route for Indian creators, with the costs and the traps.",
  excerpt:
    "A domain, a designer and a two-month build are not prerequisites. Four things are. Here is the shortest honest path from product to paid.",
  category: "Selling in India",
  tags: ["digital products", "India", "UPI", "no website", "checkout"],
  publishedAt: "2026-10-10",
  image: {
    src: "/images/blog/sell-digital-products-india-without-website.jpg",
    alt: "A smartphone standing like a shop counter under a striped awning, with a download arrow and link icon above it",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "A website is optional. A checkout, instant delivery, a receipt and a way to contact you are not.",
    "For Indian buyers, UPI-first checkout and rupee pricing remove more friction than a custom domain adds.",
    "Collecting money into a personal UPI ID and delivering by DM works until it does not: no receipts, no records, no recourse.",
    "Costs are knowable in advance: Instamojo's digital-goods fee is 5% + ₹3 + 18% GST; Beevo's is a flat 8% commission per successful eligible sale.",
  ],
  blocks: [
    {
      type: "p",
      text: "The question arrives in DMs almost daily: *“I want to sell a course but I don't have a website yet — where do I start?”* The premise is the problem. You do not need a website to sell a digital product in India. You need four things, and a website is none of them.",
    },
    {
      type: "ol",
      items: [
        "**A checkout your buyer trusts**, in rupees, with UPI, cards and net-banking.",
        "**Instant delivery** the moment payment succeeds — not “screenshot me and I'll send the link”.",
        "**A receipt** the buyer can keep, and a record you can find six months later.",
        "**A way to reach you** when something breaks.",
      ],
    },
    {
      type: "p",
      text: "Everything else — domain, design, blog, logo — is marketing. Useful, eventually. Not a prerequisite.",
    },
    {
      type: "h2",
      text: "The four routes, ranked by effort",
    },
    {
      type: "table",
      caption: "Ways to sell without owning a website",
      head: ["Route", "Setup time", "Cost per sale", "What you give up"],
      rows: [
        ["Platform storefront (Beevo)", "Under an hour", "Flat 8% commission", "Custom domain, full design control"],
        ["Payment link (Razorpay/Instamojo)", "20 minutes", "~2% + GST, or 5% + ₹3 + GST", "Delivery, access control, receipts you have to build"],
        ["Marketplace listing (Gumroad, Udemy)", "An hour", "10%–30% or a revenue share", "Price control, customer ownership"],
        ["Personal UPI + DM delivery", "Five minutes", "₹0", "Everything: trust, records, disputes, scale"],
      ],
      note: "The last row is included because it is what a lot of creators actually do first. It is the most expensive option on this list once a sale goes wrong.",
    },
    {
      type: "h2",
      text: "Why the personal-UPI route fails",
    },
    {
      type: "p",
      text: "It works beautifully for the first five sales. Then one of these happens:",
    },
    {
      type: "ul",
      items: [
        "**Somebody pays and you are asleep.** They wait, assume they were scammed, and post about it.",
        "**Somebody pays the wrong amount**, or pays from a friend's account, and matching the payment to the person becomes a group-chat investigation.",
        "**Somebody asks for an invoice.** You do not have one, and you now need a business identity you have not set up.",
        "**Somebody disputes the charge.** With no order record, no terms and no delivery proof, you have nothing to show.",
        "**You cross the GST threshold without noticing.** Your records are in a WhatsApp thread.",
      ],
    },
    {
      type: "p",
      text: "A checkout solves all five at once, because it produces an order, a receipt and a delivery event — automatically, at 2 a.m.",
    },
    {
      type: "h2",
      text: "Route 1: a platform storefront (the fastest honest path)",
    },
    {
      type: "p",
      text: "On Beevo this is: sign up free, set a handle, publish a course, share `/@yourhandle`. Beevo runs Razorpay checkout in rupees, delivers the course in a learner dashboard with progress tracking, and emails a receipt. ₹0/month, flat 8% platform commission per successful eligible sale.",
    },
    {
      type: "ol",
      items: [
        "**Write the outcome sentence.** “After this course you can ______.” If you cannot finish it, fix that before you touch a signup form.",
        "**Choose the smallest sellable version.** One problem, one outcome, 45–90 minutes of video. Not your life's work.",
        "**Record on your phone.** A decent mic matters more than a camera. Vertical framing is fine for slides, landscape for talking head.",
        "**Structure it.** Three to five sections, three to six lessons each, named after the steps the buyer takes.",
        "**Attach the files** that make the price make sense: templates, checklists, presets, a worksheet.",
        "**Write the sales page like an argument**: who it is for, what changes, what is inside, what it costs, what it is not. [Pricing help is here](/blog/how-much-to-charge-online-course-india).",
        "**Set the price and publish.** A published course with one buyer teaches you more than a perfect draft.",
        "**Share one link** in your bio, in your next video description, and with the ten people most likely to want it.",
      ],
    },
    {
      type: "callout",
      tone: "lime",
      title: "The 60-second buyer test",
      text: "Open your own sales page on your phone, as a stranger. Can you tell within a minute: who this is for, what you get, what it costs, and whether you can pay with UPI? If any answer is “scroll to find out”, fix that before you promote the link.",
    },
    {
      type: "h2",
      text: "Route 2: a payment link plus your own delivery",
    },
    {
      type: "p",
      text: "If you already have a file and a way to deliver it — a private Notion page, a Drive folder with access control — a payment link can be enough. Razorpay's standard rate is about 2% + 18% GST; Instamojo's digital-goods rate is 5% + ₹3 + 18% GST, with its own worked example showing ₹937.46 arriving from a ₹1,000 payment.",
    },
    {
      type: "p",
      text: "Budget the invisible half: you must now send access after every sale, resend it when the link breaks, revoke it when someone shares it, and answer “I paid but nothing arrived” at midnight. For a ₹199 PDF that trade is often fine. For a ₹4,999 course with 40 videos, it becomes a second job.",
    },
    {
      type: "h2",
      text: "Route 3: marketplaces",
    },
    {
      type: "p",
      text: "Gumroad and Udemy will find buyers for you, which is worth real money when you have no audience. The cost is structural: Gumroad keeps 30% on Discover sales, and Udemy sets and discounts prices while owning the student relationship. Read the [Gumroad alternatives comparison](/blog/best-gumroad-alternatives-india) before committing.",
    },
    {
      type: "h2",
      text: "What about GST, invoices and terms?",
    },
    {
      type: "p",
      text: "Selling online does not change your tax position, and not having a website does not exempt you from it.",
    },
    {
      type: "ul",
      items: [
        "**GST.** Online courses and coaching are generally taxable at 18% once your aggregate turnover crosses the registration threshold — ₹20 lakh for services in most states, ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura.",
        "**Records.** Keep order-level records. A platform does this for you; a personal UPI ID does not.",
        "**Terms and refunds.** Publish them, even as a single page. Beevo's own policy is that course purchases are digital goods and non-refundable once access is granted, except where a remedy is required by law — a buyer should know that before paying, not after.",
        "**Privacy.** If you collect phone numbers or emails to deliver a product, you are handling personal data. Ask for the minimum and do not forward it anywhere.",
      ],
    },
    {
      type: "h2",
      text: "What you give up by skipping the website",
    },
    {
      type: "p",
      text: "Be clear-eyed about this: a storefront is not a website. You get a shop window, not a content engine.",
    },
    {
      type: "ul",
      items: [
        "**Search traffic.** A blog post like this one can bring strangers for years; a storefront link does not.",
        "**Email capture on your own domain.** Some platforms give you buyer emails; none gives you the SEO compounding of a site.",
        "**Custom branding.** Your storefront looks like the platform's design language, at least in part.",
      ],
    },
    {
      type: "p",
      text: "None of that matters before your first sale, and all of it matters after your hundredth. The sequence that works: **sell with someone else's plumbing → learn what buyers ask → build the website when you can afford for it to be slow and good.**",
    },
    {
      type: "cta",
      title: "A shop window in ten minutes",
      body: "Free plan, rupee checkout, instant course delivery, and one link you can paste anywhere. Publish nothing until you are ready.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Can I sell digital products in India without a company?",
          a: "Yes. Sole proprietors and individual creators sell online routinely. What you need is a PAN, a bank account, and — once turnover crosses the GST threshold — registration. If you have created an LLP or private limited company, the same rules apply at the entity level.",
        },
        {
          q: "Do I need a website to sell a course?",
          a: "No. You need a checkout, delivery, receipts and support. A platform storefront or a payment link provides the first three. A website helps with discovery and brand later; it is not a launch requirement.",
        },
        {
          q: "What is the cheapest way to start selling online in India?",
          a: "A rupee checkout with a percentage-only fee: Beevo's flat 8% or a payment link at about 2% + GST. Marketplace sales cost more per sale but can bring buyers you could not reach.",
        },
        {
          q: "How do buyers get the product after paying?",
          a: "On a platform, automatically — a learner dashboard with access, plus an emailed receipt. With a raw payment link, you send access manually, which is where most small sellers lose time and goodwill.",
        },
      ],
    },
  ],
  sources: [
    { label: "Beevo — pricing", url: "https://beevo.in/pricing", checked: "2026-10-26" },
    {
      label: "Instamojo — transaction fees and worked GST example",
      url: "https://support.instamojo.com/hc/en-us/articles/208482245-Instamojo-Transaction-Fees-No-Setup-or-Maintenance-Fees",
      checked: "2026-10-26",
    },
    {
      label: "Razorpay — pricing (standard 2% + GST)",
      url: "https://razorpay.com/pricing/",
      checked: "2026-10-26",
    },
  ],
  related: ["zero-to-first-digital-product-sale", "how-much-to-charge-online-course-india", "turn-instagram-audience-into-paying-customers"],
};
