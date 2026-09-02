"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { api, getErrorMessage } from "@/lib/api";
import {
  Share2,
  Link2,
  Link2Off,
  ShieldCheck,
  Check,
  TriangleAlert,
  RefreshCw,
  Users,
  Plus,
  Info,
} from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { PLATFORMS, platformById } from "@/lib/constants";
import { Badge, Button, Card, HexAvatar, Modal, Skeleton } from "@/components/ui/primitives";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";
import type { PlatformId, SocialAccount } from "@/lib/types";

const PERMISSIONS = [
  "Read profile & follower insights",
  "Create & schedule posts on your behalf",
  "Read comments & mentions",
];

/** A card row is either a live connected account or an empty connectable slot. */
interface Slot {
  platform: PlatformId;
  account: SocialAccount | null;
}

function AccountsContent() {
  const { ready, accounts, toggleAccount, plan, openUpgrade, refreshAll } = useApp();
  const params = useSearchParams();
  const [target, setTarget] = React.useState<{ platform: PlatformId; account: SocialAccount | null } | null>(null);
  const [phase, setPhase] = React.useState<"authorize" | "working">("authorize");

  /* OAuth return feedback */
  React.useEffect(() => {
    const connected = params.get("connected");
    const oauthError = params.get("oauth_error");
    if (connected) {
      toast.success(`${platformById(connected as PlatformId).name} connected to your hive`);
      void refreshAll();
      window.history.replaceState(null, "", "/accounts");
    } else if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
      window.history.replaceState(null, "", "/accounts");
    }
  }, [params, refreshAll]);

  /**
   * Always render all six platforms. Connected accounts from the database
   * are merged in; platforms with no row render as an empty "Connect" slot.
   * (Previously the grid mapped only DB rows, so a fresh workspace with no
   * accounts showed nothing at all.)
   */
  const slots: Slot[] = React.useMemo(() => {
    const out: Slot[] = [];
    for (const p of PLATFORMS) {
      const live = accounts.filter((a) => a.platform === p.id && a.connected);
      if (live.length) live.forEach((account) => out.push({ platform: p.id, account }));
      else out.push({ platform: p.id, account: accounts.find((a) => a.platform === p.id) ?? null });
    }
    return out;
  }, [accounts]);

  const connectedCount = accounts.filter((a) => a.connected).length;
  const limit = plan === "free" ? 2 : 12;
  const atLimit = connectedCount >= limit;
  const totalReach = accounts.filter((a) => a.connected).reduce((s, a) => s + a.followers, 0);

  function startConnect(platform: PlatformId, account: SocialAccount | null) {
    const isConnected = !!account?.connected;
    if (!isConnected && atLimit) return openUpgrade("accounts");
    setPhase("authorize");
    setTarget({ platform, account });
  }

  async function authorize() {
    if (!target) return;
    setPhase("working");
    try {
      const { data } = await api.get<{ url?: string; simulated?: boolean }>(
        `/api/oauth/${target.platform}/authorize`
      );
      if (data.url) {
        window.location.assign(data.url); // real platform consent screen
        return;
      }
      if (data.simulated) {
        toast.success(`${platformById(target.platform).name} connected`);
        setTarget(null);
        await refreshAll();
        return;
      }
      toast.error("This platform is not configured on the server");
      setTarget(null);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("plan")) {
        setTarget(null);
        openUpgrade("accounts");
      } else {
        toast.error(msg);
        setPhase("authorize");
      }
    }
  }

  async function disconnect(account: SocialAccount) {
    await toggleAccount(account.id);
  }

  if (!ready)
    return (
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="gold" className="!px-3 !py-1.5 !text-xs">
          <Share2 size={12} /> {connectedCount}/{limit} accounts connected
        </Badge>
        <Badge tone="neutral" className="!px-3 !py-1.5 !text-xs">
          <Users size={12} /> {formatCompact(totalReach)} total reach
        </Badge>
        {plan === "free" && atLimit && (
          <button onClick={() => openUpgrade("accounts")} className="cursor-pointer">
            <Badge tone="red" className="!px-3 !py-1.5 !text-xs">
              <TriangleAlert size={12} /> Free plan limit reached — upgrade for 12 slots
            </Badge>
          </button>
        )}
      </div>

      {/* empty-state banner for brand-new workspaces */}
      {connectedCount === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex flex-wrap items-center gap-4 !border-honey-500/40 bg-gradient-to-r from-honey-50 to-cream-50 px-5 py-4 comb-light">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-honey-500/30 bg-honey-500/15 text-honey-700">
              <Plus size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink-950">Connect your first social account</p>
              <p className="text-xs text-ink-600/80">
                Pick any platform below and authorise Beevo — we&apos;ll pull your profile and unlock scheduling.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* platform grid — always all six */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, i) => {
          const meta = platformById(slot.platform);
          const a = slot.account;
          const isConnected = !!a?.connected;
          const expiring = a?.health === "expiring";
          return (
            <motion.div
              key={`${slot.platform}-${a?.id ?? "empty"}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card hover className={cn("flex h-full flex-col p-5", isConnected && expiring && "border-honey-500/50")}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: meta.softBg, color: meta.color }}
                  >
                    <PlatformIcon platform={slot.platform} size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-ink-950">{meta.name}</p>
                    <p className="truncate text-xs text-ink-600/70">{meta.tagline}</p>
                  </div>
                  {isConnected ? (
                    expiring ? (
                      <Badge tone="gold" className="ml-auto shrink-0"><TriangleAlert size={10} /> Re-auth</Badge>
                    ) : (
                      <Badge tone="green" className="ml-auto shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" /> Live
                      </Badge>
                    )
                  ) : (
                    <Badge tone="neutral" className="ml-auto shrink-0">Not linked</Badge>
                  )}
                </div>

                {isConnected && a ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-cream-300/80 bg-cream-50/70 p-3">
                    <HexAvatar name={a.handle} hue={a.avatarHue} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{a.handle}</p>
                      <p className="tnum font-mono text-[10.5px] text-ink-600/60">
                        {formatCompact(a.followers)} followers
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/50 p-3 text-[12px] leading-relaxed text-ink-600/70">
                    Connect to schedule directly to {meta.name} and pull audience insights into your hive.
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {isConnected && a ? (
                    <>
                      <p className="mr-auto font-mono text-[10px] text-ink-600/50">
                        {a.lastSync ? `synced ${formatDistanceToNow(new Date(a.lastSync), { addSuffix: true })}` : "—"}
                      </p>
                      <Button size="xs" variant="outline" onClick={() => startConnect(slot.platform, a)}>
                        <RefreshCw size={12} /> {expiring ? "Reconnect" : "Refresh"}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="!text-berry-600 hover:!bg-red-50"
                        onClick={() => disconnect(a)}
                      >
                        <Link2Off size={12} /> Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant={atLimit ? "outline" : "primary"}
                      className="w-full"
                      onClick={() => startConnect(slot.platform, a)}
                    >
                      <Link2 size={14} /> Connect {meta.name}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* OAuth consent modal */}
      <Modal open={!!target} onClose={() => phase !== "working" && setTarget(null)} size="sm">
        {target && (
          <div className="p-6">
            <div className="flex items-center justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-honey-300/60 bg-honey-100">
                <Share2 size={20} className="text-honey-700" />
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-honey-500"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                  />
                ))}
              </span>
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: platformById(target.platform).softBg, color: platformById(target.platform).color }}
              >
                <PlatformIcon platform={target.platform} size={22} />
              </span>
            </div>

            <h3 className="mt-4 text-center text-lg font-semibold tracking-tight text-ink-950">
              Authorize Beevo on {platformById(target.platform).name}
            </h3>
            <p className="mt-1 text-center text-[13px] text-ink-600/80">Beevo is requesting permission to:</p>

            <ul className="mx-auto mt-4 max-w-xs space-y-2">
              {PERMISSIONS.map((p) => (
                <li key={p} className="flex items-start gap-2 rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-[12.5px] text-ink-700">
                  <Check size={14} className="mt-0.5 shrink-0 text-leaf-600" /> {p}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-600/60">
              <ShieldCheck size={12} className="text-leaf-600" />
              OAuth 2.0 · tokens encrypted at rest · revoke anytime
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={phase === "working"} onClick={() => setTarget(null)}>
                Cancel
              </Button>
              <Button className="flex-1" busy={phase === "working"} onClick={authorize}>
                {phase === "working" ? "Redirecting…" : "Continue"}
              </Button>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-center text-[11px] leading-relaxed text-ink-600/55">
              <Info size={11} className="mt-0.5 shrink-0" />
              You&apos;ll be taken to {platformById(target.platform).name} to approve access, then returned here.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <React.Suspense>
      <AccountsContent />
    </React.Suspense>
  );
}
