export type AspectRatioOption = "16:9" | "9:16" | "1:1";
export type ResolutionOption = "720p" | "1080p";
export type VisualPacingOption = "calm" | "balanced" | "dynamic";
export type CameraMovementOption = "automatic" | "slow_zoom" | "dynamic_zoom" | "pan" | "mixed";
export type TransitionOption = "automatic" | "crossfade" | "zoom" | "slide" | "cut";
export type NarrationToneOption =
  | "friendly_storyteller"
  | "educational_teacher"
  | "energetic_narrator"
  | "documentary_narrator"
  | "calm_narrator";
export type MusicMoodOption =
  | "happy"
  | "cinematic"
  | "playful"
  | "emotional"
  | "relaxing"
  | "educational";
export type SfxStyleOption = "automatic" | "cartoon" | "cinematic" | "subtle";
export type CaptionPositionOption = "bottom" | "middle" | "top";
export type CaptionSizeOption = "small" | "medium" | "large";
export type CaptionFontOption = "sora" | "manrope" | "serif";
export type CaptionBgOption = "none" | "pill" | "bar";
export type CaptionAnimOption = "none" | "fade" | "pop";

export type BackendConnectionState = "unconfigured" | "unauthenticated" | "connected";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  preferredLanguage: string;
  createdAt: string;
}

export interface CreditWallet {
  availableCredits: number;
  reservedCredits: number;
  lifetimePurchasedCredits: number;
  updatedAt: string;
}

export type TransactionType =
  | "purchase"
  | "deduction"
  | "reservation"
  | "refund"
  | "release"
  | "admin_adjustment";

export interface CreditTransaction {
  id: string;
  type: TransactionType;
  creditsDelta: number;
  balanceAfter: number | null;
  amountInr: number | null;
  referenceLabel: string;
  projectId: string | null;
  createdAt: string;
  status: "completed" | "pending" | "reversed";
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: "draft" | "storyboard_review" | "generating" | "completed" | "failed";
  aspectRatio: AspectRatioOption;
  durationSeconds: number;
  styleId: string;
  updatedAt: string;
  generationId: string | null;
  videoId: string | null;
}

export interface StyleBible {
  mainArtDirection: string;
  colorPalette: string[];
  characterDescriptions: string;
  environmentDescriptions: string;
  visualConsistencyInstructions: string;
}

export interface CharacterReferenceAsset {
  id: string;
  name: string;
  role: "main" | "supporting";
  description: string;
  imageUrl: string | null;
  status: "planned" | "pending" | "generated" | "uploaded";
}

export interface StoryboardScene {
  id: string;
  orderIndex: number;
  narrationText: string;
  visualDescription: string;
  imagePrompt: string;
  characterRefs: string[];
  composition: string;
  cameraInstruction: string;
  emotion: string;
  transition: TransitionOption;
  imageStatus: "planned" | "pending" | "generated" | "failed";
  imageUrl: string | null;
}

export interface StoryboardRecord {
  projectId: string;
  projectTitle: string;
  language: string;
  scriptText: string;
  styleId: string;
  styleBible: StyleBible | null;
  characterReferences: CharacterReferenceAsset[];
  scenes: StoryboardScene[];
  updatedAt: string | null;
  syncedToBackend: boolean;
}

export type GenerationStageKey =
  | "script_generation"
  | "storyboard"
  | "character_references"
  | "image_generation"
  | "narration_generation"
  | "audio_alignment"
  | "dynamic_timeline"
  | "ffmpeg_rendering"
  | "final_export"
  | "r2_upload";

export type StageState = "pending" | "in_progress" | "completed" | "failed";

export interface GenerationStageInfo {
  key: GenerationStageKey;
  label: string;
  engine: string;
  state: StageState;
  detail: string | null;
}

export interface GeneratedImageAsset {
  sceneIndex: number;
  sceneId: string;
  status: "pending" | "generating" | "completed" | "failed";
  imageUrl: string | null;
}

export interface TimelineSegment {
  sceneId: string;
  sceneNumber: number;
  startSeconds: number;
  endSeconds: number;
  captionSummary: string;
  transition: TransitionOption;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  projectTitle: string;
  status: "queued" | "running" | "completed" | "failed";
  currentStage: GenerationStageKey;
  requestedDurationSeconds: number;
  stages: GenerationStageInfo[];
  expectedImageCount: number | null;
  generatedImages: GeneratedImageAsset[];
  narration: {
    voiceName: string | null;
    language: string | null;
    status: "pending" | "generating" | "ready" | "failed";
    actualDurationSeconds: number | null;
    audioPreviewUrl: string | null;
    alignmentStatus: "pending" | "aligned" | "failed";
  };
  timeline: {
    segments: TimelineSegment[];
    captionsReady: boolean;
  };
  rendering: {
    stageLabel: string;
    processedFrames: number | null;
    totalFrames: number | null;
    renderState: "idle" | "rendering" | "completed" | "failed";
    uploadState: "pending" | "uploading" | "verified" | "failed";
  };
  credits: {
    startingBalance: number | null;
    reservedCredits: number;
    finalDelta: number | null;
    settlementType: "pending" | "deducted" | "refunded";
  };
  errorMessage: string | null;
  completedVideo: {
    videoId: string;
    mp4Url: string;
    finalDurationSeconds: number;
    r2Verified: boolean;
  } | null;
}

