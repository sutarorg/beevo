"use client";

import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminEvent } from "@/lib/admin-types";
import { useAsyncData } from "@/lib/hooks";
import { getAdminService } from "@/lib/services/admin";
import { formatDateTime } from "@/lib/utils";
import { EventIcon, SearchInput, StatusPill } from "@/components/admin/ui";
import {
  CardListSkeleton,
  EmptyState,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";

const AREAS: AdminEvent["area"][] = [
  "creators",
  "learners",
  "courses",
  "orders",
  "payments",
  "payouts",
  "disputes",
  "settings",
  "system",
];

export default function AdminAuditLogsPage() {
  const service = getAdminService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.listAuditLogs()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<AdminEvent["area"] | "all">("all");
  const [kindFilter, setKindFilter] = useState<AdminEvent["kind"] | "all">("all");

  const filtered = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLowerCase();
    return state.data.filter((entry) => {
      if (areaFilter !== "all" && entry.area !== areaFilter) return false;
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      if (!query) return true;
      return [entry.action, entry.detail, entry.actor].join(" ").toLowerCase().includes(query);
    });
  }, [state, search, areaFilter, kindFilter]);

  return (
    <div>
      <PageHeader title="Audit logs" sub="Every admin action and system event, newest first. Writes append an entry automatically.">
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search action, detail, actor…" label="Search audit logs" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAreaFilter("all")}
            aria-pressed={areaFilter === "all"}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${areaFilter === "all" ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"}`}
          >
            All areas
          </button>
          {AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setAreaFilter(area)}
              aria-pressed={areaFilter === area}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold capitalize transition-colors ${areaFilter === area ? "border-ink bg-ink text-cream" : "border-ink bg-white text-ink hover:bg-parchment"}`}
            >
              {area}
            </button>
          ))}
          <select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as AdminEvent["kind"] | "all")}
            aria-label="Filter by event kind"
            className="ml-auto rounded-lg border-2 border-ink bg-white px-2 py-1.5 text-xs font-bold text-ink"
          >
            <option value="all">All kinds</option>
            <option value="action">Admin actions</option>
            <option value="system">System</option>
            <option value="event">Events</option>
          </select>
        </div>
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <CardListSkeleton count={6} />
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="size-6 text-smoke" aria-hidden="true" />}
          title="No entries match"
          body="Try clearing the filters — everything is logged, so something should be here."
        >
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setAreaFilter("all"); setKindFilter("all"); }}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-smoke">{filtered.length} entries</p>
          <ol className="space-y-2">
            {filtered.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-hard-xs">
                <EventIcon kind={entry.kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold tracking-wide text-accent uppercase">{entry.area}</span>
                    <span className="font-mono text-[10px] text-smoke">·</span>
                    <span className="font-mono text-[10px] font-semibold text-smoke">{entry.action}</span>
                    <StatusPill label={entry.kind} tone={entry.kind === "action" ? "lime" : entry.kind === "system" ? "sand" : "accent"} />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{entry.detail}</p>
                  <p className="mt-1 text-[10px] font-semibold text-smoke">
                    {entry.actor} · {formatDateTime(entry.at)} · {entry.id}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
