"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  Lock,
  LogOut,
  Mail,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  SUPPORTED_ELEVENLABS_LANGUAGES,
  type EmailNotificationPreferences,
} from "@/lib/app-types";

export function SettingsClient() {
  // Profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  // Password & Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email Notification Preferences
  const [prefs, setPrefs] = useState<EmailNotificationPreferences>({
    generationCompleted: true,
    generationFailedRefund: true,
    creditReceipts: true,
    productAnnouncements: false,
  });

  // Guarded Account Deletion
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Honest Feedback Banner
  const [feedback, setFeedback] = useState<string | null>(null);

  const notifyPhase4 = (action: string) => {
    setFeedback(
      `${action} requires an active Supabase Auth session, which connects in Phase 4. No remote account data was modified.`
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <header>
        <Eyebrow showSparkle>Account &amp; Preferences</Eyebrow>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-tight tracking-[-0.03em] text-beevo-ink">
          Settings
        </h1>
        <p className="mt-1 text-[14px] text-beevo-body">
          Manage your Beevo profile, password security, email notifications, and account controls.
        </p>
      </header>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-[16px] border border-beevo-border-warm bg-beevo-cream/85 p-4 text-[13.5px] leading-relaxed text-beevo-body"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text" aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Main Settings Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Profile Info */}
          <section
            aria-labelledby="settings-profile-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="settings-profile-heading"
                  className="font-display text-[17.5px] font-extrabold text-beevo-ink"
                >
                  Profile Information
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Your account details load automatically once signed in via Supabase.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                notifyPhase4("Saving profile details");
              }}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-name"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Full Name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Not signed in"
                    className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-email"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Email Address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14px] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
                  />
                </div>
              </div>

              <div className="max-w-xs">
                <label
                  htmlFor="settings-language"
                  className="block text-[13px] font-bold text-beevo-ink"
                >
                  Default Narration Language
                </label>
                <select
                  id="settings-language"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3 text-[14px] font-semibold text-beevo-ink"
                >
                  {SUPPORTED_ELEVENLABS_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="beevo-btn-primary min-h-[46px] px-5 text-[14px]">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Profile
              </button>
            </form>
          </section>

          {/* 2. Password & Security */}
          <section
            aria-labelledby="settings-security-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="settings-security-heading"
                  className="font-display text-[17.5px] font-extrabold text-beevo-ink"
                >
                  Password &amp; Security
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Update your password to keep your videos and credit wallet protected.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPassword || newPassword.length < 8) {
                  setFeedback("New password must be at least 8 characters long.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setFeedback("New password and confirmation do not match.");
                  return;
                }
                notifyPhase4("Updating your password");
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="settings-current-pw"
                  className="block text-[13px] font-bold text-beevo-ink"
                >
                  Current Password
                </label>
                <input
                  id="settings-current-pw"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14px] text-beevo-ink placeholder:text-beevo-muted/65"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-new-pw"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="settings-new-pw"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas pl-3.5 pr-12 text-[14px] text-beevo-ink placeholder:text-beevo-muted/65"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      className="absolute right-1 top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center text-beevo-muted hover:text-beevo-ink"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="settings-confirm-pw"
                    className="block text-[13px] font-bold text-beevo-ink"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="settings-confirm-pw"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="mt-1.5 min-h-[46px] w-full rounded-[12px] border border-beevo-border bg-beevo-canvas px-3.5 text-[14px] text-beevo-ink placeholder:text-beevo-muted/65"
                  />
                </div>
              </div>

              <button type="submit" className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]">
                Update Password
              </button>
            </form>
          </section>

          {/* 3. Email Notification Preferences */}
          <section
            aria-labelledby="settings-email-prefs-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-beevo-cream text-beevo-honey-text">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="settings-email-prefs-heading"
                  className="font-display text-[17.5px] font-extrabold text-beevo-ink"
                >
                  Email Notification Preferences
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Choose which studio events trigger an email to your inbox.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(
                [
                  {
                    key: "generationCompleted",
                    title: "Video generation completed",
                    desc: "Receive an email with your download link when a cartoon MP4 finishes rendering.",
                  },
                  {
                    key: "generationFailedRefund",
                    title: "Render failure & automatic credit refund",
                    desc: "Immediate notification if a job fails and reserved credits return to your wallet.",
                  },
                  {
                    key: "creditReceipts",
                    title: "One-time credit pack receipts",
                    desc: "Order confirmation and GST/invoice summary whenever you top up credits.",
                  },
                  {
                    key: "productAnnouncements",
                    title: "New styles & studio feature updates",
                    desc: "Occasional release notes when new illustration styles or languages launch.",
                  },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex min-h-[60px] cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-beevo-border bg-beevo-canvas px-4 py-3"
                >
                  <div>
                    <p className="text-[13.5px] font-extrabold text-beevo-ink">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-beevo-muted">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[#FFC928]"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => notifyPhase4("Saving email notification preferences")}
              className="beevo-btn-secondary mt-5 min-h-[46px] px-5 text-[14px]"
            >
              Save Notification Preferences
            </button>
          </section>
        </div>

        {/* Right Column: Session & Guarded Account Deletion */}
        <div className="space-y-6 lg:col-span-4">
          {/* Session / Logout */}
          <section
            aria-labelledby="settings-session-heading"
            className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card"
          >
            <h2
              id="settings-session-heading"
              className="font-display text-[16.5px] font-extrabold text-beevo-ink"
            >
              Workspace Session
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-beevo-muted">
              Sign out of your current device when finished working on shared computers.
            </p>
            <button
              type="button"
              onClick={() => notifyPhase4("Signing out")}
              className="beevo-btn-secondary mt-4 min-h-[46px] w-full text-[13.5px]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log Out
            </button>
          </section>

          {/* Guarded Account Deletion */}
          <section
            aria-labelledby="settings-danger-heading"
            className="rounded-[22px] border border-red-200 bg-red-50/45 p-5"
          >
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2
                id="settings-danger-heading"
                className="font-display text-[16.5px] font-extrabold"
              >
                Delete Account
              </h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-red-900/85">
              Permanently deleting your Beevo account removes your projects, storyboards, saved
              videos, and unused credit balance. This action cannot be undone.
            </p>

            <div className="mt-4">
              <label
                htmlFor="delete-account-confirm"
                className="block text-[12px] font-bold text-red-950"
              >
                Type <span className="font-mono font-extrabold">DELETE</span> to unlock
              </label>
              <input
                id="delete-account-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5 min-h-[44px] w-full rounded-[12px] border border-red-200 bg-white px-3 text-[13.5px] font-bold text-beevo-ink placeholder:text-red-300"
              />
            </div>

            <button
              type="button"
              disabled={deleteConfirmText.trim() !== "DELETE"}
              onClick={() => notifyPhase4("Permanent account deletion")}
              className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-red-700 px-4 text-[13.5px] font-extrabold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-500"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Permanently Delete Account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
