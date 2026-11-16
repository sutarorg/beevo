import type {
  BackendConnectionState,
  CreditTransaction,
  CreditWallet,
  GenerationJob,
  MusicTrackEntry,
  NotificationItem,
  ProjectSummary,
  StoryboardRecord,
  UserProfile,
  VideoAsset,
  VoiceCatalogEntry,
} from "./app-types";

/**
 * Beevo Backend Connection Boundary (Phase 4):
 * - Detects whether Supabase credentials are active in the deployment.
 * - Exposes typed async client fetchers targeting real Next.js Route Handlers (`/api/*`).
 * - Strictly NEVER fabricates demo profiles, wallets, voices, projects, videos, or transactions
 *   when backend environment variables are unconfigured.
 */
export const IS_BACKEND_CONNECTED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function getConnectionState(): BackendConnectionState {
  return IS_BACKEND_CONNECTED ? "connected" : "unconfigured";
}

export interface ApiResult<T> {
  connectionState: BackendConnectionState;
  data: T;
}

export function getInitialSessionData(): ApiResult<{
  user: UserProfile | null;
  wallet: CreditWallet | null;
  unreadNotifications: number;
}> {
  return {
    connectionState: getConnectionState(),
    data: {
      user: null,
      wallet: null,
      unreadNotifications: 0,
    },
  };
}

export function getDashboardSnapshot(): ApiResult<{
  wallet: CreditWallet | null;
  recentProjects: ProjectSummary[];
  activeGeneration: GenerationJob | null;
  recentTransactions: CreditTransaction[];
}> {
  return {
    connectionState: getConnectionState(),
    data: {
      wallet: null,
      recentProjects: [],
      activeGeneration: null,
      recentTransactions: [],
    },
  };
}

export function getVoiceCatalog(): ApiResult<VoiceCatalogEntry[]> {
  return { connectionState: getConnectionState(), data: [] };
}

export function getMusicCatalog(): ApiResult<MusicTrackEntry[]> {
  return { connectionState: getConnectionState(), data: [] };
}

export function getProjectStoryboard(projectId: string): ApiResult<StoryboardRecord | null> {
  return { connectionState: getConnectionState(), data: projectId ? null : null };
}

export function getGenerationJob(generationId: string): ApiResult<GenerationJob | null> {
  return { connectionState: getConnectionState(), data: generationId ? null : null };
}

export function getUserVideos(): ApiResult<VideoAsset[]> {
  return { connectionState: getConnectionState(), data: [] };
}

export function getVideoDetail(videoId: string): ApiResult<VideoAsset | null> {
  return { connectionState: getConnectionState(), data: videoId ? null : null };
}

export function getUserTransactions(): ApiResult<CreditTransaction[]> {
  return { connectionState: getConnectionState(), data: [] };
}

export function getUserNotifications(): ApiResult<NotificationItem[]> {
  return { connectionState: getConnectionState(), data: [] };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as T;
}

/**
 * Live Phase 4 browser API client for Beevo Studio & User Workspace.
 */
export const beevoClientApi = {
  getHealth: () => apiFetch<{ status: string; databaseReachable: boolean; integrations: Record<string, boolean> }>("/api/health"),
  getPackages: () => apiFetch<{ source: string; packages: unknown[] }>("/api/packages"),
  getVoices: () => apiFetch<{ provider: string; count: number; voices: VoiceCatalogEntry[] }>("/api/voices"),
  getMusic: () => apiFetch<{ configured: boolean; tracks: MusicTrackEntry[] }>("/api/music"),
  getMe: () => apiFetch<{ user: UserProfile; wallet: CreditWallet }>("/api/me"),
  updateMe: (payload: Record<string, unknown>) =>
    apiFetch("/api/me", { method: "PATCH", body: JSON.stringify(payload) }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  getCredits: () => apiFetch<CreditWallet>("/api/credits"),
  getTransactions: () => apiFetch<{ total: number; transactions: CreditTransaction[] }>("/api/credits/transactions"),
  createRazorpayOrder: (packageId: "starter" | "creator" | "studio") =>
    apiFetch<{
      paymentRecordId: string;
      razorpayOrderId: string;
      razorpayKeyId: string;
      amountPaise: number;
      currency: string;
      packageName: string;
      credits: number;
    }>("/api/payments/create-order", { method: "POST", body: JSON.stringify({ packageId }) }),
  verifyRazorpayPayment: (payload: {
    paymentRecordId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiFetch("/api/payments/verify", { method: "POST", body: JSON.stringify(payload) }),
  listProjects: () => apiFetch<{ projects: ProjectSummary[] }>("/api/projects"),
  createProject: (payload: Record<string, unknown>) =>
    apiFetch("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
  getProject: (id: string) => apiFetch(`/api/projects/${id}`),
  generateScript: (projectId: string, payload?: Record<string, unknown>) =>
    apiFetch(`/api/projects/${projectId}/generate-script`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  generateStoryboard: (projectId: string, payload?: Record<string, unknown>) =>
    apiFetch(`/api/projects/${projectId}/generate-storyboard`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  startGeneration: (projectId: string, idempotencyKey?: string) =>
    apiFetch<{ generationId: string; status: string; creditsReserved: number; expectedImageCount: number }>(
      `/api/projects/${projectId}/generate`,
      { method: "POST", body: JSON.stringify({ idempotencyKey }) }
    ),
  getGeneration: (id: string) => apiFetch(`/api/generations/${id}`),
  cancelGeneration: (id: string) =>
    apiFetch(`/api/generations/${id}/cancel`, { method: "POST" }),
  subscribeGenerationEvents: (id: string) => new EventSource(`/api/generations/${id}/events`),
  updateScene: (id: string, payload: Record<string, unknown>) =>
    apiFetch(`/api/scenes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  regenerateSceneImage: (id: string, promptOverride?: string) =>
    apiFetch(`/api/scenes/${id}/regenerate-image`, {
      method: "POST",
      body: JSON.stringify({ promptOverride }),
    }),
  listVideos: () => apiFetch<{ videos: VideoAsset[] }>("/api/videos"),
  getVideoDownloadUrl: (id: string) =>
    apiFetch<{ videoId: string; downloadUrl: string; expiresInSeconds: number; sizeBytes: number }>(
      `/api/videos/${id}/download`
    ),
  listNotifications: () => apiFetch<{ notifications: NotificationItem[] }>("/api/notifications"),
  markNotificationRead: (id: string) =>
    apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
};
