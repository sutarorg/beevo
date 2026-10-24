"use client";

import {
  ArrowRight,
  ChartColumn,
  Clapperboard,
  IndianRupee,
  Plus,
  ReceiptText,
  UserRoundPlus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { formatINR } from "@/lib/domain";
import { useAsyncData } from "@/lib/hooks";
import { getCourseService } from "@/lib/services/courses";
import { getCreatorDataService } from "@/lib/services/creator-data";
import type { OrderStatus } from "@/lib/creator-types";
import { formatDate } from "@/lib/utils";
import { NotificationsList } from "@/components/creator/notifications";
import {
  CardListSkeleton,
  CopyButton,
  FailedState,
  PageHeader,
  StatCard,
  StatGridSkeleton,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";

const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  paid: "bg-lime/60 text-ink border-ink",
  refunded: "bg-sand text-smoke border-ink/30",
};

export default function CreatorDashboardPage() {
  const dataService = getCreatorDataService();
  const courseService = getCourseService();
  const { state, reload } = useAsyncData(async () => {
    if (!dataService || !courseService) {
      return {
        ok: false as const,
        error: { code: "unavailable", message: "Services unavailable" },
      };
    }
    const [dashboard, courses] = await Promise.all([
      dataService.getDashboard(),
      courseService.listCourses(),
    ]);
    if (!dashboard.ok) return dashboard;
    if (!courses.ok) return courses;
    return { ok: true as const, data: { ...dashboard.data, courses: courses.data } };
  }, []);

  const firstName =
    state.status === "success" ? state.data.profile.displayName.trim().split(" ")[0] : "";

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        sub="Here's the shape of your course business today."
      >
        <Button href="/creator/courses/new" variant="accent" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Create course
        </Button>
      </PageHeader>

      {state.status === "loading" || state.status === "idle" ? (
        <div className="space-y-5">
          <StatGridSkeleton />
          <CardListSkeleton count={3} />
        </div>
      ) : state.status === "error" ? (
        <FailedState body={state.error.message} onRetry={reload} />
      ) : (
        <DashboardBody data={state.data} reload={reload} />
      )}
    </div>
  );
}

type DashboardState = Awaited<ReturnType<NonNullable<ReturnType<typeof getCreatorDataService>>["getDashboard"]>> extends infer R
  ? R extends { ok: true; data: infer D }
    ? D & { courses: import("@/lib/creator-types").CourseListItem[] }
    : never
  : never;

