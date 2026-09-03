import type { Metadata } from "next";
import { LegalPage, P, Ul, Sub, Callout, LegalTable, PageLink, LEGAL_CONTACT, type LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Beevo's cancellation, refund, trial, renewal and failed-payment rules — including the 14-day money-back guarantee on first Pro purchases and how refunds are processed via Razorpay.",
};

const UPDATED = "September 1, 2026";

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <P>
          Beevo Pro costs <strong>₹499 per month with 18% GST already included</strong> (₹4,990/year for annual). This
          policy explains, in plain language, how cancellations, refunds, trials, renewals and failed payments work. It
          forms part of our <PageLink href="/terms">Terms of Service</PageLink>.
        </P>
        <Callout title="The short version">
          Cancel anytime — you keep Pro until the period you already paid for ends, then glide back to the Free plan and
          your data stays safe. First-time Pro purchases carry a 14-day money-back guarantee. Refunds go back to your
          original payment method via Razorpay within 5–7 business days.
        </Callout>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancelling your subscription",
    content: (
      <>
        <Ul>
          <li><strong>How:</strong> log in → <strong>Billing → Manage subscription → Switch to Free</strong>. It takes two clicks; there is no fee and no phone call.</li>
          <li><strong>When it takes effect:</strong> you keep every Pro feature until the end of the billing period you have already paid for. Your plan then automatically becomes Free (10 posts/month, 2 connected accounts).</li>
          <li><strong>Your data:</strong> posts, media, connections and analytics history are never deleted by downgrading — you can re-upgrade anytime and continue where you left off.</li>
          <li><strong>Scheduled posts:</strong> already-published posts are untouched. Scheduled posts within Free-plan limits continue to publish; ones beyond the limits stay queued but pause.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refund eligibility",
    content: (
      <>
        <Sub>14-day money-back guarantee</Sub>
        <P>
          If you are not satisfied with Beevo Pro, tell us within <strong>14 days of your first Pro charge</strong> and
          we will refund it in full — monthly or annual, no questions asked. This guarantee applies once per customer,
          to the first Pro purchase only.
        </P>
        <Sub>Renewal charges</Sub>
        <P>
          Renewal charges are generally non-refundable, because you can cancel at any time before they occur. As a
          courtesy, annual renewals cancelled within 14 days of the renewal date may receive a pro-rated refund if the
          service has not been substantially used in the new period.
        </P>
        <Sub>Always refundable</Sub>
        <Ul>
          <li>Duplicate or accidental charges (e.g. the same month paid twice).</li>
          <li>Charges after you cancelled before the renewal date (billing errors).</li>
          <li>Service-terminating faults — if Pro features are unavailable for 7+ consecutive days due to a problem on our side, we refund the affected period.</li>
        </Ul>
        <Callout title="Fair-use note">
          We may decline the money-back guarantee where it is being used to repeatedly purchase and refund Pro within
          short periods.
        </Callout>
      </>
    ),
  },
  {
    id: "trials",
    title: "Free trials",
    content: (
      <P>
        The Free plan itself is free forever and needs no card. If we run a time-limited Pro trial, it is clearly
        labelled at signup, requires no upfront payment, and converts to a paid Pro subscription only after you
        authorise payment. We email a reminder before any trial converts. You can cancel during the trial at any time
        and owe nothing.
      </P>
    ),
  },
  {
    id: "renewals",
    title: "Automatic renewals",
    content: (
      <>
        <Ul>
          <li>Pro renews automatically — monthly on the same calendar date, or annually each year — so your scheduling never pauses.</li>
          <li>An invoice is emailed after every successful charge and stored under Billing → Invoices.</li>
          <li>To avoid a renewal, cancel before the renewal date; you keep Pro until the current period ends.</li>
          <li>If we change prices, existing subscribers get at least 30 days&rsquo; email notice and may cancel before the change applies.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "failed-payments",
    title: "Failed payments & retries",
    content: (
      <Ul>
        <li>If a charge fails (expired card, insufficient balance, bank decline), our payment gateway retries during a grace period and emails you each time.</li>
        <li>Update your payment method from the Billing page or the emailed link to keep Pro active.</li>
        <li>If payment still fails at the end of the grace period, your plan moves to Free automatically. There are <strong>no late fees or collection agencies</strong> — your data stays safe and you can re-upgrade anytime.</li>
        <li>We never store card details; retry behaviour is handled by Razorpay under its rules.</li>
      </Ul>
    ),
  },
  {
    id: "downgrades",
    title: "Downgrading to Free",
    content: (
      <LegalTable
        columns={["When", "What happens"]}
        rows={[
          ["Immediately", "Upgrade prompts disappear; AI writer & best-time engine lock; analytics history beyond 7 days becomes read-only"],
          ["End of paid period", "Plan becomes Free: 10 posts/month, 2 connected accounts. Extra connected accounts are kept but inactive until upgraded"],
          ["Queued posts", "Posts within Free limits keep publishing; others stay queued and resume if you upgrade again"],
          ["Never", "Your posts, media, invoices or analytics history are deleted by downgrading"],
        ]}
      />
    ),
  },
  {
    id: "taxes",
    title: "Taxes & invoices",
    content: (
      <P>
        All prices shown are <strong>inclusive of 18% GST</strong>: the ₹499 monthly Pro price comprises a ₹422.88
        taxable base and ₹76.12 GST (₹4,990 annual = ₹4,228.81 + ₹761.19). A GST invoice is emailed automatically after
        every payment and can be downloaded from Billing → Invoices. Businesses can claim input credit using our GSTIN{" "}
        <strong>{LEGAL_CONTACT.gstin}</strong>; email {LEGAL_CONTACT.support} to add your business GSTIN to future invoices.
      </P>
    ),
  },
  {
    id: "requesting",
    title: "How to request a refund",
    content: (
      <>
        <Ul>
          <li>Email <a href={`mailto:${LEGAL_CONTACT.support}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.support}</a> from your registered address with your invoice or order ID (find it under Billing → Invoices).</li>
          <li>We review and respond within <strong>2 business days</strong>.</li>
          <li>Approved refunds are processed to your <strong>original payment method</strong> through Razorpay within 5–7 business days; your bank may take a few days more to post it.</li>
          <li>You receive email confirmation at every step.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    content: (
      <P>
        Anything unclear about billing, cancellation or refunds — write to{" "}
        <a href={`mailto:${LEGAL_CONTACT.support}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.support}</a>{" "}
        and a human from the hive will help.
      </P>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      meta={{ title: "Refund & Cancellation Policy", accent: "Policy", path: "/refund-policy" }}
      updated={UPDATED}
      summary="Cancelling, renewals, the 14-day money-back guarantee, failed payments and how refunds are processed — all in plain language."
      sections={sections}
    />
  );
}
