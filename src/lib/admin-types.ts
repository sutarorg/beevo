export type AdminApiState =
  | "unconfigured"
  | "unauthorized"
  | "forbidden"
  | "session_expired"
  | "rate_limited"
  | "error"
  | "connected";

export interface AdminApiError {
  code: string;
  message: string;
  retryAfterSeconds?: number;
}

export interface AdminApiResponse<T> {
  state: AdminApiState;
  data: T;
  error?: AdminApiError;
}

export type AdminDatePreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface AdminDateRange {
  preset: AdminDatePreset;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export type BillingSourceKind = "actual" | "estimated" | "unavailable";

export interface OverviewMetrics {
  totalUsers: number | null;
  newUsers: number | null;
  activeUsers: number | null;
  totalProjects: number | null;
  completedVideos: number | null;
  failedGenerations: number | null;
  totalGeneratedMinutes: number | null;
  totalImageRequests: number | null;
  creditsIssued: number | null;
  creditsConsumed: number | null;
  reservedCredits: number | null;
  grossPaymentReceiptsInr: number | null;
  netRevenueExTaxInr: number | null;
  providerExpenditureInr: number | null;
  renderingExpenditureInr: number | null;
  contributionMarginPct: number | null;
}

export interface ChartPoint {
  date: string;
  primary: number;
  secondary?: number;
}

export interface AdminActivityEvent {
  id: string;
  category:
    | "registration"
    | "payment"
    | "generation_completed"
    | "generation_failed"
    | "credit_adjustment"
    | "refund";
  summary: string;
  actorOrUser: string;
  referenceId: string;
  timestamp: string;
  href: string | null;
}

export interface AdminOverviewSnapshot {
  metrics: OverviewMetrics;
  charts: {
    revenueOverTime: ChartPoint[];
    generatedVideoMinutes: ChartPoint[];
    newUsers: ChartPoint[];
    imageGenerationCosts: ChartPoint[];
    voiceGenerationCosts: ChartPoint[];
    renderingExpenses: ChartPoint[];
    creditConsumption: ChartPoint[];
    generationOutcomes: ChartPoint[]; // primary = completed, secondary = failed
  };
  recentActivity: AdminActivityEvent[];
}

export type AccountStatus = "active" | "suspended";

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  registeredAt: string;
  creditBalance: number | null;
  totalProjects: number;
  completedVideos: number;
  generatedDurationSeconds: number;
  status: AccountStatus;
}

export interface AdminUserDetail extends AdminUserRow {
  reservedCredits: number | null;
  lifetimePurchasedCredits: number | null;
  totalGenerationCostInr: number | null;
  costSource: BillingSourceKind;
  projects: {
    id: string;
    title: string;
    status: string;
    durationSeconds: number;
    updatedAt: string;
  }[];
  videos: {
    id: string;
    title: string;
    durationSeconds: number;
    resolution: string;
    createdAt: string;
  }[];
  payments: AdminPaymentRecord[];
  ledger: AdminCreditLedgerRow[];
  generations: AdminGenerationRow[];
}

export type AdminPipelineStageKey =
  | "script_creation"
  | "storyboard_creation"
  | "character_generation"
  | "image_generation"
  | "voice_generation"
  | "audio_synchronization"
  | "dynamic_timeline"
  | "ffmpeg_rendering"
  | "final_mp4_upload";

export const ADMIN_PIPELINE_STAGES: {
  order: number;
  key: AdminPipelineStageKey;
  label: string;
  provider: string;
}[] = [
  { order: 1, key: "script_creation", label: "Script creation", provider: "OpenAI" },
  { order: 2, key: "storyboard_creation", label: "Storyboard creation", provider: "OpenAI" },
  { order: 3, key: "character_generation", label: "Character generation", provider: "fal.ai" },
  { order: 4, key: "image_generation", label: "Image generation", provider: "fal.ai" },
  { order: 5, key: "voice_generation", label: "Voice generation", provider: "ElevenLabs" },
  { order: 6, key: "audio_synchronization", label: "Audio synchronization", provider: "ElevenLabs" },
  { order: 7, key: "dynamic_timeline", label: "Dynamic timeline", provider: "Beevo Engine" },
  { order: 8, key: "ffmpeg_rendering", label: "FFmpeg rendering", provider: "FFmpeg Worker" },
  { order: 9, key: "final_mp4_upload", label: "Final MP4 upload", provider: "Cloudflare R2" },
];

