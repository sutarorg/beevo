"use client";

import { Bell, CheckCheck, IndianRupee, Landmark, Sparkles, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import type { CreatorNotification, NotificationKind } from "@/lib/creator-types";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FailedState } from "@/components/creator/ui";
import { Modal } from "@/components/creator/dialogs";
import { Button } from "@/components/ui/button";

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  enrollment: UserRoundPlus,
  payout: Landmark,
  system: Sparkles,
  sale: IndianRupee,
};

export function NotificationsList({
  notifications,
  onMarkAllRead,
  marking,
}: {
  notifications: CreatorNotification[];
  onMarkAllRead?: () => void;
  marking?: boolean;
}) {
  const unread = notifications.filter((notification) => !notification.read).length;
  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-parchment/60 px-4 py-8 text-center">
        <p className="text-sm font-bold text-ink">All caught up</p>
        <p className="mt-1 text-xs text-smoke">New enrolments and payout updates will land here.</p>
      </div>
    );
  }
  return (
    <div>
      {onMarkAllRead && unread > 0 ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={marking}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent underline underline-offset-2 disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" aria-hidden="true" />
            Mark all read ({unread})
          </button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {notifications.map((notification) => {
          const Icon = KIND_ICONS[notification.kind] ?? Sparkles;
          return (
            <li
              key={notification.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border-2 p-3.5",
                notification.read ? "border-ink/15 bg-white" : "border-ink bg-lime/40",
              )}
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{notification.title}</p>
                  <span className="shrink-0 text-[10px] font-semibold text-smoke">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-smoke">{notification.body}</p>
              </div>
              {!notification.read ? (
                <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () => (service ? service.listNotifications() : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } })),
    [open],
  );

  const unread =
    state.status === "success" ? state.data.filter((n) => !n.read).length : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid size-10 place-items-center rounded-xl border-2 border-ink bg-white shadow-hard-xs transition-transform active:translate-y-0.5 active:shadow-none"
      >
        <Bell className="size-4.5" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-accent text-[10px] font-bold text-cream">
            {unread}
          </span>
        ) : null}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Notifications">
        {state.status === "loading" || state.status === "idle" ? (
          <p className="py-8 text-center text-sm text-smoke">Loading…</p>
        ) : state.status === "error" ? (
          <FailedState title="Couldn't load notifications" onRetry={reload} />
        ) : (
          <NotificationsList
            notifications={state.data}
            marking={marking}
            onMarkAllRead={async () => {
              if (!service) return;
              setMarking(true);
              await service.markAllNotificationsRead();
              setMarking(false);
              reload();
            }}
          />
        )}
        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
