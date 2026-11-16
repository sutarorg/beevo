import { VISUAL_STYLES } from "./beevo-data";
import { SUPPORTED_ELEVENLABS_LANGUAGES } from "./app-types";
import type {
  AdminAiCostsSnapshot,
  AdminApiResponse,
  AdminApiState,
  AdminAuditLogEntry,
  AdminConfigurationState,
  AdminCreditLedgerRow,
  AdminGenerationDetail,
  AdminGenerationRow,
  AdminMediaAsset,
  AdminMusicTrack,
  AdminOverviewSnapshot,
  AdminPaymentRecord,
  AdminUserDetail,
  AdminUserRow,
} from "./admin-types";

/**
 * Beevo Admin Backend Boundary (Phase 4):
 * - Exposes live typed admin API client methods (`beevoAdminClientApi`) calling server-protected
 *   `/api/admin/*` Route Handlers backed by Supabase SSR Auth + RBAC + audit logging.
 * - Strictly returns empty / unconfigured states with null financial values when Supabase
 *   environment credentials are absent — NEVER fake users, fake payments, or fake costs.
 */
export const IS_ADMIN_BACKEND_CONNECTED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function getAdminApiState(): AdminApiState {
  return IS_ADMIN_BACKEND_CONNECTED ? "connected" : "unconfigured";
}

export function getAdminOverview(): AdminApiResponse<AdminOverviewSnapshot> {
  return {
    state: getAdminApiState(),
    data: {
      metrics: {
        totalUsers: null,
        newUsers: null,
        activeUsers: null,
        totalProjects: null,
        completedVideos: null,
        failedGenerations: null,
        totalGeneratedMinutes: null,
        totalImageRequests: null,
        creditsIssued: null,
        creditsConsumed: null,
        reservedCredits: null,
        grossPaymentReceiptsInr: null,
        netRevenueExTaxInr: null,
        providerExpenditureInr: null,
        renderingExpenditureInr: null,
        contributionMarginPct: null,
      },
      charts: {
        revenueOverTime: [],
        generatedVideoMinutes: [],
        newUsers: [],
        imageGenerationCosts: [],
        voiceGenerationCosts: [],
        renderingExpenses: [],
        creditConsumption: [],
        generationOutcomes: [],
      },
      recentActivity: [],
    },
  };
}

