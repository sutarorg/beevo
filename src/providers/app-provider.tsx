"use client";

import * as React from "react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { API } from "@/lib/constants";
import { openRazorpayCheckout } from "@/lib/billing";
import type {
  AppStatePayload,
  BillingPayload,
  MediaAsset,
  NotificationItem,
  PlanId,
  PlatformId,
  Post,
  SocialAccount,
  AnalyticsPayload,
} from "@/lib/types";

export interface ComposerOptions {
  date?: string | null;
  post?: Post | null;
  platforms?: PlatformId[];
  media?: string[];
}

interface AppCtx {
  ready: boolean;
  plan: PlanId;
  user: AppStatePayload["user"] | null;
  posts: Post[];
  accounts: SocialAccount[];
  notifications: NotificationItem[];
  analytics: AnalyticsPayload | null;
  billing: BillingPayload | null;
  media: MediaAsset[];
  unreadCount: number;

  composer: { open: boolean; options: ComposerOptions } | null;
  openComposer: (opts?: ComposerOptions) => void;
  closeComposer: () => void;

  upgrade: { open: boolean; reason: string | null };
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;

  refreshAll: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  createPost: (input: Partial<Post>) => Promise<Post | null>;
  patchPost: (id: string, input: Record<string, unknown>, silent?: boolean) => Promise<Post | null>;
  deletePost: (id: string) => Promise<void>;
  duplicatePost: (id: string) => Promise<void>;
  reschedule: (id: string, iso: string) => Promise<void>;
  toggleAccount: (id: string) => Promise<void>;
  setPlan: (plan: PlanId) => Promise<void>;
  markNotifications: (id?: string, all?: boolean) => Promise<void>;
  aiAssist: (brief: string, tone: string) => Promise<string[]>;
}

