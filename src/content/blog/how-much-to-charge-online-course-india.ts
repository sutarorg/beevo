import type { BlogArticle } from "@/lib/blog";

export const howMuchToCharge: BlogArticle = {
  slug: "how-much-to-charge-online-course-india",
  title: "How much should you charge for your online course in India?",
  seoTitle: "What to charge for an online course in India",
  description:
    "A pricing method that does not rely on guesswork: four anchors, a cost floor, the take-home maths after fees, and the three-tier structure that beats one price.",
  excerpt:
    "Most Indian creators underprice by reflex, then discount to compensate. Here is a method that starts from the outcome and ends with a number you can say out loud.",
  category: "Pricing",
  tags: ["pricing", "course pricing", "India", "GST", "launch"],
  publishedAt: "2026-10-13",
  image: {
    src: "/images/blog/how-much-to-charge-online-course-india.jpg",
    alt: "A large blank price tag hanging above a stack of course tiles, with a calculator and scattered coins",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "Price against the outcome the buyer gets, not against the hours you spent recording.",
    "Build a cost floor — hours, tools, payment fees — so you know the number below which the course is a loss.",
    "Three tiers (front door, core, premium) usually beat one price, because different buyers have different budgets for the same outcome.",
    "At ₹1,499, Beevo's 8% commission is ₹119.92; at ₹499 it is ₹39.92. Percentage fees never make a cheap price expensive — but a bad price makes a good course invisible.",
  ],
  blocks: [
    {
      type: "p",
      text: "Almost every pricing question in Indian creator communities is the same question wearing different clothes: *how do I know what my course is worth without insulting myself or pricing myself out?*",
    },
    {
      type: "p",
      text: "Here is a method. It has four inputs, one formula, and one output you can defend in a conversation with a buyer. It does not require you to survey the market, and it does not require you to lie about scarcity.",
    },
    {
      type: "h2",
      text: "Step 1: price the outcome, not the recording",
    },
    {
      type: "p",
      text: "Your buyer is not paying for 4 hours of video. They are paying to **stop doing something badly**, to **skip a period of trial and error**, or to **pass a gate** — a job, an exam, a client brief, a portfolio review. Write that sentence down before you write a number:",
    },
    {
      type: "quote",
      text: "After this course, the buyer can ______, which they could not do before, and which is worth ₹______ to them per month or per project.",
      attribution: "The only pricing question that matters",
    },
    {
      type: "p",
      text: "If you cannot fill in the second blank, you do not have a pricing problem; you have a positioning problem. A course that saves a freelance video editor two hours per project is worth a different number than a course that saves a hobbyist an afternoon.",
    },
    {
      type: "h2",
      text: "Step 2: collect four anchors before you invent a number",
    },
    {
      type: "p",
      text: "Spend forty minutes collecting these, in this order. Write the actual numbers down; do not average them, because a marketplace price and a personal-brand price are not comparable units.",
    },
    {
      type: "ol",
      items: [
        "**Free.** YouTube, your own Reels, a public blog. This is the anchor your buyer will compare you to when they hesitate. Your course must offer something free content cannot: sequence, feedback, files, accountability, a certificate, or speed.",
        "**Cheap marketplaces.** Udemy-style pricing, where the platform sets and discounts the price. Useful for volume, useless as a value signal — the same course can sell for ₹449 in a sale.",
        "**Direct-sale competitors.** Five Indian creators selling a similar outcome from their own storefront. Open their pages today and record price, lesson count, hours, and what is included.",
        "**Premium cohort or 1:1 alternatives.** Live programmes and coaching that solve the same problem with human time. These set the ceiling; your self-paced course should sit below them and above free.",
      ],
    },
    {
      type: "callout",
      tone: "accent",
      title: "Never price from a screenshot of somebody else's sale",
      text: "A discounted price is a marketing event, not a value statement. If three competitors are running a festive discount, their list price — not their discounted price — is the anchor you compare against.",
    },
    {
      type: "h2",
      text: "Step 3: calculate your floor",
    },
    {
      type: "p",
      text: "A floor is the price below which the course is not worth running. It is not your target price; it stops you from launching at a number that quietly costs you money for a year.",
    },
    {
      type: "table",
      caption: "A simple floor calculation",
      head: ["Line", "Example", "How to fill it in"],
      rows: [
        ["Recording + editing hours", "30 hours", "Count real hours, including retakes"],
        ["Your hourly replacement cost", "₹800", "What you would pay a competent freelancer"],
        ["Labour cost", "₹24,000", "Hours × rate"],
        ["Tools and assets", "₹3,000", "Mic, lighting, editing software, stock music"],
        ["Support time per cohort", "6 hours", "Answering questions for 3 months"],
        ["Target number of sales", "40 in year one", "Be conservative"],
        ["Cost per sale", "₹675", "Total cost ÷ target sales"],
        ["Fee and GST buffer", "≈10%", "Platform commission plus gateway charges"],
        ["**Floor price**", "**≈₹750**", "Cost per sale ÷ (1 − fee %)"],
      ],
      note: "The arithmetic is illustrative. Replace every number with yours — the point is that a floor exists and it is usually higher than the ₹299 that creators reflexively pick.",
    },
    {
      type: "h2",
      text: "Step 4: set three tiers, not one price",
    },
    {
      type: "p",
      text: "One price forces every buyer into one decision: yes or no. Three prices let a hesitant buyer choose a smaller yes, and let your most motivated buyer pay more for access. You do not need three separate courses — you need three levels of access to the same core.",
    },
    {
      type: "table",
      caption: "A three-tier structure that works for a first course",
      head: ["Tier", "Typical Indian range", "What it includes", "Who it is for"],
      rows: [
        ["Front door", "₹299–₹699", "Core lessons, no extras", "Price-sensitive followers, list building"],
        ["Core", "₹1,499–₹2,999", "Core lessons + files/templates + email support", "The buyer who actually wants the outcome"],
        ["Premium", "₹4,999–₹9,999", "Core + live review call, feedback, or a small group", "Professionals spending company money"],
      ],
      note: "Ranges are observation from the Indian creator market, not survey data. Use them as a starting bracket, then adjust to your own audience's behaviour.",
    },
    {
      type: "h3",
      text: "What the tier names should be",
    },
    {
      type: "p",
      text: "Not “Basic / Standard / Premium” — those describe packaging, not outcomes. Use language the buyer would use: **Self-paced**, **With feedback**, **With a review call**. The name should make the upgrade obvious without a comparison table.",
    },
    {
      type: "h2",
      text: "Step 5: look at what actually lands in your account",
    },
    {
      type: "p",
      text: "A price is not revenue. Subtract the platform's cut and the gateway's charge before you decide whether a tier is worth running — especially at the front door, where fixed fees are proportionally larger.",
    },
    {
      type: "table",
      caption: "Beevo: flat 8% platform commission, before gateway charges",
      head: ["Price", "Platform commission", "Creator share", "Why this price band is used"],
      rows: [
        ["₹499", "₹39.92", "₹459.08", "Front door; impulse purchase"],
        ["₹1,499", "₹119.92", "₹1,379.08", "Core course with files"],
        ["₹2,999", "₹239.92", "₹2,759.08", "Course with a review call"],
        ["₹4,999", "₹399.92", "₹4,599.08", "Course with cohort access"],
      ],
      note: "Gateway charges and applicable taxes are settled separately under the payment provider's terms, so ₹1,379.08 is what remains after Beevo's commission, not after everything.",
    },
    {
      type: "p",
      text: "If you sell through a marketplace instead, model a much bigger cut. Gumroad's Discover sales are 30%; a $30 direct sale costs 10% + $0.50 plus 2.9% + $0.30 processing, about 15.6% in total. The [fee comparison](/blog/stop-losing-sales-to-platform-fees) walks through the arithmetic in detail.",
    },
    {
      type: "h2",
      text: "Step 6: when to raise the price",
    },
    {
      type: "p",
      text: "Raise it when you see any two of these, not when you feel brave:",
    },
    {
      type: "ul",
      items: [
        "**You sell out your support capacity.** If you are answering the same question twelve times, the price is too low for the access you are giving.",
        "**Buyers stop asking about price.** When nobody flinches, the number is below the value you deliver.",
        "**You added something real.** A new module, templates, a group call, a certificate. Raise on the day you add it, not six months later.",
        "**You are attracting the wrong buyer.** Underpricing attracts people who want a ₹199 outcome, and they consume the most support per rupee.",
      ],
    },
    {
      type: "h3",
      text: "How to raise it without upsetting existing buyers",
    },
    {
      type: "p",
      text: "Announce the date, keep the old price for people already in the room, and give past students the new materials for free. Nothing builds trust faster than a creator who does not retroactively punish early buyers.",
    },
    {
      type: "h2",
      text: "Four pricing mistakes that are very Indian-creator specific",
    },
    {
      type: "ol",
      items: [
        "**Converting a dollar price.** $49 is not ₹4,000 in value; the buyer's reference point is Indian alternatives, not Gumroad's homepage. Price the outcome locally.",
        "**Launching with a discount “to get momentum”.** It teaches every early buyer to wait for the next sale. Launch at your real price with a real first-cohort benefit instead.",
        "**Forgetting GST.** Online courses and coaching are generally 18% GST once your aggregate turnover crosses the threshold — ₹20 lakh for services in most states, ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura. Your margin should survive that day.",
        "**Pricing for the audience you wish you had.** A ₹9,999 course needs a buyer with a budget. If your list is students, price the front door for students and build the expensive tier for professionals.",
      ],
    },
    {
      type: "callout",
      tone: "ink",
      title: "Remember the refund conversation",
      text: "Beevo course purchases are digital goods and are non-refundable once access is granted — except where a refund or other remedy is required by applicable law, which always prevails. A higher price raises the stakes on your sales page: state what is included, what is not, and who the course is not for.",
    },
    {
      type: "h2",
      text: "A default answer, if you want one",
    },
    {
      type: "p",
      text: "If your audience is 1,000–10,000 engaged followers, your course is self-paced with files, and the outcome is a freelance or creative skill: **launch at ₹1,499, with a ₹499 front-door version and a ₹4,999 version that includes one live review.** Then raise the core tier by 30% after your twentieth sale if support load allows.",
    },
    {
      type: "p",
      text: "That is a starting position, not a law. The useful part is the method: outcome, anchors, floor, tiers, take-home. Run it once, write the numbers on one page, and stop re-deciding your price every time someone leaves a comment.",
    },
    {
      type: "cta",
      title: "Put the price on a real sales page",
      body: "A Beevo storefront is free to set up. Publish a draft course at your chosen price and see how it reads on a phone — that is the moment pricing stops being abstract.",
    },
    {
      type: "faq",
      items: [
        {
          q: "How much should I charge for my first online course in India?",
          a: "For a self-paced skill course sold to an existing audience, a ₹1,499 core price with a ₹499 entry version is a reasonable starting point, provided it clears your cost floor. If your audience is students or the outcome is small, start lower; if you are selling to professionals who expense it, start at ₹2,999–₹4,999.",
        },
        {
          q: "Is ₹499 too cheap for a course?",
          a: "It is a fine front-door price and a poor core price. At ₹499 a platform percentage fee is irrelevant, but your support time, payment fees and review calls are not. Keep ₹499 for a stripped-down product and put your main course above it.",
        },
        {
          q: "Should I offer a discount at launch?",
          a: "Offer a launch benefit — a live session, a bonus template, a feedback round — rather than a permanent-looking discount. Discounting your first cohort is hard to reverse; adding value is not.",
        },
        {
          q: "Do I need to charge GST on my course price?",
          a: "Generally, online courses and coaching are taxable at 18% GST once your aggregate turnover crosses the registration threshold — ₹20 lakh for services in most states, ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura. Below it, registration is usually not mandatory for a purely intra-state service business. Confirm your own position with a CA.",
        },
      ],
    },
  ],
  sources: [
    { label: "Beevo — pricing and the 8% commission", url: "https://beevo.in/pricing", checked: "2026-10-26" },
    {
      label: "GST registration thresholds — services ₹20 lakh, ₹10 lakh in four states",
      url: "https://gst.gov.in/",
      checked: "2026-10-26",
    },
    {
      label: "Gumroad — pricing (for the marketplace comparison)",
      url: "https://gumroad.com/pricing",
      checked: "2026-10-26",
    },
  ],
  related: ["stop-losing-sales-to-platform-fees", "zero-to-first-digital-product-sale", "best-platforms-to-sell-online-courses-india"],
};
