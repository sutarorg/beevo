-- ============================================================================
-- Beevo Phase 4 — Row Level Security, Immutability Triggers & Atomic Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Immutability Guards (credit_ledger & audit_logs are strictly append-only)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_immutable_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table % is strictly append-only; UPDATE and DELETE are prohibited', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_ledger_immutable ON public.credit_ledger;
CREATE TRIGGER trg_credit_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.credit_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_mutation();

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_mutation();

-- ----------------------------------------------------------------------------
-- 2. Canonical Credit Calculation & Admin Role Helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_required_credits(p_duration_seconds INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_duration_seconds IS NULL OR p_duration_seconds < 15 OR p_duration_seconds > 600 THEN
    RAISE EXCEPTION 'Duration must be between 15 and 600 seconds (got %)', p_duration_seconds;
  END IF;
  RETURN (CEIL(p_duration_seconds::NUMERIC / 15.0)::INTEGER) * 25;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. Automatic Signup Bootstrap (Profile + Role + Zero-Balance Wallet)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Atomic Credit Accounting RPCs (Server / Service-Role Only)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_purchase_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_payment_id TEXT,
  p_idempotency_key TEXT,
  p_description TEXT DEFAULT 'Credit pack purchase',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (allocated BOOLEAN, available_credits INTEGER, reserved_credits INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.credit_wallets%ROWTYPE;
BEGIN
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits to allocate must be positive';
  END IF;

  -- Idempotency check
  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id;
    RETURN QUERY SELECT FALSE, COALESCE(v_wallet.available_credits, 0), COALESCE(v_wallet.reserved_credits, 0);
    RETURN;
  END IF;

  INSERT INTO public.credit_wallets (user_id, available_credits, reserved_credits)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, credits, direction, reference_type, reference_id,
    idempotency_key, description, metadata
  ) VALUES (
    p_user_id, 'purchase', p_credits, 'credit', 'payment', p_payment_id,
    p_idempotency_key, p_description, p_metadata
  );

  UPDATE public.credit_wallets
  SET available_credits = v_wallet.available_credits + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  RETURN QUERY SELECT TRUE, v_wallet.available_credits, v_wallet.reserved_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_generation_credits(
  p_user_id UUID,
  p_generation_id UUID,
  p_duration_seconds INTEGER,
  p_idempotency_key TEXT
)
RETURNS TABLE (reserved_amount INTEGER, available_credits INTEGER, reserved_credits INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required INTEGER;
  v_wallet public.credit_wallets%ROWTYPE;
BEGIN
  v_required := public.calculate_required_credits(p_duration_seconds);

  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
    SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id;
    RETURN QUERY SELECT v_required, COALESCE(v_wallet.available_credits, 0), COALESCE(v_wallet.reserved_credits, 0);
    RETURN;
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_wallet.available_credits < v_required THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: required %, available %',
      v_required, COALESCE(v_wallet.available_credits, 0);
  END IF;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, credits, direction, reference_type, reference_id,
    idempotency_key, description, metadata
  ) VALUES (
    p_user_id, 'reservation', v_required, 'debit', 'generation', p_generation_id::TEXT,
    p_idempotency_key,
    format('Reserved %s credits for %ss video generation', v_required, p_duration_seconds),
    jsonb_build_object('duration_seconds', p_duration_seconds)
  );

  UPDATE public.credit_wallets
  SET available_credits = v_wallet.available_credits - v_required,
      reserved_credits = v_wallet.reserved_credits + v_required,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  RETURN QUERY SELECT v_required, v_wallet.available_credits, v_wallet.reserved_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_generation_credits(
  p_user_id UUID,
  p_generation_id UUID,
  p_credits INTEGER,
  p_idempotency_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.credit_wallets%ROWTYPE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_wallet.reserved_credits < p_credits THEN
    RAISE EXCEPTION 'INVALID_RESERVATION_STATE: cannot consume % credits (reserved %)',
      p_credits, COALESCE(v_wallet.reserved_credits, 0);
  END IF;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, credits, direction, reference_type, reference_id,
    idempotency_key, description
  ) VALUES (
    p_user_id, 'consumption', p_credits, 'debit', 'generation', p_generation_id::TEXT,
    p_idempotency_key, format('Consumed %s reserved credits on verified MP4 completion', p_credits)
  );

  UPDATE public.credit_wallets
  SET reserved_credits = v_wallet.reserved_credits - p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_generation_credits(
  p_user_id UUID,
  p_generation_id UUID,
  p_credits INTEGER,
  p_idempotency_key TEXT,
  p_reason TEXT DEFAULT 'Generation failed or cancelled'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.credit_wallets%ROWTYPE;
  v_release INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_release := LEAST(p_credits, v_wallet.reserved_credits);
  IF v_release <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, credits, direction, reference_type, reference_id,
    idempotency_key, description
  ) VALUES (
    p_user_id, 'release', v_release, 'credit', 'generation', p_generation_id::TEXT,
    p_idempotency_key, format('Released %s reserved credits: %s', v_release, p_reason)
  );

  UPDATE public.credit_wallets
  SET available_credits = v_wallet.available_credits + v_release,
      reserved_credits = v_wallet.reserved_credits - v_release,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_admin_user_id UUID,
  p_admin_email TEXT,
  p_target_user_id UUID,
  p_direction TEXT,
  p_credits INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT
)
RETURNS TABLE (available_credits INTEGER, reserved_credits INTEGER, ledger_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.credit_wallets%ROWTYPE;
  v_ledger_id UUID;
BEGIN
  IF NOT public.is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'FORBIDDEN: caller is not an authorized admin';
  END IF;
  IF p_direction NOT IN ('credit', 'debit') OR p_credits <= 0 THEN
    RAISE EXCEPTION 'Invalid credit adjustment parameters';
  END IF;
  IF LENGTH(TRIM(COALESCE(p_reason, ''))) < 6 THEN
    RAISE EXCEPTION 'Operational audit reason is mandatory';
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user wallet not found';
  END IF;
  IF p_direction = 'debit' AND v_wallet.available_credits < p_credits THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: cannot deduct % from available balance %',
      p_credits, v_wallet.available_credits;
  END IF;

  INSERT INTO public.credit_ledger (
    user_id, transaction_type, credits, direction, reference_type, reference_id,
    idempotency_key, description, metadata
  ) VALUES (
    p_target_user_id, 'admin_adjustment', p_credits, p_direction, 'admin_actor', p_admin_user_id::TEXT,
    p_idempotency_key, p_reason, jsonb_build_object('admin_email', p_admin_email)
  ) RETURNING id INTO v_ledger_id;

  UPDATE public.credit_wallets
  SET available_credits = CASE
        WHEN p_direction = 'credit' THEN v_wallet.available_credits + p_credits
        ELSE v_wallet.available_credits - p_credits
      END,
      updated_at = NOW()
  WHERE user_id = p_target_user_id
  RETURNING * INTO v_wallet;

  INSERT INTO public.audit_logs (
    actor_user_id, actor_email, actor_role, action, target_type, target_id, result, reason, metadata
  ) VALUES (
    p_admin_user_id, p_admin_email, 'admin', 'credit_adjustment', 'user', p_target_user_id::TEXT,
    'success', p_reason,
    jsonb_build_object('direction', p_direction, 'credits', p_credits, 'ledger_id', v_ledger_id)
  );

  RETURN QUERY SELECT v_wallet.available_credits, v_wallet.reserved_credits, v_ledger_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Atomic PostgreSQL Job Queue Functions (FOR UPDATE SKIP LOCKED)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_next_generation_job(
  p_worker_id TEXT,
  p_lease_seconds INTEGER DEFAULT 300
)
RETURNS SETOF public.generation_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.generation_jobs%ROWTYPE;
BEGIN
  -- First reclaim expired leases from crashed workers
  UPDATE public.generation_jobs
  SET status = CASE WHEN attempt_count >= max_attempts THEN 'dead_letter' ELSE 'queued' END,
      worker_id = NULL,
      lease_expires_at = NULL,
      last_error = COALESCE(last_error, 'Worker lease expired; reclaimed for retry'),
      updated_at = NOW()
  WHERE status = 'running' AND lease_expires_at < NOW();

  SELECT * INTO v_job
  FROM public.generation_jobs
  WHERE status = 'queued'
    AND next_run_at <= NOW()
    AND cancel_requested = FALSE
  ORDER BY priority ASC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.generation_jobs
  SET status = 'running',
      worker_id = p_worker_id,
      heartbeat_at = NOW(),
      lease_expires_at = NOW() + make_interval(secs => p_lease_seconds),
      attempt_count = attempt_count + 1,
      updated_at = NOW()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN NEXT v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_generation_job(
  p_job_id UUID,
  p_worker_id TEXT,
  p_lease_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.generation_jobs
  SET heartbeat_at = NOW(),
      lease_expires_at = NOW() + make_interval(secs => p_lease_seconds),
      updated_at = NOW()
  WHERE id = p_job_id AND worker_id = p_worker_id AND status = 'running';

  RETURN FOUND;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Row Level Security Policies (Strict Per-User Isolation + Trusted Admin)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configuration ENABLE ROW LEVEL SECURITY;

-- Public read-only catalog policies
CREATE POLICY "credit_packages_public_read" ON public.credit_packages
  FOR SELECT USING (active = TRUE OR public.is_admin());

CREATE POLICY "music_library_active_read" ON public.music_library
  FOR SELECT USING (active = TRUE OR public.is_admin());

-- Profiles: users read/update only their own non-status metadata
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Roles: read own role or admin only; zero self-promotion
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Credit wallets & ledger & payments: strictly READ-ONLY for owners; zero direct writes
CREATE POLICY "credit_wallets_select" ON public.credit_wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "credit_ledger_select" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Projects, settings, characters, storyboards, scenes
CREATE POLICY "projects_owner_all" ON public.projects
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_settings_owner_all" ON public.project_settings
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "characters_owner_all" ON public.characters
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "storyboards_owner_all" ON public.storyboards
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scenes_owner_all" ON public.scenes
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);

-- Private assets & pipeline tables: owners read their own rows; worker/server writes via service role
CREATE POLICY "assets_owner_select" ON public.assets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "scene_assets_owner_select" ON public.scene_assets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "voice_generations_owner_select" ON public.voice_generations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "timelines_owner_select" ON public.timelines
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "generations_owner_select" ON public.generations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "generation_events_owner_select" ON public.generation_events
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "render_jobs_owner_select" ON public.render_jobs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "generation_jobs_admin_select" ON public.generation_jobs
  FOR SELECT USING (public.is_admin());

-- Notifications: owners read & mark read
CREATE POLICY "notifications_owner_all" ON public.notifications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id);

-- Strictly admin-only operational tables
CREATE POLICY "webhook_events_admin_only" ON public.webhook_events
  FOR SELECT USING (public.is_admin());
CREATE POLICY "email_outbox_admin_only" ON public.email_outbox
  FOR SELECT USING (public.is_admin());
CREATE POLICY "provider_usage_admin_only" ON public.provider_usage
  FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "system_configuration_admin_read" ON public.system_configuration
  FOR SELECT USING (public.is_admin());

-- Restrict direct PUBLIC execution of service-only credit/job functions
REVOKE ALL ON FUNCTION public.allocate_purchase_credits(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_generation_credits(UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_generation_credits(UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_generation_credits(UUID, UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_adjust_credits(UUID, TEXT, UUID, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_generation_job(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_generation_job(UUID, TEXT, INTEGER) FROM PUBLIC;
