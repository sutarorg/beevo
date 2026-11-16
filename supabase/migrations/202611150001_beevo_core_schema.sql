-- ============================================================================
-- Beevo Phase 4 — Core PostgreSQL Schema Migration
-- Strictly enforces relational integrity, integer paise currency, immutable
-- double-entry credit ledger, dynamic scene counts, and database-backed jobs.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles & Trusted Server Roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  notification_preferences JSONB NOT NULL DEFAULT '{
    "email_video_completed": true,
    "email_video_failed": true,
    "email_purchase_receipt": true,
    "in_app_generation_updates": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Credit Wallets, Immutable Ledger, Packages & Razorpay Payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_credits INTEGER NOT NULL DEFAULT 0 CHECK (available_credits >= 0),
  reserved_credits INTEGER NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'purchase',
      'reservation',
      'consumption',
      'release',
      'refund',
      'admin_adjustment'
    )
  ),
  credits INTEGER NOT NULL CHECK (credits > 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created
  ON public.credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_type_created
  ON public.credit_ledger (transaction_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price_paise INTEGER NOT NULL CHECK (price_paise > 0),
  credits INTEGER NOT NULL CHECK (credits > 0),
  video_minutes INTEGER NOT NULL CHECK (video_minutes > 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.credit_packages (id, name, price_paise, credits, video_minutes, currency, active, sort_order)
VALUES
  ('starter', 'Starter', 29900, 300, 3, 'INR', TRUE, 1),
  ('creator', 'Creator', 59900, 800, 8, 'INR', TRUE, 2),
  ('studio', 'Studio', 89900, 1500, 15, 'INR', TRUE, 3)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES public.credit_packages(id),
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  method TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'authorized', 'captured', 'failed', 'refunded')
  ),
  refund_status TEXT NOT NULL DEFAULT 'none' CHECK (
    refund_status IN ('none', 'pending', 'partial', 'full')
  ),
  refunded_paise INTEGER NOT NULL DEFAULT 0 CHECK (refunded_paise >= 0),
  razorpay_fee_paise INTEGER,
  razorpay_tax_paise INTEGER,
  credits_granted INTEGER NOT NULL DEFAULT 0 CHECK (credits_granted >= 0),
  verified_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments (status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Projects, Settings, Characters, Storyboards & Dynamic Scenes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_idea TEXT NOT NULL DEFAULT '',
  script TEXT,
  requested_duration_seconds INTEGER NOT NULL CHECK (
    requested_duration_seconds >= 15 AND requested_duration_seconds <= 600
  ),
  aspect_ratio TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  resolution TEXT NOT NULL DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p')),
  visual_style TEXT NOT NULL DEFAULT '2D Storybook Cartoon',
  language TEXT NOT NULL DEFAULT 'en',
  project_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    project_status IN (
      'draft',
      'script_ready',
      'storyboard_ready',
      'storyboard_approved',
      'generating',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.music_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('music', 'sfx')),
  mood TEXT NOT NULL CHECK (
    mood IN ('happy', 'cinematic', 'playful', 'emotional', 'relaxing', 'educational', 'sfx')
  ),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL DEFAULT 'audio/mpeg',
  usage_rights TEXT NOT NULL,
  license_reference TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_settings (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visual_style TEXT NOT NULL DEFAULT '2D Storybook Cartoon',
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 15 AND duration_seconds <= 600),
  aspect_ratio TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  export_resolution TEXT NOT NULL DEFAULT '1080p' CHECK (export_resolution IN ('720p', '1080p')),
  visual_pacing TEXT NOT NULL DEFAULT 'balanced' CHECK (visual_pacing IN ('calm', 'balanced', 'dynamic')),
  character_consistency BOOLEAN NOT NULL DEFAULT TRUE,
  character_instructions TEXT NOT NULL DEFAULT '',
  reference_image_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT NOT NULL DEFAULT 'en',
  voice_id TEXT,
  voice_tone TEXT NOT NULL DEFAULT 'friendly_storyteller',
  speech_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (speech_speed >= 0.70 AND speech_speed <= 1.30),
  voice_parameters JSONB NOT NULL DEFAULT '{"stability": 0.5, "similarity_boost": 0.75, "style": 0.25, "use_speaker_boost": true}'::jsonb,
  background_music_id UUID REFERENCES public.music_library(id) ON DELETE SET NULL,
  music_volume NUMERIC(3,2) NOT NULL DEFAULT 0.20 CHECK (music_volume >= 0.00 AND music_volume <= 1.00),
  sound_effects JSONB NOT NULL DEFAULT '{"enabled": false, "volume": 0.35}'::jsonb,
  camera_movements TEXT NOT NULL DEFAULT 'automatic',
  transition_style TEXT NOT NULL DEFAULT 'automatic',
  captions JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "mode": "word_highlight",
    "position": "bottom",
    "size": "medium",
    "font": "Noto Sans",
    "color": "#FFFFFF",
    "highlightColor": "#FFC928",
    "backgroundColor": "#171717CC"
  }'::jsonb,
  advanced_prompt_instructions TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN (
      'character_reference',
      'cartoon_image',
      'narration_track',
      'background_music',
      'sound_effect',
      'captions',
      'finished_mp4'
    )
  ),
  storage_key TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  sha256 TEXT,
  access_policy TEXT NOT NULL DEFAULT 'private_signed_only' CHECK (
    access_policy IN ('private_signed_only', 'licensed_catalog_internal')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_user_type ON public.assets (user_id, asset_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_project ON public.assets (project_id);

CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  character_code TEXT NOT NULL,
  character_name TEXT NOT NULL,
  character_description TEXT NOT NULL,
  visual_identity TEXT NOT NULL,
  appearance_instructions TEXT NOT NULL DEFAULT '',
  reference_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, character_code)
);

