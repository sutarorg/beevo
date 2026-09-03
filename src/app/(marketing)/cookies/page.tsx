import type { Metadata } from "next";
import { LegalPage, P, Ul, Sub, Callout, LegalTable, LEGAL_CONTACT, type LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "The cookies Beevo sets (essential session & OAuth state cookies), what each one does, the third-party cookies used during payments and sign-in, and how to manage cookies in your browser.",
};

const UPDATED = "September 1, 2026";

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "What are cookies?",
    content: (
      <>
        <P>
          Cookies are small text files that a website stores in your browser. They let a site remember your actions and
          preferences — most importantly for Beevo, <strong>keeping you signed in</strong>. This policy explains the
          cookies beevo.in sets and the limited third-party cookies involved in payments and social sign-in.
        </P>
        <Callout title="The short version">
          We set exactly four cookies, all strictly necessary: one that keeps you signed in, and three short-lived ones
          that keep OAuth secure. We use <strong>no analytics, advertising or tracking cookies</strong>.
        </Callout>
      </>
    ),
  },
  {
    id: "cookies-we-use",
    title: "Categories we use",
    content: (
      <>
        <Sub>Essential — always on</Sub>
        <P>
          Required for the service to function: authenticating you, keeping your session, and protecting OAuth
          connections against cross-site request forgery (CSRF). These cannot be switched off in the product; blocking
          them means you cannot stay logged in or connect social accounts.
        </P>
        <Sub>Analytics — none today</Sub>
        <P>
          Beevo does not currently use any analytics or measurement cookies. If we ever add privacy-friendly, aggregate
          analytics, we will update this policy and list every cookie here first.
        </P>
        <Sub>Functional & marketing — none</Sub>
        <P>
          We use no preference, personalisation, advertising or retargeting cookies, and we do not share cookie data
          with advertising networks.
        </P>
      </>
    ),
  },
  {
    id: "cookie-table",
    title: "Cookies we set",
    content: (
      <>
        <LegalTable
          columns={["Cookie", "Category", "Purpose", "Duration"]}
          rows={[
            [
              <code key="s" className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[11.5px] text-honey-300">beevo_session</code>,
              "Essential",
              "Keeps you signed in to your Beevo account. HttpOnly, Secure, SameSite=Lax — inaccessible to JavaScript.",
              "30 days",
            ],
            [
              <code key="o" className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[11.5px] text-honey-300">beevo_oauth</code>,
              "Essential",
              "Cryptographically signed anti-CSRF state when connecting a social platform.",
              "10 minutes",
            ],
            [
              <code key="p" className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[11.5px] text-honey-300">beevo_pkce</code>,
              "Essential",
              "PKCE verifier that secures the X (Twitter) OAuth flow.",
              "10 minutes",
            ],
            [
              <code key="g" className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[11.5px] text-honey-300">beevo_google_oauth</code>,
              "Essential",
              "Anti-CSRF state for &ldquo;Continue with Google&rdquo; sign-in.",
              "10 minutes",
            ],
          ]}
        />
        <P className="text-[13px] text-ink-600/70">
          All four are first-party cookies set only on beevo.in. Logging out clears your session immediately; the OAuth
          cookies expire on their own after 10 minutes.
        </P>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    title: "Third-party cookies",
    content: (
      <>
        <P>
          During specific flows, the provider&rsquo;s own domain may set cookies. These are governed by each
          provider&rsquo;s cookie policy, not ours:
        </P>
        <LegalTable
          columns={["Provider", "When", "Why"]}
          rows={[
            ["Razorpay", "Checkout, while paying", "Fraud prevention & payment session continuity on checkout.razorpay.com"],
            ["Google", "Sign in with Google", "Your Google session on accounts.google.com during sign-in"],
            ["Meta, X, LinkedIn, Pinterest", "Connecting a social account", "The platform's own OAuth consent session"],
          ]}
        />
        <P>
          Beevo never reads, sets or receives data from third-party cookies — we only redirect you to the
          provider&rsquo;s page and back.
        </P>
      </>
    ),
  },
  {
    id: "managing",
    title: "Managing your cookies",
    content: (
      <>
        <Ul>
          <li><strong>Log out</strong> to clear your Beevo session cookie at any time.</li>
          <li><strong>Browser settings:</strong> every major browser lets you block or delete cookies — see the help pages for <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="font-medium text-honey-700 underline underline-offset-2">Chrome</a>, <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="font-medium text-honey-700 underline underline-offset-2">Safari</a>, <a href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="font-medium text-honey-700 underline underline-offset-2">Firefox</a> and <a href="https://support.microsoft.com/microsoft-edge/delete-and-manage-cookies" target="_blank" rel="noopener noreferrer" className="font-medium text-honey-700 underline underline-offset-2">Edge</a>.</li>
          <li><strong>Blocking essential cookies</strong> will sign you out and prevent connecting accounts — the rest of the site still works.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "no-tracking",
    title: "What we don't do",
    content: (
      <Ul>
        <li>No advertising or retargeting cookies.</li>
        <li>No cross-site tracking or profiling.</li>
        <li>No selling or sharing of cookie data with third parties.</li>
        <li>No fingerprinting or shadow profiles.</li>
      </Ul>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <P>
        If we introduce any new cookie we will update the table above and the &ldquo;Last updated&rdquo; date before it
        goes live. Questions? <a href={`mailto:${LEGAL_CONTACT.privacy}`} className="font-medium text-honey-700 underline underline-offset-2">{LEGAL_CONTACT.privacy}</a>.
      </P>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      meta={{ title: "Cookie Policy", accent: "Policy", path: "/cookies" }}
      updated={UPDATED}
      summary="Exactly which cookies beevo.in sets, what each one does, the third-party cookies used during payments and sign-in, and how to control them."
      sections={sections}
    />
  );
}