function DashboardBody({ data, reload }: { data: DashboardState; reload: () => void }) {
  const statusCounts = useMemo(() => {
    const counts = { draft: 0, published: 0, unpublished: 0, archived: 0 };
    for (const course of data.courses) counts[course.status] += 1;
    return counts;
  }, [data.courses]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<IndianRupee className="size-4.5" aria-hidden="true" />}
          label="Gross · last 30 days"
          value={formatINR(data.overview.grossLast30dInPaise)}
        />
        <StatCard
          icon={<UserRoundPlus className="size-4.5" aria-hidden="true" />}
          label="Enrolments · 30 days"
          value={String(data.overview.enrollmentsLast30d)}
          hint="One enrolment per sale"
        />
        <StatCard
          icon={<ReceiptText className="size-4.5" aria-hidden="true" />}
          label="Orders · 30 days"
          value={String(data.overview.ordersLast30d)}
        />
        <StatCard
          icon={<Wallet className="size-4.5" aria-hidden="true" />}
          label="Available balance"
          value={formatINR(data.earnings.availableInPaise)}
          hint="After 8% commission and recorded payouts"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Recent orders */}
        <section aria-labelledby="recent-orders" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 id="recent-orders" className="flex items-center gap-2 text-base font-bold text-ink">
              Recent orders
            </h2>
            <Link href="/creator/orders" className="inline-flex items-center gap-1 text-xs font-bold text-accent">
              All orders <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink/10">
            {data.recentOrders.length === 0 ? (
              <li className="rounded-xl border-2 border-dashed border-ink/25 bg-parchment/50 px-4 py-6 text-center text-sm text-smoke">
                No orders yet. They appear here the moment a course sells.
              </li>
            ) : null}
            {data.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-parchment text-xs font-bold">
                  {order.buyerName.split(" ").map((part) => part[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{order.buyerName}</p>
                  <p className="truncate text-xs text-smoke">
                    {order.courseTitle} · {formatDate(order.placedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink tabular-nums">{formatINR(order.grossInPaise)}</p>
                  <span className={`inline-block rounded-full border px-1.5 text-[9px] font-bold tracking-wide uppercase ${ORDER_STATUS_STYLE[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Publication statuses */}
        <section aria-labelledby="pub-status" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 id="pub-status" className="flex items-center gap-2 text-base font-bold text-ink">
              <Clapperboard className="size-4.5 text-accent" aria-hidden="true" /> Course statuses
            </h2>
            <Link href="/creator/courses" className="inline-flex items-center gap-1 text-xs font-bold text-accent">
              Manage <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-4 space-y-2.5">
            {(
              [
                ["published", "Published", "bg-lime"],
                ["draft", "Drafts", "bg-parchment"],
                ["unpublished", "Unpublished", "bg-sand"],
                ["archived", "Archived", "bg-smoke/20"],
              ] as const
            ).map(([key, label, dot]) => (
              <li key={key} className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-cream px-3 py-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className={`inline-block size-2.5 rounded-full border border-ink ${dot}`} />
                  {label}
                </span>
                <span className="text-sm font-bold text-ink tabular-nums">{statusCounts[key]}</span>
              </li>
            ))}
          </ul>
          <Button href="/creator/courses/new" variant="ink" size="sm" className="mt-4 w-full">
            <Plus className="size-4" aria-hidden="true" />
            New course draft
          </Button>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Notifications */}
        <section
          aria-labelledby="dash-ntf"
          className="min-w-0 rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs"
        >
          <h2 id="dash-ntf" className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
            Notifications
          </h2>
          {/*
            The list scrolls inside the card instead of growing past it: a long
            notification feed used to push this card taller than its grid row,
            letting it run under the next section and look like it overlapped
            the header on short viewports.
          */}
          <div className="max-h-[24rem] overflow-y-auto pr-0.5">
            <NotificationsList
              notifications={data.notifications}
              onMarkAllRead={async () => {
                const service = getCreatorDataService();
                if (!service) return;
                await service.markAllNotificationsRead();
                reload();
              }}
            />
          </div>
        </section>

        {/* Earnings + performance mini */}
        <div className="space-y-5">
          <section aria-labelledby="dash-earnings" className="rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 id="dash-earnings" className="text-base font-bold">
                Earnings
              </h2>
              <Link href="/creator/earnings" className="inline-flex items-center gap-1 text-xs font-bold text-lime">
                Details <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-4 font-editorial text-4xl italic tabular-nums">
              {formatINR(data.earnings.creatorShareInPaise)}
            </p>
            <p className="text-xs text-cream/60">Your 92% share, all time</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border-2 border-cream/20 bg-cream/5 p-3">
                <p className="text-lime tabular-nums">{formatINR(data.earnings.availableInPaise)}</p>
                <p className="text-[10px] tracking-wide text-cream/50 uppercase">Awaiting payout</p>
              </div>
              <div className="rounded-xl border-2 border-cream/20 bg-cream/5 p-3">
                <p className="tabular-nums">{formatINR(data.earnings.paidOutInPaise)}</p>
                <p className="text-[10px] tracking-wide text-cream/50 uppercase">Paid out (manual)</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="dash-perf" className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 id="dash-perf" className="flex items-center gap-2 text-base font-bold text-ink">
                <ChartColumn className="size-4.5 text-accent" aria-hidden="true" /> Top courses
              </h2>
              <Link href="/creator/analytics" className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                Analytics <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-4 space-y-2.5">
              {data.performance.length === 0 ? (
                <li className="rounded-xl border-2 border-dashed border-ink/25 bg-parchment/50 px-4 py-6 text-center text-sm text-smoke">
                  Publish a course and share your link — sales will show up here.
                </li>
              ) : null}
              {data.performance.map((row) => (
                <li key={row.courseId} className="rounded-xl border-2 border-ink/10 bg-cream p-3">
                  <p className="truncate text-sm font-bold text-ink">{row.title}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-smoke">
                    <span>
                      {row.sales} sales · <span className="font-semibold text-ink tabular-nums">{formatINR(row.grossInPaise)}</span>
                    </span>
                    <span className="font-semibold text-moss tabular-nums">you: {formatINR(row.shareInPaise)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border-2 border-dashed border-ink/40 bg-parchment/60 p-5">
            <p className="text-xs font-bold tracking-[0.18em] text-smoke uppercase">Your storefront</p>
            <p className="mt-1.5 truncate text-sm font-bold text-ink">{data.profile.publicUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={data.profile.publicUrl} />
              <Button href="/creator/profile" variant="outline" size="sm">
                Edit profile
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
