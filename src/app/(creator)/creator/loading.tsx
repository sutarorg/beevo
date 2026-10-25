/** Instant skeleton inside the creator shell while a studio page streams. */
export default function CreatorLoading() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-ink/10" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-ink/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5"
          />
        ))}
      </div>
      <div className="mt-4 h-64 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5" />
    </div>
  );
}