export function getAdminUsers(): AdminApiResponse<AdminUserRow[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminUserDetail(userId: string): AdminApiResponse<AdminUserDetail | null> {
  return { state: getAdminApiState(), data: userId ? null : null };
}

export function getAdminGenerations(): AdminApiResponse<AdminGenerationRow[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminGenerationDetail(
  generationId: string
): AdminApiResponse<AdminGenerationDetail | null> {
  return { state: getAdminApiState(), data: generationId ? null : null };
}

export function getAdminPayments(): AdminApiResponse<AdminPaymentRecord[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminCreditLedger(): AdminApiResponse<AdminCreditLedgerRow[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminAiCosts(): AdminApiResponse<AdminAiCostsSnapshot> {
  return {
    state: getAdminApiState(),
    data: {
      openai: {
        model: null,
        inputTokens: null,
        outputTokens: null,
        scriptExpenditureInr: null,
        storyboardExpenditureInr: null,
        costPerProjectInr: null,
        billingSource: "unavailable",
      },
      falAi: {
        imageModel: null,
        imageRequests: null,
        completedImages: null,
        failedImages: null,
        regeneratedImages: null,
        resolutionSummary: null,
        costPerImageInr: null,
        avgImagesPerFinishedMinute: null,
        totalApiExpenditureInr: null,
        billingSource: "unavailable",
      },
      elevenLabs: {
        voiceModel: null,
        voiceIdsUsed: null,
        billableCharacters: null,
        generatedAudioSeconds: null,
        costPerProjectInr: null,
        costPerFinishedMinuteInr: null,
        billingSource: "unavailable",
      },
      ffmpeg: {
        workerRuntimeSeconds: null,
        avgRenderDurationSeconds: null,
        totalOutputDurationSeconds: null,
        failedJobs: null,
        avgCpuPct: null,
        avgMemoryMb: null,
        actualComputeExpenseInr: null,
        billingSource: "unavailable",
      },
      r2Storage: {
        imageVolumeBytes: null,
        audioVolumeBytes: null,
        videoVolumeBytes: null,
        objectCount: null,
        storageCostInr: null,
        accessOperations: null,
        billingSource: "unavailable",
      },
      profitability: {
        grossRevenueInr: null,
        revenueExTaxInr: null,
        paymentFeesInr: null,
        aiCostsInr: null,
        renderingCostsInr: null,
        storageCostsInr: null,
        variableCostInr: null,
        contributionInr: null,
        contributionMarginPct: null,
        billingSource: "unavailable",
      },
    },
  };
}

export function getAdminMediaAssets(): AdminApiResponse<AdminMediaAsset[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminMusicTracks(): AdminApiResponse<AdminMusicTrack[]> {
  return { state: getAdminApiState(), data: [] };
}

export function getAdminConfiguration(): AdminApiResponse<AdminConfigurationState> {
  return {
    state: getAdminApiState(),
    data: {
      pricing: {
        starter: { priceInr: 299, credits: 300, minutes: 3 },
        creator: { priceInr: 599, credits: 800, minutes: 8 },
        studio: { priceInr: 899, credits: 1500, minutes: 15 },
        configuredGstRatePct: 18,
      },
      creditRules: {
        creditsPerMinute: 100,
        creditsPer15Seconds: 25,
        maxVideoMinutes: 10,
      },
      generation: {
        aspectRatios: ["16:9", "9:16", "1:1"],
        resolutions: ["720p", "1080p"],
        maxDurationSeconds: 600,
        imageModels: [
          "blackforestlabs/flux-3/klein/text-to-image",
          "blackforestlabs/flux-3/klein/edit-image",
        ],
        voiceModels: ["eleven_multilingual_v2", "eleven_flash_v2_5"],
        supportedLanguages: SUPPORTED_ELEVENLABS_LANGUAGES.map((l) => l.label),
        imageConcurrency: 4,
        retryAllowance: 2,
        workerConcurrency: 2,
      },
      creativePresets: {
        cartoonStyles: VISUAL_STYLES.map((s) => s.name),
        narrationTones: [
          "Friendly Storyteller",
          "Educational Teacher",
          "Energetic Narrator",
          "Documentary Narrator",
          "Calm Narrator",
        ],
        visualPacing: ["Calm", "Balanced", "Dynamic"],
        cameraMovement: ["Automatic", "Slow Zoom", "Dynamic Zoom", "Pan", "Mixed"],
        transitions: ["Automatic", "Crossfade", "Zoom", "Slide", "Cut"],
        captionOptions: ["Bottom / Middle / Top", "Small / Medium / Large", "Word Highlighting"],
        musicMoods: ["Happy", "Cinematic", "Playful", "Emotional", "Relaxing", "Educational"],
      },
    },
  };
}

export function getAdminAuditLogs(): AdminApiResponse<AdminAuditLogEntry[]> {
  return { state: getAdminApiState(), data: [] };
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Admin request failed (${res.status})`);
  }
  return json as T;
}

/**
 * Live Phase 4 admin API client calling server-verified `/api/admin/*` endpoints.
 */
export const beevoAdminClientApi = {
  getOverview: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return adminFetch<AdminOverviewSnapshot>(`/api/admin/overview${suffix}`);
  },
  getUsers: () => adminFetch<{ users: AdminUserRow[] }>("/api/admin/users"),
  getUserDetail: (id: string) => adminFetch<{ user: AdminUserDetail }>(`/api/admin/users/${id}`),
  updateUserStatus: (id: string, status: "active" | "suspended", reason: string) =>
    adminFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  adjustCredits: (payload: { userId: string; delta: number; reason: string }) =>
    adminFetch("/api/admin/credits/adjust", { method: "POST", body: JSON.stringify(payload) }),
  getCreditLedger: () => adminFetch<{ ledger: AdminCreditLedgerRow[] }>("/api/admin/credits/ledger"),
  getGenerations: () => adminFetch<{ generations: AdminGenerationRow[] }>("/api/admin/generations"),
  getGenerationDetail: (id: string) => adminFetch(`/api/admin/generations/${id}`),
  retryGeneration: (id: string, reason: string, stage?: string) =>
    adminFetch(`/api/admin/generations/${id}/retry`, {
      method: "POST",
      body: JSON.stringify({ reason, stage }),
    }),
  getPayments: () => adminFetch<{ payments: AdminPaymentRecord[] }>("/api/admin/payments"),
  refundPayment: (id: string, reason: string, amountPaise?: number) =>
    adminFetch(`/api/admin/payments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason, amountPaise }),
    }),
  getAiCosts: () => adminFetch<AdminAiCostsSnapshot>("/api/admin/costs"),
  getMediaAssets: () => adminFetch<{ assets: AdminMediaAsset[] }>("/api/admin/media"),
  getMusicTracks: () => adminFetch<{ tracks: AdminMusicTrack[] }>("/api/admin/music"),
  createMusicTrack: (payload: Record<string, unknown>) =>
    adminFetch("/api/admin/music", { method: "POST", body: JSON.stringify(payload) }),
  updateMusicTrack: (id: string, payload: Record<string, unknown>) =>
    adminFetch(`/api/admin/music/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getConfig: () => adminFetch<{ config: unknown[] }>("/api/admin/config"),
  updateConfig: (key: string, value: Record<string, unknown>) =>
    adminFetch("/api/admin/config", { method: "PATCH", body: JSON.stringify({ key, value }) }),
  getAuditLogs: () => adminFetch<{ logs: AdminAuditLogEntry[] }>("/api/admin/audit-logs"),
};
