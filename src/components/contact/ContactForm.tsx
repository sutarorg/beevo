"use client";

import React, { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const TOPICS = [
  "General Product Question",
  "Credits & Billing Clarification",
  "Education or Team Usage Inquiry",
  "Technical Issue or Bug Report",
  "Privacy or Policy Request",
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please complete your name, email address, and message before sending.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address so we can respond to your inquiry.");
      return;
    }
    if (message.trim().length < 12) {
      setError("Please include a short description (at least 12 characters) so we can help.");
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[20px] border border-beevo-border-warm bg-beevo-cream/70 p-6 sm:p-8"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-beevo-yellow text-beevo-ink">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-[21px] font-extrabold text-beevo-ink">
          Inquiry prepared for Beevo Support
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-beevo-body">
          Thank you, <strong className="text-beevo-ink">{name}</strong>. Your message under{" "}
          <strong className="text-beevo-ink">{topic}</strong> has been validated locally in this
          frontend preview. Once Beevo&apos;s backend messaging endpoint is connected in the next
          phase, submissions from this form will route straight to the support queue with an email
          receipt to <strong className="text-beevo-ink">{email}</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="beevo-btn-secondary mt-5 min-h-[44px] px-5 text-[13.5px]"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-[20px] border border-beevo-border bg-white p-6 shadow-beevo-card sm:p-8"
    >
      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-800"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-[13.5px] font-bold text-beevo-ink">
            Your Name <span className="text-beevo-honey-text">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav Sharma"
            className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-[13.5px] font-bold text-beevo-ink">
            Email Address <span className="text-beevo-honey-text">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="block text-[13.5px] font-bold text-beevo-ink">
          Topic
        </label>
        <select
          id="contact-topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14.5px] font-medium text-beevo-ink"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-[13.5px] font-bold text-beevo-ink">
          How can we help? <span className="text-beevo-honey-text">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your question, project goals, or billing inquiry..."
          className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-beevo-canvas p-3.5 text-[14.5px] text-beevo-ink placeholder:text-beevo-muted/65"
        />
      </div>

      <button type="submit" className="beevo-btn-primary min-h-[48px] w-full px-6 text-[14.5px] sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" />
        Send Message
      </button>
    </form>
  );
}