export type GenerationOverallStatus = "queued" | "running" | "completed" | "failed";
export type SubStatus = "pending" | "running" | "completed" | "failed";

export interface AdminGenerationRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectTitle: string;
  durationSeconds: number;
  dynamicImageCount: number | null;
  completedImageCount: number;
  currentStage: AdminPipelineStageKey;
  status: GenerationOverallStatus;
  voiceStatus: SubStatus;
  alignmentStatus: SubStatus;
  renderingStatus: SubStatus;
  exportStatus: SubStatus;
  reservedCredits: number;
  consumedCredits: number | null;
  actualCostInr: number | null;
  costSource: BillingSourceKind;
  providersUsed: string[];
  createdAt: string;
}

export interface AdminGenerationDetail extends AdminGenerationRow {
  originalIdea: string;
  scriptText: string | null;
  storyboardScenes: {
    sceneIndex: number;
    narration: string;
    prompt: string;
    status: string;
    imageKey: string | null;
  }[];
  characterReferences: {
    id: string;
    name: string;
    status: string;
    storageKey: string | null;
  }[];
  voiceMetadata: {
    model: string | null;
    voiceId: string | null;
    language: string | null;
    billableCharacters: number | null;
    audioDurationSeconds: number | null;
  };
  alignmentSummary: {
    wordCount: number | null;
    syncedSegments: number | null;
    status: SubStatus;
  };
  timelineSegments: {
    sceneIndex: number;
    startSeconds: number;
    endSeconds: number;
    transition: string;
  }[];
  renderLogs: {
    timestamp: string;
    level: "info" | "warn" | "error";
    stage: AdminPipelineStageKey;
    message: string;
  }[];
  retryRecords: {
    attempt: number;
    stage: AdminPipelineStageKey;
    provider: string;
    reason: string;
    timestamp: string;
  }[];
  errorDetails: {
    code: string;
    stage: AdminPipelineStageKey;
    message: string;
    providerResponse: string | null;
  } | null;
  creditLedgerRefs: {
    transactionId: string;
    type: string;
    credits: number;
    timestamp: string;
  }[];
  costRecords: {
    provider: string;
    unitMetric: string;
    amountInr: number | null;
    source: BillingSourceKind;
  }[];
}

export interface AdminPaymentRecord {
  paymentId: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  packageName: "Starter" | "Creator" | "Studio";
  amountPaise: number;
  currency: "INR";
  method: string | null;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  refundStatus: "none" | "partial" | "full" | "pending";
  createdAt: string;
  razorpayFeePaise: number | null;
  taxPaise: number | null;
}

export type AdminLedgerTxType =
  | "purchase"
  | "deduction"
  | "reservation"
  | "release"
  | "refund"
  | "admin_adjustment";

export interface AdminCreditLedgerRow {
  transactionId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  type: AdminLedgerTxType;
  addedCredits: number | null;
  deductedCredits: number | null;
  reservedCredits: number | null;
  releasedCredits: number | null;
  refundCredits: number | null;
  reference: string;
  createdAt: string;
}

