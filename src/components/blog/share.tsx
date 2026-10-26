"use client";

import { Briefcase, Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Social sharing for an article.
 *
 * Plain anchors do the sharing (no SDKs, no tracking scripts, no third-party
 * JavaScript), and the one interactive control is a copy-link button that
 * announces its result to screen readers.
 */
export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const statusId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      Icon: MessageCircle,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Briefcase,
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Share2,
    },
  ];

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Older Safari / non-secure contexts: fall back to a temporary field.
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  const buttonClass =
    "inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3.5 py-2 text-xs font-bold text-ink transition-transform hover:-translate-y-0.5";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold tracking-[0.14em] text-smoke uppercase">Share</span>
      {targets.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={buttonClass}
        >
          <Icon className="size-4 text-accent-deep" aria-hidden="true" />
          <span className="hidden sm:inline">{label.replace("Share on ", "")}</span>
        </a>
      ))}
      <button type="button" onClick={() => void copy()} className={buttonClass}>
        {copied ? (
          <Check className="size-4 text-accent-deep" aria-hidden="true" />
        ) : (
          <Link2 className="size-4 text-accent-deep" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>
      <span id={statusId} role="status" aria-live="polite" className="sr-only">
        {copied ? "Article link copied to clipboard." : ""}
      </span>
    </div>
  );
}
