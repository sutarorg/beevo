import { APP_NAME, APP_URL, SUPPORT_EMAIL } from "@/lib/config";
import { PLATFORM_COMMISSION_LABEL } from "@/lib/domain";

/**
 * Centralized legal & policy copy.
 *
 * Every legal page renders from this single module so policy updates never
 * require editing multiple pages. This copy is a working template prepared
 * for product development — it is not legal advice, and the operator should
 * have it reviewed by qualified counsel before launch.
 */

export const LEGAL_LAST_UPDATED = "5 January 2026";

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    heading: "1. Agreement",
    paragraphs: [
      `These Terms of Service ("Terms") govern your access to and use of ${APP_NAME} (${APP_URL}), a platform that lets independent creators publish and sell online courses directly to their own audiences. By creating an account or using the service you agree to these Terms. If you do not agree, please do not use the service.`,
      `${APP_NAME} is not a marketplace: we do not operate a public course catalogue, we do not rank or recommend courses, and creators are responsible for bringing their own audience through their own links.`,
    ],
  },
  {
    id: "accounts",
    heading: "2. Accounts",
    paragraphs: [
      "You must provide accurate information when creating an account, keep your credentials secure, and be at least 18 years old or the age of majority in your jurisdiction. You are responsible for activity that occurs under your account.",
    ],
  },
  {
    id: "creator-content",
    heading: "3. Creator content",
    paragraphs: [
      "Creators retain ownership of the courses and materials they upload. By publishing on the platform you grant us a limited licence to host, stream, and deliver that content to your paying learners, and you represent that you have all rights necessary to sell it.",
    ],
    bullets: [
      "Do not upload content that infringes intellectual property rights.",
      "Do not publish unlawful, misleading, or harmful material.",
      "You are responsible for the accuracy of your course descriptions and pricing.",
    ],
  },
  {
    id: "pricing-commission",
    heading: "4. Pricing, commission and payouts",
    paragraphs: [
      `The creator plan is free (₹0/month). We charge a platform commission of ${PLATFORM_COMMISSION_LABEL} per successful eligible course sale, deducted from the sale amount before the creator share is calculated. Payment gateway charges and applicable taxes are additional and are settled as per the payment provider's terms.`,
      "Creator payouts are recorded manually by platform administration under the intended payment arrangement, subject to approval and settlement by the payment provider. Any earning examples shown on the site are illustrative and are not a promise or guarantee of income.",
    ],
  },
  {
    id: "buyers",
    heading: "5. Course purchases",
    paragraphs: [
      "When a learner buys a course, the contract of sale is between the learner and the creator. Access to purchased course content is delivered through the learner dashboard for as long as the course remains available on the platform.",
      `Course purchases are non-refundable except where a refund or other remedy is required by applicable law, as described in our Refund Policy. Nothing in these Terms limits mandatory consumer rights.`,
    ],
  },
  {
    id: "acceptable-use",
    heading: "6. Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Circumvent payment, security, or access controls.",
      "Scrape, resell, or redistribute course content without permission.",
      "Impersonate another person or misrepresent your affiliation.",
      "Use the platform to send spam or unsolicited promotions.",
    ],
  },
  {
    id: "termination",
    heading: "7. Suspension and termination",
    paragraphs: [
      "We may suspend or terminate accounts that breach these Terms or create risk for learners or the platform. You may close your account at any time; outstanding eligible creator balances will be settled per the payment arrangement in effect.",
    ],
  },
  {
    id: "liability",
    heading: "8. Disclaimers and liability",
    paragraphs: [
      "The service is provided on an \"as is\" and \"as available\" basis without warranties of any kind, to the fullest extent permitted by law. Nothing in these Terms excludes liability that cannot be excluded under applicable law.",
    ],
  },
  {
    id: "law",
    heading: "9. Governing law and contact",
    paragraphs: [
      `These Terms are governed by the laws of India. Questions can be sent to ${SUPPORT_EMAIL}. If any provision of these Terms is found unenforceable, the remainder continues in effect.`,
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    paragraphs: [
      `This Privacy Policy explains what information ${APP_NAME} collects, why, and how it is handled. It applies to creators, learners, and visitors of ${APP_URL}.`,
    ],
  },
  {
    id: "data-we-collect",
    heading: "2. Information we collect",
    paragraphs: ["We collect only what the service needs to run:"],
    bullets: [
      "Account details — name, email address, and authentication credentials.",
      "Creator profile and course content you choose to publish.",
      "Purchase records — course, amount, timestamp, and payment status (we do not store full card or UPI details).",
      "Usage data — pages visited and device information, used to keep the service reliable and secure.",
    ],
  },
  {
    id: "how-we-use",
    heading: "3. How we use information",
    paragraphs: [""],
    bullets: [
      "Provide the service: accounts, course delivery, checkout, and receipts.",
      "Send transactional email (order confirmations, password resets).",
      "Prevent fraud and abuse, and meet legal or tax obligations.",
      "Understand, in aggregate, how the product is used so we can improve it.",
    ],
  },
  {
    id: "processors",
    heading: "4. Service providers",
    paragraphs: [
      "We use specialist providers to operate the platform. They process data only as instructed and under their own privacy terms:",
    ],
    bullets: [
      "Supabase — authentication and PostgreSQL database hosting.",
      "Razorpay — payment processing.",
      "Resend — transactional email delivery.",
      "Cloudflare R2 — course media and file storage.",
      "Vercel — application hosting.",
    ],
  },
  {
    id: "sharing",
    heading: "5. Sharing",
    paragraphs: [
      "We do not sell personal information. A creator can see limited details about their own learners (such as name, email, and enrolment status) solely to manage their courses. A buyer's name and email are shared with the creator they purchased from for order and access management.",
    ],
  },
  {
    id: "retention-rights",
    heading: "6. Retention and your rights",
    paragraphs: [
      "We retain account and transaction data for as long as the account is active or as required by law. You may request access, correction, export, or deletion of your personal data, subject to legal retention requirements, by contacting us.",
    ],
  },
  {
    id: "contact",
    heading: "7. Contact",
    paragraphs: [
      `For privacy questions or requests, email ${SUPPORT_EMAIL}. If we make material changes to this policy we will update the date above and, where appropriate, notify account holders by email.`,
    ],
  },
];

