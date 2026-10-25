/** Instant skeleton for public storefront/sales pages while they stream. */
export default function StorefrontLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-64 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-3xl border-2 border-ink/10 bg-ink/5"
          />
        ))}
      </div>
    </div>
  );
}