const Ctx = React.createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [plan, setPlanState] = React.useState<PlanId>("free");
  const [user, setUser] = React.useState<AppStatePayload["user"] | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [analytics, setAnalytics] = React.useState<AnalyticsPayload | null>(null);
  const [billing, setBilling] = React.useState<BillingPayload | null>(null);
  const [media, setMedia] = React.useState<MediaAsset[]>([]);

  const [composer, setComposer] = React.useState<AppCtx["composer"]>(null);
  const [upgrade, setUpgrade] = React.useState<{ open: boolean; reason: string | null }>({
    open: false,
    reason: null,
  });
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  const openComposer = React.useCallback((opts: ComposerOptions = {}) => {
    setComposer({ open: true, options: opts });
  }, []);
  const closeComposer = React.useCallback(() => setComposer(null), []);
  const openUpgrade = React.useCallback((reason?: string) => setUpgrade({ open: true, reason: reason ?? null }), []);
  const closeUpgrade = React.useCallback(() => setUpgrade({ open: false, reason: null }), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const refreshPosts = React.useCallback(async () => {
    const { data } = await api.get<{ posts: Post[] }>(API.posts);
    setPosts(data.posts);
  }, []);

  const refreshAll = React.useCallback(async () => {
    try {
      const [{ data: state }, { data: postData }] = await Promise.all([
        api.get<AppStatePayload>(API.appState),
        api.get<{ posts: Post[] }>(API.posts),
      ]);
      setPlanState(state.plan);
      setUser(state.user);
      setAccounts(state.accounts);
      setNotifications(state.notifications);
      setAnalytics(state.analytics);
      setBilling(state.billing);
      setMedia(state.media);
      setPosts(postData.posts);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("authentication") || msg.toLowerCase().includes("session")) {
        // Not logged in — the API is the source of truth now.
        window.location.assign("/login");
        return;
      }
      toast.error(msg);
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const createPost = React.useCallback(
    async (input: Partial<Post>): Promise<Post | null> => {
      if (
        plan === "free" &&
        billing?.usage &&
        input.status === "scheduled" &&
        billing.usage.postsLimit !== null &&
        billing.usage.postsThisMonth >= billing.usage.postsLimit
      ) {
        openUpgrade("post-limit");
        return null;
      }
      try {
        const { data } = await api.post<{ post: Post }>(API.posts, input);
        await Promise.all([refreshPosts(), refreshAll()]);
        return data.post;
      } catch (err) {
        const msg = getErrorMessage(err);
        if (msg.toLowerCase().includes("plan")) openUpgrade("post-limit");
        else toast.error(msg);
        return null;
      }
    },
    [plan, billing, openUpgrade, refreshPosts, refreshAll]
  );

  const patchPost = React.useCallback(
    async (id: string, input: Record<string, unknown>, silent = false): Promise<Post | null> => {
      try {
        const { data } = await api.patch<{ post: Post }>(API.post(id), input);
        setPosts((prev) => prev.map((p) => (p.id === id ? data.post : p)));
        if (!silent) await refreshAll();
        return data.post;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return null;
      }
    },
    [refreshAll]
  );

  const deletePost = React.useCallback(
    async (id: string) => {
      const backup = posts;
      setPosts((prev) => prev.filter((p) => p.id !== id));
      try {
        await api.delete(API.post(id));
        toast.success("Post deleted");
        await refreshAll();
      } catch (err) {
        setPosts(backup);
        toast.error(getErrorMessage(err));
      }
    },
    [posts, refreshAll]
  );

  const duplicatePost = React.useCallback(
    async (id: string) => {
      try {
        await api.post(API.duplicate(id));
        await refreshPosts();
        toast.success("Duplicated to drafts");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [refreshPosts]
  );

  const reschedule = React.useCallback(
    async (id: string, iso: string) => {
      const prev = posts.find((p) => p.id === id);
      if (!prev) return;
      setPosts((all) => all.map((p) => (p.id === id ? { ...p, scheduledAt: iso, status: "scheduled" } : p)));
      try {
        await api.patch(API.post(id), { scheduledAt: iso, status: "scheduled" });
        toast.success("Post rescheduled");
      } catch (err) {
        setPosts((all) => all.map((p) => (p.id === id ? prev : p)));
        toast.error(getErrorMessage(err));
      }
    },
    [posts]
  );

  const toggleAccount = React.useCallback(
    async (id: string) => {
      try {
        const { data } = await api.post<{ account: SocialAccount; message: string }>(API.accountsToggle, { id });
        setAccounts((prev) => prev.map((a) => (a.id === id ? data.account : a)));
        toast.success(data.message);
        await refreshAll();
      } catch (err) {
        const msg = getErrorMessage(err);
        if (msg.toLowerCase().includes("plan")) openUpgrade("accounts");
        else toast.error(msg);
      }
    },
    [openUpgrade, refreshAll]
  );

  const setPlan = React.useCallback(
    async (next: PlanId) => {
      try {
        if (next === "free") {
          const { data } = await api.post<{ plan: PlanId; message: string }>("/api/billing/cancel");
          toast.success(data.message);
          closeUpgrade();
          await refreshAll();
          return;
        }

        // Pro: real Razorpay checkout when configured, demo activation otherwise.
        const { data: order } = await api.post<{
          configured: boolean;
          demoAllowed?: boolean;
          orderId?: string;
          amount?: number;
          keyId?: string;
          label?: string;
        }>("/api/billing/order", { cycle: "monthly" });

        if (order.configured && order.keyId && order.orderId && order.amount) {
          await openRazorpayCheckout({
            keyId: order.keyId,
            orderId: order.orderId,
            amountPaise: order.amount,
            description: order.label ?? "Beevo Pro",
            email: user?.email,
            name: user?.name,
            onSuccess: async (resp) => {
              try {
                await api.post("/api/billing/verify", {
                  orderId: resp.razorpay_order_id,
                  paymentId: resp.razorpay_payment_id,
                  signature: resp.razorpay_signature,
                });
                toast.success("Welcome to Beevo Pro — the whole hive is yours.");
                closeUpgrade();
                await refreshAll();
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            },
          });
          return;
        }

        if (order.demoAllowed === false) {
          toast.error("Payments are not configured on this deployment. See README → Razorpay setup.");
          return;
        }
        const { data: demo } = await api.post<{ plan: PlanId; message: string }>("/api/billing/demo-activate");
        toast.success(demo.message);
        closeUpgrade();
        await refreshAll();
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [closeUpgrade, refreshAll, user]
  );

  const markNotifications = React.useCallback(async (id?: string, all?: boolean) => {
    try {
      const { data } = await api.patch<{ notifications: NotificationItem[] }>(API.notifications, {
        id,
        all,
      });
      setNotifications(data.notifications);
    } catch {
      /* non-critical */
    }
  }, []);

  const aiAssist = React.useCallback(async (brief: string, tone: string) => {
    try {
      const { data } = await api.post<{ suggestions: string[] }>(API.aiAssist, { brief, tone });
      return data.suggestions;
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("pro")) {
        toast.error(msg);
        return [];
      }
      toast.error(msg);
      return [];
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: AppCtx = {
    ready,
    plan,
    user,
    posts,
    accounts,
    notifications,
    analytics,
    billing,
    media,
    unreadCount,
    composer,
    openComposer,
    closeComposer,
    upgrade,
    openUpgrade,
    closeUpgrade,
    paletteOpen,
    setPaletteOpen,
    refreshAll,
    refreshPosts,
    createPost,
    patchPost,
    deletePost,
    duplicatePost,
    reschedule,
    toggleAccount,
    setPlan,
    markNotifications,
    aiAssist,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
