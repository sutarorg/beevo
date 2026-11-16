import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID identifier.");

export const aspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export const resolutionSchema = z.enum(["720p", "1080p"]);
export const visualPacingSchema = z.enum(["calm", "balanced", "dynamic"]);

// Auth
export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

// Profile
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateNotificationPrefsSchema = z.object({
  email_video_completed: z.boolean().optional(),
  email_video_failed: z.boolean().optional(),
  email_purchase_receipt: z.boolean().optional(),
  in_app_generation_updates: z.boolean().optional(),
});

// Projects & Settings
export const captionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  mode: z.enum(["word_highlight", "sentence", "off"]).default("word_highlight"),
  position: z.enum(["bottom", "middle", "top"]).default("bottom"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  font: z.string().trim().min(1).max(80).default("Noto Sans"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).default("#FFFFFF"),
  highlightColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).default("#FFC928"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6,8}$/).default("#171717CC"),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, "Project title is required.").max(160),
  originalIdea: z.string().trim().max(25_000).default(""),
  script: z.string().trim().max(30_000).optional(),
  durationSeconds: z.number().int().min(15).max(600),
  aspectRatio: aspectRatioSchema.default("16:9"),
  resolution: resolutionSchema.default("1080p"),
  visualStyle: z.string().trim().min(2).max(100).default("2D Storybook Cartoon"),
  language: z.string().trim().min(2).max(16).default("en"),
  visualPacing: visualPacingSchema.default("balanced"),
  characterConsistency: z.boolean().default(true),
  characterInstructions: z.string().trim().max(4000).default(""),
  voiceId: z.string().trim().max(120).nullable().optional(),
  voiceTone: z.string().trim().max(80).default("friendly_storyteller"),
  speechSpeed: z.number().min(0.7).max(1.3).default(1.0),
  voiceParameters: z
    .object({
      stability: z.number().min(0).max(1).default(0.5),
      similarity_boost: z.number().min(0).max(1).default(0.75),
      style: z.number().min(0).max(1).default(0.25),
      use_speaker_boost: z.boolean().default(true),
    })
    .optional(),
  backgroundMusicId: z.string().uuid().nullable().optional(),
  musicVolume: z.number().min(0).max(1).default(0.2),
  soundEffects: z
    .object({
      enabled: z.boolean().default(false),
      volume: z.number().min(0).max(1).default(0.35),
    })
    .optional(),
  cameraMovements: z.string().trim().max(60).default("automatic"),
  transitionStyle: z.string().trim().max(60).default("automatic"),
  captions: captionConfigSchema.optional(),
  advancedPromptInstructions: z.string().trim().max(4000).default(""),
});

export const updateProjectSchema = createProjectSchema.partial();

// Story Engine
export const generateScriptSchema = z.object({
  idea: z.string().trim().min(5, "Describe your video idea or paste a draft.").max(25_000),
  durationSeconds: z.number().int().min(15).max(600).optional(),
  language: z.string().trim().min(2).max(16).optional(),
  audience: z.string().trim().max(120).optional(),
  narrationTone: z.string().trim().max(80).optional(),
  customInstructions: z.string().trim().max(4000).optional(),
});

export const generateStoryboardSchema = z.object({
  script: z.string().trim().min(20, "A narration script is required to build a storyboard.").max(30_000).optional(),
  audience: z.string().trim().max(120).optional(),
  visualPacing: visualPacingSchema.optional(),
  characterPreferences: z.string().trim().max(4000).optional(),
  customInstructions: z.string().trim().max(4000).optional(),
});

export const patchStoryboardSchema = z.object({
  approve: z.boolean().optional(),
  script: z.string().trim().min(10).max(30_000).optional(),
  scenes: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        sceneNumber: z.number().int().min(1),
        narrationText: z.string().trim().min(1).max(3000),
        visualDescription: z.string().trim().min(1).max(3000),
        detailedImagePrompt: z.string().trim().min(1).max(4000),
        cameraAngle: z.string().trim().max(120).optional(),
        transition: z.string().trim().max(60).optional(),
        emotion: z.string().trim().max(120).optional(),
      })
    )
    .optional(),
});

export const patchSceneSchema = z.object({
  narrationText: z.string().trim().min(1).max(3000).optional(),
  visualDescription: z.string().trim().min(1).max(3000).optional(),
  detailedImagePrompt: z.string().trim().min(1).max(4000).optional(),
  cameraAngle: z.string().trim().max(120).optional(),
  transition: z.string().trim().max(60).optional(),
  emotion: z.string().trim().max(120).optional(),
});

export const startGenerationSchema = z.object({
  storyboardId: z.string().uuid().optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

// Razorpay Payments
export const createRazorpayOrderSchema = z.object({
  packageId: z.enum(["starter", "creator", "studio"]),
});

export const verifyRazorpayPaymentSchema = z.object({
  paymentRecordId: z.string().uuid(),
  razorpay_payment_id: z.string().trim().min(5).max(120),
  razorpay_signature: z.string().trim().min(16).max(256),
});

// Videos
export const updateVideoSchema = z.object({
  title: z.string().trim().min(2).max(160),
});

// Admin
export const adminCreditAdjustSchema = z.object({
  targetUserId: z.string().uuid(),
  direction: z.enum(["credit", "debit"]),
  credits: z.number().int().min(1).max(100_000),
  reason: z.string().trim().min(6, "Audit reason must be at least 6 characters.").max(500),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().trim().min(6).max(500),
});

export const adminRefundSchema = z.object({
  reason: z.string().trim().min(6).max(500),
  amountPaise: z.number().int().min(100).optional(),
});

export const adminConfigurationPatchSchema = z.object({
  reason: z.string().trim().min(6).max(500),
  pricing: z
    .object({
      starter: z.object({ priceInr: z.number().int().min(1), credits: z.number().int().min(25) }).optional(),
      creator: z.object({ priceInr: z.number().int().min(1), credits: z.number().int().min(25) }).optional(),
      studio: z.object({ priceInr: z.number().int().min(1), credits: z.number().int().min(25) }).optional(),
      configuredGstRatePct: z.number().min(0).max(50).optional(),
    })
    .optional(),
  creditRules: z
    .object({
      creditsPerMinute: z.number().int().min(10).max(1000),
      creditsPer15Seconds: z.number().int().min(5).max(250),
      maxVideoMinutes: z.number().int().min(1).max(30),
    })
    .optional(),
  generation: z
    .object({
      imageConcurrency: z.number().int().min(1).max(16).optional(),
      retryAllowance: z.number().int().min(0).max(5).optional(),
      workerConcurrency: z.number().int().min(1).max(16).optional(),
      maxScenesPerProject: z.number().int().min(10).max(300).optional(),
      maxAssetsPerProject: z.number().int().min(20).max(500).optional(),
    })
    .optional(),
});

export const adminMusicTrackSchema = z.object({
  name: z.string().trim().min(2).max(160),
  kind: z.enum(["music", "sfx"]),
  mood: z.enum(["happy", "cinematic", "playful", "emotional", "relaxing", "educational", "sfx"]),
  durationSeconds: z.number().int().min(1).max(1800),
  storageKey: z.string().trim().min(5).max(400),
  mimeType: z.enum(["audio/mpeg", "audio/wav", "audio/mp4"]).default("audio/mpeg"),
  usageRights: z.string().trim().min(4).max(300),
  licenseReference: z.string().trim().min(4).max(200),
  active: z.boolean().default(true),
});