export const PURCHASE_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "what-you-buy",
    heading: "1. What you are buying",
    paragraphs: [
      "Each purchase grants you personal, non-transferable access to stream the course content through your learner dashboard. Courses are sold by independent creators; the platform processes payment and delivers access on their behalf.",
    ],
  },
  {
    id: "pricing",
    heading: "2. Pricing and payment",
    paragraphs: [
      "Prices are set by creators in Indian Rupees (INR) and are shown before you pay. Payments are processed securely by Razorpay using UPI, cards, net-banking, or wallets, subject to method availability. Applicable taxes are shown at checkout where relevant.",
    ],
  },
  {
    id: "access",
    heading: "3. Access and delivery",
    paragraphs: [
      "Access is granted after a successful payment and a receipt is emailed to you. If access is delayed or fails, contact us and we will restore access or remedy the issue.",
    ],
  },
];

export const REFUND_SECTIONS: LegalSection[] = [
  {
    id: "no-standard-refunds",
    heading: "1. No standard refunds",
    paragraphs: [
      "Course purchases are digital goods delivered immediately, and are non-refundable once access is granted. We do not offer change-of-mind refunds, partial refunds for partially watched courses, or refunds for content that does not match personal preferences.",
      "Please read the course description, curriculum, and the creator's public information carefully before purchasing.",
    ],
  },
  {
    id: "legal-rights",
    heading: "2. Exceptions required by law",
    paragraphs: [
      "This policy does not override any refund, repair, replacement, or other remedy that cannot be excluded under applicable consumer protection law. Where the law provides mandatory remedies — for example if course content is defective, not delivered, or materially not as described — those remedies remain fully available to you.",
    ],
  },
  {
    id: "issues",
    heading: "3. If something goes wrong",
    paragraphs: [
      `If you cannot access a course you paid for, were charged incorrectly, or believe content was materially misrepresented, contact us at ${SUPPORT_EMAIL} within 7 days of purchase with your order details. We will investigate and, where required by law or where access cannot be restored, issue the appropriate remedy.`,
    ],
  },
  {
    id: "creators",
    heading: "4. Note for creators",
    paragraphs: [
      "When a refund or reversal is required by law or results from a payment dispute or chargeback, the corresponding sale is reversed and deducted from the creator's payable balance.",
    ],
  },
];
