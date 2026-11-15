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
 * Phase 2 Frontend-Only Boundary:
 * Until Phase 4 connects Supabase Auth, Postgres, ElevenLabs, fal.ai, OpenAI, FFmpeg, and Cloudflare R2,
 * all data adapters strictly return unconfigured/empty results — NEVER fake demo profiles, balances,
 * voices, tracks, projects, videos, transactions, or notifications.
 */
export const IS_BACKEND_CONNECTED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL
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
  return {
    connectionState: getConnectionState(),
    data: [],
  };
}

export function getMusicCatalog(): ApiResult<MusicTrackEntry[]> {
  return {
    connectionState: getConnectionState(),
    data: [],
  };
}

export function getProjectStoryboard(projectId: string): ApiResult<StoryboardRecord | null> {
  return {
    connectionState: getConnectionState(),
    data: projectId ? null : null,
  };
}

export function getGenerationJob(generationId: string): ApiResult<GenerationJob | null> {
  return {
    connectionState: getConnectionState(),
    data: generationId ? null : null,
  };
}

export function getUserVideos(): ApiResult<VideoAsset[]> {
  return {
    connectionState: getConnectionState(),
    data: [],
  };
}

export function getVideoDetail(videoId: string): ApiResult<VideoAsset | null> {
  return {
    connectionState: getConnectionState(),
    data: videoId ? null : null,
  };
}

export function getUserTransactions(): ApiResult<CreditTransaction[]> {
  return {
    connectionState: getConnectionState(),
    data: [],
  };
}

export function getUserNotifications(): ApiResult<NotificationItem[]> {
  return {
    connectionState: getConnectionState(),
    data: [],
  };
}
