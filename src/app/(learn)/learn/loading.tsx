/** Instant skeleton inside the learner shell while a learner page streams. */
export default function LearnLoading() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-ink/10" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-ink/10" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5"
          />
        ))}
      </div>
    </div>
  );
}
