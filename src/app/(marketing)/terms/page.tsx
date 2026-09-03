import type { Metadata } from "next";
import { LegalPage, P, Ul, Sub, Callout, PageLink, LEGAL_CONTACT, type LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of Beevo — accounts, Pro subscriptions (₹499/mo incl. GST), acceptable use, content ownership, social media integrations, termination, liability and governing law (India).",
};

const UPDATED = "September 1, 2026";

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    content: (
      <>
        <P>
          These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement between you and {LEGAL_CONTACT.company}
          (&ldquo;Beevo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) governing your access to and use of beevo.in and the
          Beevo social media planning service (the &ldquo;Service&rdquo;).
        </P>
        <P>
          By creating an account, connecting a social account or using the Service in any way, you accept these Terms and
          our <PageLink href="/privacy">Privacy Policy</PageLink>. If you use Beevo on behalf of a company or other
          entity, you confirm you have authority to bind that entity to these Terms.
        </P>
      </>
    ),
  },
  {
    id: "the-service",
    title: "The service & plans",
    content: (
      <>
        <P>
          Beevo lets you plan, compose, schedule and automatically publish posts to Instagram, Facebook, X (Twitter),
          LinkedIn, Pinterest and YouTube from one calendar, along with analytics, media management and team features.
        </P>
        <Ul>
          <li><strong>Free plan</strong> — ₹0 forever: 10 scheduled posts per month, 2 connected accounts, 7-day analytics.</li>
          <li><strong>Pro plan</strong> — <strong>₹499/month with 18% GST already included</strong>: unlimited posts, up to 12 connected accounts, AI captioning, best-time engine, 12-month analytics and 3 team seats. An annual option (₹4,990/year) is available where shown.</li>
        </Ul>
        <P>
          Features and limits may evolve; the plan shown at signup and in your Billing page at any time is what applies
          to you. YouTube publishing supports Shorts (vertical video, ≤ 3 minutes) only.
        </P>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    content: (
      <>
        <Ul>
          <li>You may sign up with email + password or with Google. You must provide accurate, current information.</li>
          <li>You are responsible for all activity under your account and for keeping your credentials secure. Notify us immediately at {LEGAL_CONTACT.support} about any unauthorised access.</li>
          <li>One person or entity per account; workspace seats are for your own team members, invited by email.</li>
          <li>You must be at least 13 years old (or the minimum digital-consent age in your country) to use Beevo.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Subscriptions, billing & GST",
    content: (
      <>
        <Ul>
          <li>Pro is billed in Indian Rupees via Razorpay — monthly at ₹499 or annually at ₹4,990, <strong>inclusive of 18% GST</strong> (₹499 = ₹422.88 base + ₹76.12 GST).</li>
          <li>Subscriptions renew automatically until cancelled. You may cancel anytime from Billing; cancellation takes effect at the end of the paid period.</li>
          <li>GST invoices are emailed after each payment and available under Billing → Invoices. Business GSTINs can be claimed on request.</li>
          <li>Refunds, trials, renewals and failed payments are governed by our <PageLink href="/refund-policy">Refund &amp; Cancellation Policy</PageLink>, which is part of these Terms.</li>
          <li>We may change prices prospectively with at least 30 days&rsquo; notice by email; you may cancel before a change takes effect.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Prohibited activities",
    content: (
      <>
        <P>You may not use Beevo to:</P>
        <Ul>
          <li>publish content that is unlawful, harmful, fraudulent, deceptive, infringing, hateful, harassing, or that sexualises minors;</li>
          <li>violate the terms of service of any social platform you connect, including buying fake engagement or spamming;</li>
          <li>send unsolicited bulk messages, chain letters or scams through connected accounts;</li>
          <li>impersonate any person or entity, or misrepresent your affiliation;</li>
          <li>scrape, reverse-engineer, decompile or attempt to extract the source of the Service, or bypass security, rate limits or plan limits;</li>
          <li>resell, sublicense or provide the Service to third parties as a competing scheduling product;</li>
          <li>interfere with or disrupt the Service, its servers or other customers&rsquo; workspaces.</li>
        </Ul>
        <P>
          We may suspend or terminate accounts that breach these rules, and will cooperate with law enforcement where
          required. You remain solely responsible for the content you publish through Beevo.
        </P>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content & ownership",
    content: (
      <>
        <Ul>
          <li><strong>You own your content.</strong> Posts, captions, media files, schedules and analytics you create or upload remain yours.</li>
          <li>You grant Beevo a limited, revocable licence to host, store, transform (e.g. resize avatars) and — on your explicit instruction — publish that content to the social platforms you connected, solely to operate the Service.</li>
          <li>You represent that you hold all rights needed for the content you publish, including music, images and trademarks in uploaded media.</li>
          <li>We may use aggregate, de-identified statistics (e.g. &ldquo;N posts scheduled&rdquo;) to describe the Service, never in a way that identifies you or your content.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "social-integrations",
    title: "Social media integrations",
    content: (
      <>
        <Ul>
          <li>Connections are authorised by you on each platform&rsquo;s own OAuth screen. We store encrypted tokens and never ask for your social passwords.</li>
          <li>You must comply with each platform&rsquo;s terms, API rules and content policies. Beevo is an independent tool — not affiliated with, endorsed by or sponsored by those platforms.</li>
          <li>Platforms change their APIs and policies frequently. They may limit, suspend or revoke access at any time, which can affect or interrupt features. We will fix or adapt what we can, but are not liable for platform-side actions.</li>
          <li>Disconnecting an account immediately stops scheduling for it and deletes its tokens.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "ai-features",
    title: "AI-assisted features",
    content: (
      <P>
        Hive Writer generates caption <strong>suggestions</strong> using AI. Suggestions may be inaccurate or
        inappropriate — you are responsible for reviewing and editing any AI-assisted caption before publishing it.
        AI features are offered as-is with no guarantee of specific outcomes.
      </P>
    ),
  },
  {
    id: "availability",
    title: "Service availability & scheduling",
    content: (
      <>
        <Ul>
          <li>We target high availability but do not guarantee uninterrupted service. Scheduled maintenance may cause brief downtime.</li>
          <li>Publishing runs on a scheduled engine that checks for due posts every few minutes; exact publish times may vary by a few minutes.</li>
          <li>If a post fails to publish, we alert you in-app and by email with the reason and a retry option, but we cannot guarantee platform-side acceptance of any post.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "Beevo intellectual property",
    content: (
      <P>
        The Service — including its software, design, brand, logos and content (excluding your content) — is owned by{" "}
        {LEGAL_CONTACT.company} and protected by intellectual property laws. These Terms grant you no rights in Beevo
        except the limited right to use the Service. &ldquo;Beevo&rdquo;, the bee mark and related names are our
        trademarks.
      </P>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <Ul>
          <li><strong>By you:</strong> cancel or delete your account anytime from Settings or by emailing {LEGAL_CONTACT.support}. Your plan stops at the end of the paid period (or immediately on account deletion).</li>
          <li><strong>By us:</strong> we may suspend or terminate accounts that breach these Terms, fail to pay after the grace period in the Refund Policy, or create legal risk for us or other users. Where fair, we warn first.</li>
          <li><strong>Effect:</strong> upon deletion your data is removed within 30 days (see the Privacy Policy). Already-published social posts are unaffected.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers & limitation of liability",
    content: (
      <>
        <P>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
          except those that cannot be excluded by law. We don&rsquo;t warrant that the Service will be uninterrupted,
          error-free, or that platforms will accept every post.
        </P>
        <P>
          To the maximum extent permitted by law, Beevo and its team are not liable for indirect, incidental, special,
          consequential or punitive damages, or for lost profits, revenue, data or goodwill. Our total aggregate
          liability arising out of or relating to the Service is limited to <strong>the amount you paid us in the 12
          months preceding the claim</strong>. Nothing in these Terms limits liability for death, personal injury or
          fraud, or your statutory consumer rights.
        </P>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law & disputes",
    content: (
      <P>
        These Terms are governed by the laws of India. The courts at Bengaluru, Karnataka have exclusive jurisdiction.
        Before filing a claim, parties agree to attempt good-faith resolution for 30 days after written notice to{" "}
        {LEGAL_CONTACT.support}.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <P>
        We may update these Terms; the &ldquo;Last updated&rdquo; date above reflects the current version. For material
        changes we email account holders at least 14 days before they take effect. Continuing to use Beevo after that
        means you accept the updated Terms.
      </P>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      meta={{ title: "Terms of Service", accent: "Service", path: "/terms" }}
      updated={UPDATED}
      summary="The agreement between you and Beevo — plans and billing, what you may and may not do, who owns your content, how social integrations work, and what happens if things go wrong."
      sections={sections}
    />
  );
}