export interface AdminAiCostsSnapshot {
  openai: {
    model: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    scriptExpenditureInr: number | null;
    storyboardExpenditureInr: number | null;
    costPerProjectInr: number | null;
    billingSource: BillingSourceKind;
  };
  falAi: {
    imageModel: string | null;
    imageRequests: number | null;
    completedImages: number | null;
    failedImages: number | null;
    regeneratedImages: number | null;
    resolutionSummary: string | null;
    costPerImageInr: number | null;
    avgImagesPerFinishedMinute: number | null;
    totalApiExpenditureInr: number | null;
    billingSource: BillingSourceKind;
  };
  elevenLabs: {
    voiceModel: string | null;
    voiceIdsUsed: number | null;
    billableCharacters: number | null;
    generatedAudioSeconds: number | null;
    costPerProjectInr: number | null;
    costPerFinishedMinuteInr: number | null;
    billingSource: BillingSourceKind;
  };
  ffmpeg: {
    workerRuntimeSeconds: number | null;
    avgRenderDurationSeconds: number | null;
    totalOutputDurationSeconds: number | null;
    failedJobs: number | null;
    avgCpuPct: number | null;
    avgMemoryMb: number | null;
    actualComputeExpenseInr: number | null;
    billingSource: BillingSourceKind;
  };
  r2Storage: {
    imageVolumeBytes: number | null;
    audioVolumeBytes: number | null;
    videoVolumeBytes: number | null;
    objectCount: number | null;
    storageCostInr: number | null;
    accessOperations: number | null;
    billingSource: BillingSourceKind;
  };
  profitability: {
    grossRevenueInr: number | null;
    revenueExTaxInr: number | null;
    paymentFeesInr: number | null;
    aiCostsInr: number | null;
    renderingCostsInr: number | null;
    storageCostsInr: number | null;
    variableCostInr: number | null;
    contributionInr: number | null;
    contributionMarginPct: number | null;
    billingSource: BillingSourceKind;
  };
}

export type MediaAssetType =
  | "character_reference"
  | "cartoon_image"
  | "narration_track"
  | "background_music"
  | "sound_effect"
  | "captions"
  | "finished_mp4";

export interface AdminMediaAsset {
  id: string;
  assetType: MediaAssetType;
  fileSizeBytes: number;
  ownerName: string;
  ownerId: string;
  projectTitle: string | null;
  projectId: string | null;
  createdAt: string;
  storageKey: string;
  accessPolicy: "private_signed_only" | "licensed_catalog_internal";
}

export interface AdminMusicTrack {
  id: string;
  name: string;
  kind: "music" | "sfx";
  mood: "happy" | "cinematic" | "playful" | "emotional" | "relaxing" | "educational" | "sfx";
  durationSeconds: number;
  audioUrl: string | null;
  usageRights: string;
  licenseReference: string;
  active: boolean;
  updatedAt: string;
}

export interface AdminConfigurationState {
  pricing: {
    starter: { priceInr: number; credits: number; minutes: number };
    creator: { priceInr: number; credits: number; minutes: number };
    studio: { priceInr: number; credits: number; minutes: number };
    configuredGstRatePct: number;
  };
  creditRules: {
    creditsPerMinute: number;
    creditsPer15Seconds: number;
    maxVideoMinutes: number;
  };
  generation: {
    aspectRatios: ("16:9" | "9:16" | "1:1")[];
    resolutions: ("720p" | "1080p")[];
    maxDurationSeconds: number;
    imageModels: string[];
    voiceModels: string[];
    supportedLanguages: string[];
    imageConcurrency: number;
    retryAllowance: number;
    workerConcurrency: number;
  };
  creativePresets: {
    cartoonStyles: string[];
    narrationTones: string[];
    visualPacing: string[];
    cameraMovement: string[];
    transitions: string[];
    captionOptions: string[];
    musicMoods: string[];
  };
}

export interface AdminAuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target: string;
  result: "success" | "denied" | "failed";
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function formatInrNullable(amountInr: number | null): string {
  if (amountInr === null || Number.isNaN(amountInr)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountInr);
}

export function formatNumberNullable(value: number | null, suffix = ""): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("en-IN")}${suffix}`;
}

export function formatPercentNullable(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatBytesNullable(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function computeDateRange(preset: AdminDatePreset, customFrom?: string, customTo?: string): AdminDateRange {
  const today = new Date("2026-11-15T00:00:00Z");
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === "custom" && customFrom && customTo) {
    return { preset, from: customFrom, to: customTo };
  }
  const end = iso(today);
  const start = new Date(today);
  if (preset === "7d") start.setUTCDate(start.getUTCDate() - 6);
  else if (preset === "30d") start.setUTCDate(start.getUTCDate() - 29);
  else if (preset === "90d") start.setUTCDate(start.getUTCDate() - 89);
  return { preset, from: iso(start), to: end };
}
