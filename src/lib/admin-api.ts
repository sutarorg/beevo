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
 * Phase 3 Frontend-Only Admin Boundary:
 * Until Phase 4 connects Supabase SSR Auth + Postgres RLS + Razorpay + OpenAI + fal.ai +
 * ElevenLabs + FFmpeg workers + Cloudflare R2, all admin data adapters strictly return
 * unconfigured / empty operational states with null financial values — NEVER fake users,
 * fake revenue, fake payments, fake generations, fake AI costs, fake media, or fake logs.
 */
export const IS_ADMIN_BACKEND_CONNECTED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_ADMIN_API_READY === "true"
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

/**
 * Confirmed published Beevo product configuration defaults.
 * Contains zero secret API credentials; runtime persistence connects in Phase 4.
 */
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
        imageModels: ["fal-ai/flux-pro (configured server-side in Phase 4)"],
        voiceModels: ["eleven_multilingual_v2 (configured server-side in Phase 4)"],
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
