"use client";

/** "Continue with Google" — navigates to the server-side OAuth start. */
export function GoogleButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <a
      href="/api/auth/google/start"
      aria-disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-cream-300 bg-white text-[15px] font-semibold text-ink-900 shadow-[var(--shadow-card)] transition-all hover:border-honey-400/60 hover:bg-honey-50 active:scale-[0.98]"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l.1-.1 6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
      </svg>
      Continue with Google
    </a>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-cream-300" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600/50">
        or continue with email
      </span>
      <span className="h-px flex-1 bg-cream-300" />
    </div>
  );
}