CREATE TABLE IF NOT EXISTS public.storyboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  script TEXT NOT NULL,
  visual_style_bible JSONB NOT NULL DEFAULT '{}'::jsonb,
  storyboard_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_state TEXT NOT NULL DEFAULT 'draft' CHECK (
    approval_state IN ('draft', 'approved', 'superseded')
  ),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version)
);

-- Supports any dynamically determined number of scenes per storyboard
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storyboard_id UUID NOT NULL REFERENCES public.storyboards(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL CHECK (scene_number >= 1),
  narration_text TEXT NOT NULL,
  narrative_purpose TEXT NOT NULL DEFAULT '',
  visual_description TEXT NOT NULL,
  detailed_image_prompt TEXT NOT NULL,
  character_reference_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment TEXT NOT NULL DEFAULT '',
  composition TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  emotion TEXT NOT NULL DEFAULT '',
  camera_angle TEXT NOT NULL DEFAULT 'medium shot',
  transition TEXT NOT NULL DEFAULT 'crossfade',
  caption_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  scene_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    scene_status IN ('pending', 'queued', 'generating', 'completed', 'failed')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (storyboard_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_storyboard_order ON public.scenes (storyboard_id, scene_number ASC);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON public.scenes (project_id);

CREATE TABLE IF NOT EXISTS public.scene_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  fal_request_id TEXT,
  model_id TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    validation_status IN ('pending', 'validated', 'rejected')
  ),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  cost_inr NUMERIC(12,4),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scene_assets_scene ON public.scene_assets (scene_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scene_assets_fal_req ON public.scene_assets (fal_request_id);

-- ----------------------------------------------------------------------------
-- 4. Timelines, Generations, Voice, Rendering & Background Job Queue
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storyboard_id UUID REFERENCES public.storyboards(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  timeline_json JSONB NOT NULL,
  scene_timings JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_references JSONB NOT NULL DEFAULT '{}'::jsonb,
  caption_timing JSONB NOT NULL DEFAULT '[]'::jsonb,
  transition_timing JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_duration_seconds NUMERIC(10,3) NOT NULL CHECK (total_duration_seconds > 0),
  rendering_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version)
);

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storyboard_id UUID REFERENCES public.storyboards(id) ON DELETE SET NULL,
  timeline_id UUID REFERENCES public.timelines(id) ON DELETE SET NULL,
  current_stage TEXT NOT NULL DEFAULT 'script_creation' CHECK (
    current_stage IN (
      'script_creation',
      'storyboard_creation',
      'character_generation',
      'image_generation',
      'voice_generation',
      'audio_synchronization',
      'dynamic_timeline',
      'ffmpeg_rendering',
      'final_mp4_upload'
    )
  ),
  generation_status TEXT NOT NULL DEFAULT 'queued' CHECK (
    generation_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')
  ),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  dynamic_image_count INTEGER,
  completed_image_count INTEGER NOT NULL DEFAULT 0,
  failed_image_count INTEGER NOT NULL DEFAULT 0,
  voice_status TEXT NOT NULL DEFAULT 'pending' CHECK (voice_status IN ('pending', 'running', 'completed', 'failed')),
  alignment_status TEXT NOT NULL DEFAULT 'pending' CHECK (alignment_status IN ('pending', 'running', 'completed', 'failed')),
  rendering_status TEXT NOT NULL DEFAULT 'pending' CHECK (rendering_status IN ('pending', 'running', 'completed', 'failed')),
  export_status TEXT NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'running', 'completed', 'failed')),
  output_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  reserved_credits INTEGER NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
  consumed_credits INTEGER,
  estimated_cost_inr NUMERIC(12,4),
  actual_cost_inr NUMERIC(12,4),
  cost_source TEXT NOT NULL DEFAULT 'unavailable' CHECK (cost_source IN ('actual', 'estimated', 'unavailable')),
  cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
  error_code TEXT,
  error_details JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created ON public.generations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_status_created ON public.generations (generation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_project ON public.generations (project_id);

CREATE TABLE IF NOT EXISTS public.voice_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  script_chunk TEXT NOT NULL,
  audio_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  character_alignment JSONB,
  normalized_alignment JSONB,
  actual_audio_duration_seconds NUMERIC(10,3),
  billable_characters INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  actual_cost_inr NUMERIC(12,4),
  cost_source TEXT NOT NULL DEFAULT 'estimated' CHECK (cost_source IN ('actual', 'estimated', 'unavailable')),
  provider_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_generations_gen ON public.voice_generations (generation_id, chunk_index);

CREATE TABLE IF NOT EXISTS public.generation_events (
  id BIGSERIAL PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  progress_percent INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_events_gen ON public.generation_events (generation_id, id ASC);

CREATE TABLE IF NOT EXISTS public.render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL,
  render_status TEXT NOT NULL DEFAULT 'queued' CHECK (
    render_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')
  ),
  output_storage_key TEXT,
  processed_frames INTEGER NOT NULL DEFAULT 0,
  total_frames INTEGER,
  render_duration_seconds NUMERIC(10,3),
  output_duration_seconds NUMERIC(10,3),
  cpu_pct NUMERIC(5,2),
  memory_mb INTEGER,
  compute_cost_inr NUMERIC(12,4),
  error_metadata JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_gen ON public.render_jobs (generation_id, created_at DESC);

-- Database-backed background job queue (replaces external queue SaaS)
CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL UNIQUE REFERENCES public.generations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'dead_letter', 'cancelled')
  ),
  priority INTEGER NOT NULL DEFAULT 100,
  worker_id TEXT,
  heartbeat_at TIMESTAMPTZ,
  lease_expires_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_claim
  ON public.generation_jobs (status, next_run_at ASC, priority ASC, created_at ASC)
  WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_generation_jobs_lease
  ON public.generation_jobs (lease_expires_at)
  WHERE status = 'running';

