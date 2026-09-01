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
} from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { platformById } from "@/lib/constants";
import { Badge, Button, Card, HexAvatar, Modal, Skeleton } from "@/components/ui/primitives";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";
import type { SocialAccount } from "@/lib/types";

const PERMISSIONS = [
  "Read profile & follower insights",
  "Create & schedule posts on your behalf",
  "Read comments & mentions",
];

function AccountsContent() {
  const { ready, accounts, toggleAccount, plan, openUpgrade, refreshAll } = useApp();
  const params = useSearchParams();
  const [connecting, setConnecting] = React.useState<SocialAccount | null>(null);
  const [phase, setPhase] = React.useState<"authorize" | "working">("authorize");

  /* OAuth return feedback */
  React.useEffect(() => {
    const connected = params.get("connected");
    const oauthError = params.get("oauth_error");
    if (connected) {
      toast.success(`${connected} connected to your hive`);
      void refreshAll();
      window.history.replaceState(null, "", "/accounts");
    } else if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
      window.history.replaceState(null, "", "/accounts");
    }
  }, [params, refreshAll]);

  const connectedCount = accounts.filter((a) => a.connected).length;
  const limit = plan === "free" ? 2 : 12;
  const totalReach = accounts.filter((a) => a.connected).reduce((s, a) => s + a.followers, 0);

  function startConnect(a: SocialAccount) {
    if (plan === "free" && connectedCount >= limit && !a.connected) return openUpgrade("accounts");
    setPhase("authorize");
    setConnecting(a);
  }

  async function authorize() {
    if (!connecting) return;
    setPhase("working");
    try {
      const { data } = await api.get<{ url?: string; simulated?: boolean }>(
        `/api/oauth/${connecting.platform}/authorize`
      );
      if (data.url) {
        // Real OAuth consent screen on the platform.
        window.location.assign(data.url);
        return;
      }
      if (data.simulated) {
        toast.success(`${connecting.platform} connected (demo mode — add OAuth keys for live publishing)`);
        setConnecting(null);
        await refreshAll();
        return;
      }
      toast.error("This platform is not configured on the server");
      setConnecting(null);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("plan")) openUpgrade("accounts");
      else toast.error(msg);
      setPhase("authorize");
    }
  }

  if (!ready)
    return (
      <div className="mx-auto max-w-6xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="gold" className="!px-3 !py-1.5 !text-xs">
          <Share2 size={12} /> {connectedCount}/{limit} accounts connected
        </Badge>
        <Badge tone="neutral" className="!px-3 !py-1.5 !text-xs">
          <Users size={12} /> {formatCompact(totalReach)} total reach
        </Badge>
        {plan === "free" && connectedCount >= limit && (
          <button onClick={() => openUpgrade("accounts")} className="cursor-pointer">
            <Badge tone="red" className="!px-3 !py-1.5 !text-xs">
              <TriangleAlert size={12} /> Free plan limit reached — upgrade for 12 slots
            </Badge>
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a, i) => {
          const meta = platformById(a.platform);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className={cn("flex h-full flex-col p-5", a.connected && a.health === "expiring" && "border-honey-500/50")}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: meta.softBg, color: meta.color }}
                  >
                    <PlatformIcon platform={a.platform} size={22} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-ink-950">{meta.name}</p>
                    <p className="text-xs text-ink-600/70">{meta.tagline}</p>
                  </div>
                  {a.connected ? (
                    a.health === "expiring" ? (
                      <Badge tone="gold" className="ml-auto"><TriangleAlert size={10} /> Re-auth</Badge>
                    ) : (
                      <Badge tone="green" className="ml-auto"><span className="h-1.5 w-1.5 rounded-full bg-leaf-500" /> Live</Badge>
                    )
                  ) : (
                    <Badge tone="neutral" className="ml-auto">Not linked</Badge>
                  )}
                </div>

                {a.connected ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-cream-300/80 bg-cream-50/70 p-3">
                    <HexAvatar name={a.handle} hue={a.avatarHue} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{a.handle}</p>
                      <p className="tnum font-mono text-[10.5px] text-ink-600/60">
                        {formatCompact(a.followers)} followers · {a.postsThisWeek} posts/wk
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/50 p-3 text-[12px] leading-relaxed text-ink-600/70">
                    Connect to schedule directly to {meta.name} and pull audience insights into your hive.
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-4">
                  {a.connected ? (
                    <>
                      <p className="mr-auto font-mono text-[10px] text-ink-600/50">
                        {a.lastSync ? `synced ${formatDistanceToNow(new Date(a.lastSync), { addSuffix: true })}` : "—"}
                      </p>
                      {a.health === "expiring" && (
                        <Button size="xs" variant="outline" onClick={() => startConnect(a)}>
                          <RefreshCw size={12} /> Reconnect
                        </Button>
                      )}
                      <Button size="xs" variant="ghost" className="!text-berry-600 hover:!bg-red-50" onClick={() => toggleAccount(a.id)}>
                        <Link2Off size={12} /> Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => startConnect(a)}>
                      <Link2 size={14} /> Connect {meta.name}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* OAuth simulation modal */}
      <Modal open={!!connecting} onClose={() => phase !== "working" && setConnecting(null)} size="sm">
        {connecting && (
          <div className="p-6">
            <div className="flex items-center justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-honey-100 border border-honey-300/60">
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
                style={{ background: platformById(connecting.platform).softBg, color: platformById(connecting.platform).color }}
              >
                <PlatformIcon platform={connecting.platform} size={22} />
              </span>
            </div>

            <h3 className="mt-4 text-center text-lg font-semibold tracking-tight text-ink-950">
              Authorize Beevo on {platformById(connecting.platform).name}
            </h3>
            <p className="mt-1 text-center text-[13px] text-ink-600/80">
              Beevo is requesting permission to:
            </p>

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
              <Button variant="outline" className="flex-1" disabled={phase === "working"} onClick={() => setConnecting(null)}>
                Cancel
              </Button>
              <Button className="flex-1" busy={phase === "working"} onClick={authorize}>
                {phase === "working" ? "Authorizing…" : "Authorize"}
              </Button>
            </div>
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
