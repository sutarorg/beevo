import type { Metadata } from "next";
import { LegalPage, P, Ul, Sub, Callout, LegalTable, PageLink, LEGAL_CONTACT, type LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Beevo collects, uses, stores and protects your data — including social media OAuth tokens, cookies, third-party services, your rights under the DPDP Act & GDPR, and how to delete your data.",
};

const UPDATED = "September 1, 2026";

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Who we are & what this covers",
    content: (
      <>
        <P>
          Beevo (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a social media planning and scheduling service operated by{" "}
          {LEGAL_CONTACT.company}, Bengaluru, India, available at <strong>beevo.in</strong>. This Privacy Policy explains
          what personal data we collect when you use Beevo, why we collect it, how we protect it, and the choices you have.
        </P>
        <P>
          It applies to our website, apps and API. By creating an account or using Beevo, you agree to the practices
          described here. Plain-language summary first — the legal detail follows.
        </P>
        <Callout title="In a nutshell">
          We collect only what&rsquo;s needed to run your hive: your account details, the posts you create, and — only
          after you explicitly connect them via OAuth — encrypted access tokens for your social accounts. We never sell
          your data, never post to your profiles without your instruction, and you can delete everything at any time.
        </Callout>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Information we collect",
    content: (
      <>
        <Sub>Account information</Sub>
        <Ul>
          <li><strong>Name, email address and password</strong> — passwords are stored only as bcrypt hashes; we cannot see or recover your password.</li>
          <li><strong>Google profile</strong> (name, email, avatar) when you sign in with Google.</li>
          <li><strong>Workspace details</strong> — workspace name, timezone, notification preferences, and your uploaded avatar (downscaled to 256×256).</li>
        </Ul>
        <Sub>Content you create</Sub>
        <Ul>
          <li>Posts, captions, drafts, schedules, media files you upload, and team members &amp; invites you add.</li>
        </Ul>
        <Sub>Connected social accounts — only after you connect them</Sub>
        <Ul>
          <li>Platform, handle and display name, follower counts, and the OAuth access/refresh tokens the platform issues (stored encrypted — see <a href="#social-media-data" className="font-medium text-honey-700 underline underline-offset-2">Social media data</a>).</li>
        </Ul>
        <Sub>Usage &amp; technical information</Sub>
        <Ul>
          <li>Product usage (posts created, accounts connected), approximate IP address, browser/user-agent and logs — collected via our hosting provider for security, abuse prevention and service operation.</li>
        </Ul>
        <Sub>Payment information</Sub>
        <P>
          Payments are processed entirely by <strong>Razorpay</strong>. We receive only the payment amount, a masked
          method label (e.g. &ldquo;Visa &bull;&bull;&bull;&bull; 4242&rdquo;) and invoice/order identifiers for your
          records. <strong>We never see or store card numbers, CVVs, UPI PINs or bank credentials.</strong>
        </P>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    content: (
      <Ul>
        <li>Provide, operate and maintain Beevo — authenticating you, storing your posts and scheduling them for publishing.</li>
        <li>Publish posts <strong>only when you have created and scheduled them</strong> to platforms you have connected.</li>
        <li>Show your analytics — followers, reach and engagement pulled from the platforms you connected.</li>
        <li>Send transactional emails: welcome, publish confirmations and failure alerts, invoices, password changes, team invites.</li>
        <li>Detect, prevent and address fraud, abuse and security issues.</li>
        <li>Comply with legal obligations (including tax record-keeping under Indian law).</li>
        <li>Improve and support the service.</li>
      </Ul>
    ),
  },
  {
    id: "social-media-data",
    title: "Social media API data & OAuth tokens",
    content: (
      <>
        <P>
          When you connect Instagram, Facebook, X (Twitter), LinkedIn, Pinterest or YouTube, the sign-in happens on the
          platform&rsquo;s own OAuth consent screen. <strong>Your social media password never touches our servers.</strong>
        </P>
        <P>
          We store the access/refresh tokens the platform issues, <strong>encrypted at rest with AES-256-GCM</strong>.
          They are used solely to publish the posts you schedule and to read profile/follower statistics on your behalf.
          Tokens are decrypted only momentarily, server-side, at publish time — they are never displayed in the app or
          shared with anyone.
        </P>
        <Callout title="You stay in control">
          Disconnect any account from <strong>Accounts → Disconnect</strong> — its tokens are wiped from our database
          immediately, and scheduled posts for that platform stop. Each platform can also revoke Beevo&rsquo;s access
          from its own app settings at any time.
        </Callout>
        <P>
          Beevo is an independent tool and is not affiliated with or endorsed by those platforms. Your use of each
          platform remains governed by that platform&rsquo;s own terms and privacy policy, and changes to their APIs may
          affect the features we can offer.
        </P>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & similar technologies",
    content: (
      <P>
        We use a small number of strictly necessary cookies to keep you signed in and to protect OAuth flows. We do not
        use advertising or tracking cookies. See the full <PageLink href="/cookies">Cookie Policy</PageLink> for the
        complete list, purposes and how to manage them.
      </P>
    ),
  },
  {
    id: "storage-security",
    title: "Storage & security",
    content: (
      <>
        <Ul>
          <li><strong>Where:</strong> your data is stored in managed cloud PostgreSQL databases and object storage operated by vetted providers (see Third-party services below), with strict workspace isolation — every database query is scoped to your workspace.</li>
          <li><strong>In transit:</strong> all traffic is served over TLS/HTTPS.</li>
          <li><strong>At rest:</strong> OAuth tokens are AES-256-GCM encrypted; passwords are bcrypt-hashed.</li>
          <li><strong>Access:</strong> limited to personnel who need it to run and support the service, bound by confidentiality obligations.</li>
        </Ul>
        <P>
          No method of transmission or storage is 100% secure. We monitor our systems and patch promptly. If a security
          incident ever affects your personal data, we will notify you and the relevant authorities as required by law.
        </P>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services",
    content: (
      <>
        <P>Beevo relies on the following processors, each governed by its own privacy policy. We share only the minimum data necessary:</P>
        <LegalTable
          columns={["Service", "Purpose", "What they process"]}
          rows={[
            ["Vercel", "App hosting & CDN", "Request logs, IP address"],
            ["Neon / Vercel Postgres", "Database hosting", "Your Beevo data"],
            ["Vercel Blob", "Media & avatar storage", "Uploaded files"],
            ["Razorpay", "Payments & subscriptions (INR)", "Payment details — we only see amount + masked method"],
            ["Resend", "Transactional email", "Your email address & message content"],
            ["Google", "Sign-in with Google; YouTube publishing", "Name, email, YouTube channel data"],
            ["Meta, X, LinkedIn, Pinterest", "Social integrations", "Posts you schedule to them, OAuth tokens"],
            ["OpenAI", "AI caption suggestions (Pro)", "Caption brief & tone — only when you use Hive Writer"],
          ]}
        />
      </>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    content: (
      <Ul>
        <li><strong>Account &amp; workspace data</strong> — kept while your account exists.</li>
        <li><strong>Deleted posts &amp; media</strong> — removed immediately; residual backups and cached copies purge within 30 days.</li>
        <li><strong>OAuth tokens</strong> — kept until you disconnect the account or delete your Beevo account.</li>
        <li><strong>Invoices &amp; payment records</strong> — retained as required by Indian tax law (up to 8 years for GST records).</li>
        <li><strong>Security logs</strong> — up to 12 months.</li>
      </Ul>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <P>
          Depending on where you live — including under India&rsquo;s Digital Personal Data Protection Act, 2023 and,
          for EU/EEA residents, the GDPR — you have the following rights over your personal data:
        </P>
        <Ul>
          <li><strong>Access</strong> — get a copy of the data we hold about you.</li>
          <li><strong>Correction</strong> — fix inaccurate details at any time from Settings.</li>
          <li><strong>Erasure</strong> — request deletion of your data (see Deleting your data below).</li>
          <li><strong>Portability</strong> — export your posts and media in a machine-readable format.</li>
          <li><strong>Withdraw consent</strong> — disconnect social accounts or delete your workspace at any time.</li>
          <li><strong>Grievance redressal</strong> — raise concerns with our Grievance Officer at {LEGAL_CONTACT.privacy}.</li>
        </Ul>
        <P>
          Email <a href={`mailto:${LEGAL_CONTACT.privacy}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.privacy}</a>{" "}
          and we will respond within 30 days. Using these rights never degrades your service beyond the feature limits
          of your plan.
        </P>
      </>
    ),
  },
  {
    id: "data-deletion",
    title: "Deleting your data",
    content: (
      <>
        <Ul>
          <li><strong>Disconnect a social account</strong> — tokens are wiped instantly from Accounts → Disconnect.</li>
          <li><strong>Delete a post or media file</strong> — removed immediately from the app.</li>
          <li><strong>Delete your workspace or account</strong> — email <a href={`mailto:${LEGAL_CONTACT.support}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.support}</a> from your registered address. Everything — profile, workspaces, posts, media, tokens, notifications — is permanently erased within <strong>30 days</strong>, and we confirm by email.</li>
        </Ul>
        <Callout title="Good to know">
          Deleting your Beevo account does not delete posts that were already published to your social platforms —
          those remain on each platform under its own rules.
        </Callout>
      </>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    content: (
      <P>
        Beevo is not directed at children. We do not knowingly collect data from anyone under 13 (or under a higher age
        where local law requires). If you believe a child has given us personal data, contact us and we will delete it
        promptly.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <P>
        We may update this policy as the service evolves. The &ldquo;Last updated&rdquo; date above always reflects the
        current version, and we will email account holders about material changes before they take effect. Continued use
        of Beevo after changes take effect means you accept the updated policy.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    content: (
      <P>
        For anything in this policy — questions, requests or complaints — write to us at{" "}
        <a href={`mailto:${LEGAL_CONTACT.privacy}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.privacy}</a>{" "}
        (data &amp; privacy) or{" "}
        <a href={`mailto:${LEGAL_CONTACT.support}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.support}</a>{" "}
        (general support). Postal: {LEGAL_CONTACT.address}.
      </P>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      meta={{ title: "Privacy Policy", accent: "Policy", path: "/privacy" }}
      updated={UPDATED}
      summary="How Beevo collects, uses, stores and protects your data — including social media OAuth tokens, third-party services, your rights, and how to delete everything."
      sections={sections}
    />
  );
}
