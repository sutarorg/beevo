"use client";

import { LifeBuoy, Mail, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SUPPORT_EMAIL } from "@/lib/config";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { PageHeader } from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = ["Access to a course", "Payment or receipt", "Playback problem", "Account", "Something else"];

export default function LearnerSupportPage() {
  const toast = useToast();
  const service = getCreatorDataService();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; body?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!subject.trim()) nextErrors.subject = "Give your request a subject.";
    if (body.trim().length < 20) nextErrors.body = "Tell us a bit more (at least 20 characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!service) {
      toast.push({ variant: "error", title: "Support isn't available in this environment." });
      return;
    }
    setSubmitting(true);
    const result = await service.submitSupportTicket({ category: `Learner · ${category}`, subject, body });
    setSubmitting(false);
    if (!result.ok) {
      toast.push({ variant: "error", title: "Couldn't submit", description: result.error.message });
      return;
    }
    setSubject("");
    setBody("");
    toast.push({
      variant: "success",
      title: "Request received",
      description: "Our team replies within 2 working days.",
    });
  };

  return (
    <div>
      <PageHeader title="Support" sub="Stuck mid-lesson? Real humans reply." />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-lime">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">Email us</span>
              <span className="block text-xs text-smoke">{SUPPORT_EMAIL}</span>
            </span>
          </a>
          <Link
            href="/faq"
            className="flex items-center gap-3 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-lime">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">Common answers</span>
              <span className="block text-xs text-smoke">Refunds, access, and receipts explained.</span>
            </span>
          </Link>
          <Link
            href="/refund-policy"
            className="flex items-center gap-3 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-11 place-items-center rounded-xl border-2 border-ink bg-parchment">
              <LifeBuoy className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">Purchase policy</span>
              <span className="block text-xs text-smoke">Non-refundable except where the law requires.</span>
            </span>
          </Link>
        </div>

        <form onSubmit={submit} noValidate className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
          <h2 className="text-base font-bold text-ink">Open a support request</h2>
          <div className="mt-4 space-y-4">
            <Field id="learn-ticket-category" label="Category">
              <select
                id="learn-ticket-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                {CATEGORIES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field id="learn-ticket-subject" label="Subject" error={errors.subject}>
              <Input
                id="learn-ticket-subject"
                value={subject}
                invalid={Boolean(errors.subject)}
                onChange={(event) => {
                  setSubject(event.target.value);
                  if (event.target.value.trim()) setErrors((current) => ({ ...current, subject: undefined }));
                }}
                placeholder="e.g. My receipt never arrived"
                maxLength={120}
              />
            </Field>
            <Field id="learn-ticket-body" label="Message" error={errors.body}>
              <textarea
                id="learn-ticket-body"
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  if (event.target.value.trim().length >= 20) setErrors((current) => ({ ...current, body: undefined }));
                }}
                aria-invalid={Boolean(errors.body) || undefined}
                rows={5}
                placeholder="Tell us what happened…"
                className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
              />
            </Field>
            <Button type="submit" variant="accent" loading={submitting}>
              {submitting ? "Sending…" : "Submit request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