export interface VideoAsset {
  id: string;
  projectId: string;
  title: string;
  originalIdea: string;
  thumbnailUrl: string | null;
  mp4Url: string | null;
  durationSeconds: number;
  aspectRatio: AspectRatioOption;
  resolution: ResolutionOption;
  styleName: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

export interface NotificationItem {
  id: string;
  category: "generation" | "credits" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string | null;
}

export interface EmailNotificationPreferences {
  generationCompleted: boolean;
  generationFailedRefund: boolean;
  creditReceipts: boolean;
  productAnnouncements: boolean;
}

export interface VoiceCatalogEntry {
  id: string;
  name: string;
  languageCode: string;
  languageLabel: string;
  accent: string | null;
  previewUrl: string | null;
}

export interface MusicTrackEntry {
  id: string;
  title: string;
  mood: MusicMoodOption;
  durationSeconds: number;
  licenseSource: string;
  previewUrl: string | null;
}

export interface CreateVideoPayload {
  prompt: string;
  durationSeconds: number;
  estimatedCredits: number;
  aspectRatio: AspectRatioOption;
  resolution: ResolutionOption;
  styleId: string;
  characters: {
    automatic: boolean;
    consistencyEnabled: boolean;
    mainCharacter: string;
    supportingCharacters: string[];
    visualInstructions: string;
    referenceFileCount: number;
  };
  narration: {
    language: string;
    voiceId: string | null;
    tone: NarrationToneOption;
    speed: number;
  };
  visualPacing: VisualPacingOption;
  cameraMovement: CameraMovementOption;
  transition: TransitionOption;
  captions: {
    enabled: boolean;
    position: CaptionPositionOption;
    size: CaptionSizeOption;
    font: CaptionFontOption;
    wordHighlighting: boolean;
    background: CaptionBgOption;
    animation: CaptionAnimOption;
  };
  music: {
    enabled: boolean;
    trackId: string | null;
    mood: MusicMoodOption;
    volume: number;
    fade: boolean;
    autoDucking: boolean;
  };
  sfx: {
    enabled: boolean;
    style: SfxStyleOption;
  };
  advanced: {
    customImageInstructions: string;
    pronunciationNotes: string;
    voiceStability: number;
    voiceSimilarity: number;
    subtitleMaxWords: number;
    frameRate: 24 | 30;
    customSceneInstructions: string;
  };
}

/**
 * Confirmed Beevo credit formula:
 * credits = ceil(duration_seconds / 15) * 25
 * Maximum individual video length = 600 seconds (10 minutes = 1,000 credits)
 */
export function calculateEstimatedCredits(durationSeconds: number): number {
  const clamped = Math.max(15, Math.min(600, Math.round(durationSeconds)));
  return Math.ceil(clamped / 15) * 25;
}

export function formatDurationLabel(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}

export function getResolutionDimensions(
  ratio: AspectRatioOption,
  resolution: ResolutionOption
): string {
  if (ratio === "16:9") return resolution === "1080p" ? "1920 × 1080" : "1280 × 720";
  if (ratio === "9:16") return resolution === "1080p" ? "1080 × 1920" : "720 × 1280";
  return resolution === "1080p" ? "1080 × 1080" : "720 × 720";
}

export const GENERATION_STAGE_DEFINITIONS: {
  key: GenerationStageKey;
  label: string;
  engine: string;
}[] = [
  { key: "script_generation", label: "Script generation", engine: "OpenAI" },
  { key: "storyboard", label: "Storyboard", engine: "OpenAI" },
  { key: "character_references", label: "Character references", engine: "fal.ai" },
  { key: "image_generation", label: "Image generation", engine: "fal.ai" },
  { key: "narration_generation", label: "Narration generation", engine: "ElevenLabs" },
  { key: "audio_alignment", label: "Audio alignment", engine: "ElevenLabs" },
  { key: "dynamic_timeline", label: "Dynamic timeline", engine: "Beevo Engine" },
  { key: "ffmpeg_rendering", label: "FFmpeg rendering", engine: "FFmpeg" },
  { key: "final_export", label: "Final export", engine: "FFmpeg" },
  { key: "r2_upload", label: "R2 upload", engine: "Cloudflare R2" },
];

/**
 * Supported ElevenLabs Multilingual v2 language codes for UI configuration.
 * Individual voices are never hardcoded and always load from the live workspace catalog in Phase 4.
 */
export const SUPPORTED_ELEVENLABS_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ar", label: "Arabic (العربية)" },
  { code: "it", label: "Italian (Italiano)" },
  { code: "ko", label: "Korean (한국어)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
] as const;
