import type { BlogArticle } from "@/lib/blog";

export const sellingCoursesOnWhatsApp: BlogArticle = {
  slug: "selling-courses-on-whatsapp",
  title: "Selling courses on WhatsApp: what works and what gets you blocked",
  seoTitle: "Selling courses on WhatsApp: what works",
  description:
    "WhatsApp is India's best delivery channel for course sales and its fastest way to lose an audience. The rules, the scripts, and the traps that get numbers reported.",
  excerpt:
    "WhatsApp converts better than email in India and punishes bad manners faster than any other channel. Here is how to sell on it without being reported.",
  category: "Audience",
  tags: ["WhatsApp", "audience", "consent", "India", "selling"],
  publishedAt: "2026-09-30",
  image: {
    src: "/images/blog/selling-courses-on-whatsapp.jpg",
    alt: "Overlapping speech bubbles around a phone — one holding a course tile, one with an X — and two notification bells",
    width: 1200,
    height: 675,
  },
  takeaways: [
    "WhatsApp works for warm, consented, one-to-one conversations — and fails badly for cold broadcasts.",
    "Meta requires opt-in before you message anyone, and outside a 24-hour service window you may only send approved templates.",
    "On the free WhatsApp Business app, a broadcast list is capped at 256 contacts who must have saved your number.",
    "Sell the link, deliver the course elsewhere. Sending files and taking payment screenshots on WhatsApp creates refund and record problems.",
  ],
  blocks: [
    {
      type: "p",
      text: "For an Indian creator, WhatsApp is where the audience actually lives. Open rates are absurd compared with email, replies arrive in minutes, and a voice note can answer a question better than a paragraph. It is also the channel most likely to get a creator reported, blocked, or quietly muted forever.",
    },
    {
      type: "p",
      text: "The difference is not tone. It is **consent and structure**. Here is what works, what does not, and the platform rules you must not learn the hard way.",
    },
    {
      type: "h2",
      text: "What WhatsApp is genuinely good at",
    },
    {
      type: "ol",
      items: [
        "**Answering a question a buyer already asked.** One-to-one, specific, fast. This is the highest-converting sales motion that exists in India.",
        "**Post-purchase support.** “The video won't play” answered in four minutes turns a refund into a testimonial.",
        "**Small cohorts.** A 20-person group for a live cohort or a feedback round is manageable, useful, and feels like a classroom.",
        "**Status as a soft channel.** People who tap your status opted into your presence. A short clip of what you are building is low-pressure.",
      ],
    },
    {
      type: "h2",
      text: "What gets you blocked (and sometimes banned)",
    },
    {
      type: "table",
      caption: "The four reliable ways to lose a WhatsApp audience",
      head: ["Behaviour", "Why it backfires"],
      rows: [
        ["Adding people to a group without asking", "Nobody wants their number visible in a stranger's group; they leave and remember"],
        ["Broadcasting to a list you did not collect", "Meta's policy requires opt-in; reports lead to quality drops and bans"],
        ["Forwarding the same sales message weekly", "The difference between a person and a spammer is whether the message is expected"],
        ["Taking payment by screenshot", "No receipt, no order record, no recourse — for either side"],
      ],
      note: "Meta's Business messaging policy is explicit: you may only start a conversation with an approved message template, and opt-in is required before you message anyone.",
    },
    {
      type: "h2",
      text: "The rules, in plain English",
    },
    {
      type: "ul",
      items: [
        "**Opt-in first.** A person who clicked your link, bought from you, or explicitly said “send it to me” is opted in for that conversation. A number scraped from a group is not.",
        "**24-hour window.** Inside 24 hours of the user's last message you can reply freely. Outside it, on the API, you may only send approved templates — and templates are categorised as marketing, utility or authentication.",
        "**Marketing vs utility.** An order update with a promo inside is treated as marketing. Keep utility messages about the order and nothing else.",
        "**Business App limits.** The free WhatsApp Business app supports broadcast lists up to 256 contacts, and recipients must have saved your number to receive them.",
        "**Opt-out.** Every marketing message should make it trivial to stop. A “reply STOP” line is enough.",
      ],
    },
    {
      type: "callout",
      tone: "accent",
      title: "The compliance line worth memorising",
      text: "“Everyone who bought from us before” is not WhatsApp consent. Consent must be specific, informed and recorded — a checkbox on a form that names your business and says you will message them there.",
    },
    {
      type: "h2",
      text: "The structure that actually converts",
    },
    {
      type: "table",
      caption: "A WhatsApp sales flow with consent built in",
      head: ["Stage", "Message", "Why it works"],
      rows: [
        ["Trigger", "They reply to a story or comment on a post", "They moved first"],
        ["Answer", "A 3-line answer to their actual question, no link", "Proves you are a person, not a bot"],
        ["Offer", "“There's a full version of this — ₹1,499, link if you want it”", "Price stated plainly, one link"],
        ["Objection", "“Is it for beginners?” → answer, then stop", "No pressure, no script"],
        ["Follow-up", "One message after 3–4 days, then silence", "Respects attention"],
        ["Delivery", "Checkout link → automatic access + receipt", "Records exist; you are not the delivery system"],
      ],
      note: "The purchase happens on a checkout page, not in the chat. That is what produces a receipt, an order record and a support path.",
    },
    {
      type: "h2",
      text: "Scripts that sound like a human",
    },
    {
      type: "h3",
      text: "When someone asks “price?” in the comments",
    },
    {
      type: "quote",
      text: "Just DMed you so I don't spam your comments 🙏 — ₹1,499 for the whole course, ₹499 if you only want the worksheet pack. Both are on one page, want me to send it?",
    },
    {
      type: "h3",
      text: "When someone has not replied after four days",
    },
    {
      type: "quote",
      text: "No pressure at all — just checking whether the price was the blocker or the level. If it's the price, the ₹499 version might be a better fit.",
    },
    {
      type: "h3",
      text: "When a buyer says “my video isn't opening”",
    },
    {
      type: "quote",
      text: "Sorry about that — open the course from the email receipt rather than the chat link, then tap the lesson again. If it still fails, tell me the phone model and I'll test it on mine.",
    },
    {
      type: "h2",
      text: "Groups: useful, if they are small and voluntary",
    },
    {
      type: "ul",
      items: [
        "**Cohort groups work.** 15–30 people, a start date, a stated purpose, and an end date. “This group closes on the 30th” prevents zombie groups.",
        "**Announcement groups need rules.** State the post cadence on day one; one message a day is the ceiling for most people.",
        "**Do not mix buyers and prospects** in one group. Buyers will talk about the content; prospects will feel sold to.",
        "**Move delivery out of the chat.** Lesson links, files and updates belong on your course platform, not in a pinned chat history.",
      ],
    },
    {
      type: "h2",
      text: "What about WhatsApp Channels?",
    },
    {
      type: "p",
      text: "Channels are one-to-many and lower-pressure than groups: followers choose to follow, nobody sees anyone else's number, and updates read like broadcasts. They are a reasonable home for “what I'm building” updates and a poor place to run a sales conversation, because replies still need to happen one-to-one.",
    },
    {
      type: "h2",
      text: "The delivery question nobody asks early enough",
    },
    {
      type: "p",
      text: "If you sell on WhatsApp and deliver on WhatsApp, you end up with 40 chat threads containing files, and a support burden you cannot search. Two months later, someone asks for a receipt and you cannot produce one.",
    },
    {
      type: "p",
      text: "Keep the chat as the **relationship** layer, and let a checkout and a learner dashboard be the **delivery** layer. On Beevo, a buyer gets a receipt, a login and their lessons tracked — and you keep the WhatsApp thread for the conversations that actually need you. [Start here](/signup) if you want to see what that looks like.",
    },
    {
      type: "h2",
      text: "A one-week checklist",
    },
    {
      type: "ol",
      items: [
        "Add one line to your link-in-bio form: “I'd like course updates on WhatsApp” — with a checkbox, not preselected.",
        "Write down where each consent came from. A spreadsheet column is enough.",
        "Set up your storefront link and use it in every price reply.",
        "Delete any group you cannot describe the purpose of in one sentence.",
        "Put a “reply STOP” line on anything you send to more than five people at once.",
      ],
    },
    {
      type: "cta",
      title: "Chat on WhatsApp, sell on a checkout",
      body: "A Beevo storefront gives every buyer a receipt, instant access and a place to watch lessons — so your DMs stay conversations, not customer support tickets.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Can I sell directly on WhatsApp?",
          a: "You can have the conversation there, but taking payment and sending files in chat leaves you without receipts, order records or access control. Send buyers to a checkout and keep WhatsApp for support and follow-up.",
        },
        {
          q: "How many people can I broadcast to on WhatsApp Business?",
          a: "The free WhatsApp Business app caps a broadcast list at 256 contacts, and those people must have saved your number. The Business Platform (API) supports much larger audiences, but requires opt-in and approved message templates outside the 24-hour service window.",
        },
        {
          q: "Do I need consent to message a customer on WhatsApp?",
          a: "Yes. Meta's Business messaging policy requires opt-in before you message someone, and the consent should name your business and what they will receive. A purchase alone is not marketing consent.",
        },
        {
          q: "Are WhatsApp Channels good for selling courses?",
          a: "They are good for low-pressure updates to people who chose to follow you. They are a poor replacement for a sales page, because you cannot show a curriculum, a price table and a checkout in one organised place.",
        },
      ],
    },
  ],
  sources: [
    {
      label: "WhatsApp Business — Business Policy (opt-in, templates, 24-hour window)",
      url: "https://whatsappbusiness.com/policy/",
      checked: "2026-10-26",
    },
    {
      label: "Meta for Developers — getting opt-in for WhatsApp",
      url: "https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in",
      checked: "2026-10-26",
    },
    { label: "Beevo — pricing", url: "https://beevo.in/pricing", checked: "2026-10-26" },
  ],
  related: ["turn-instagram-audience-into-paying-customers", "sell-digital-products-india-without-website", "zero-to-first-digital-product-sale"],
};