-- ----------------------------------------------------------------------------
-- 5. Webhooks, Transactional Email Outbox, Provider Usage, Audit, Notifications & Config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('razorpay', 'fal', 'elevenlabs', 'resend')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resend_message_id TEXT,
  last_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_pending
  ON public.email_outbox (status, next_retry_at ASC)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'fal_ai', 'elevenlabs', 'ffmpeg', 'cloudflare_r2', 'razorpay')),
  operation TEXT NOT NULL,
  model_id TEXT,
  input_units NUMERIC(18,4) NOT NULL DEFAULT 0,
  output_units NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL,
  cost_usd NUMERIC(14,6),
  cost_inr NUMERIC(14,4),
  cost_source TEXT NOT NULL DEFAULT 'estimated' CHECK (cost_source IN ('actual', 'estimated', 'unavailable')),
  provider_request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_usage_provider_created
  ON public.provider_usage (provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_usage_generation
  ON public.provider_usage (generation_id);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'denied', 'failed')),
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_email, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('generation', 'billing', 'account', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_configuration (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_configuration (key, value)
VALUES
  ('pricing', '{"configuredGstRatePct": 18}'::jsonb),
  ('credit_rules', '{"creditsPerMinute": 100, "creditsPer15Seconds": 25, "maxVideoMinutes": 10}'::jsonb),
  ('generation', '{
    "aspectRatios": ["16:9", "9:16", "1:1"],
    "resolutions": ["720p", "1080p"],
    "maxDurationSeconds": 600,
    "imageModels": ["blackforestlabs/flux-3/klein/text-to-image", "blackforestlabs/flux-3/klein/edit-image"],
    "voiceModels": ["eleven_multilingual_v2", "eleven_flash_v2_5", "eleven_v4"],
    "imageConcurrency": 4,
    "retryAllowance": 2,
    "workerConcurrency": 2,
    "maxScenesPerProject": 160,
    "maxAssetsPerProject": 200
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
