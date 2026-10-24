import { formatINR } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Lightweight SVG charts — no chart library, hand-tuned for the design. */

export function MiniBars({
  points,
  formatValue = (v: number) => formatINR(v),
  className,
}: {
  points: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`Bar chart. Values: ${points.map((p) => `${p.label} ${formatValue(p.value)}`).join(", ")}`}
        className="flex h-40 items-end gap-2 sm:gap-3"
      >
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="rounded-md border border-ink bg-lime px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-ink opacity-0 transition-opacity group-hover:opacity-100">
              {formatValue(point.value)}
            </span>
            <div
              className={cn(
                "w-full max-w-10 rounded-t-lg border-2 border-ink transition-colors",
                point.value > 0 ? "bg-accent group-hover:bg-accent-deep" : "bg-parchment",
              )}
              style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="min-w-0 flex-1 text-center text-[10px] font-semibold text-smoke">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendLine({
  points,
  className,
}: {
  points: { label: string; value: number }[];
  className?: string;
}) {
  const width = 560;
  const height = 160;
  const pad = 8;
  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = (width - pad * 2) / Math.max(points.length - 1, 1);
  const coords = points.map((point, index) => ({
    x: pad + index * stepX,
    y: height - pad - (point.value / max) * (height - pad * 2),
  }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <div className={className}>
      {/*
        The chart is deliberately stretched to the card width
        (preserveAspectRatio="none"), which would squash SVG <circle> markers
        into ellipses. The markers are therefore drawn as HTML dots positioned
        by percentage — they stay perfectly round at every breakpoint.
      */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Trend chart. Values: ${points.map((p) => `${p.label} ${p.value}`).join(", ")}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
        >
          <polygon points={area} fill="var(--color-lime)" opacity="0.35" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {coords.map((c, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-accent"
            style={{
              left: `${(c.x / width) * 100}%`,
              top: `${(c.y / height) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-smoke">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
