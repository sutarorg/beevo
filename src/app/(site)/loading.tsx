/**
 * Instant skeleton for marketing-route transitions. The header/footer from
 * the layout stay painted; only this content swaps in while the next page
 * streams — so navigation feels immediate instead of blank.
 */
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6" role="status" aria-label="Loading page">
      <div className="h-6 w-44 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-6 h-14 w-3/4 max-w-xl animate-pulse rounded-2xl bg-ink/10" />
      <div className="mt-3 h-14 w-1/2 max-w-md animate-pulse rounded-2xl bg-ink/10" />
      <div className="mt-6 h-5 w-2/3 max-w-lg animate-pulse rounded-full bg-ink/10" />
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5"
          />
        ))}
      </div>
    </div>
  );
}
