/* Auto-generated from drizzle-kit generate — embedded DDL for boot-time
   self-healing schema initialisation. Regenerate: npx drizzle-kit generate */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_id" uuid,
	"name" text NOT NULL,
	"prefix" varchar(24) NOT NULL,
	"last_four" varchar(8) NOT NULL,
	"token_hash" text NOT NULL,
	"scopes" text DEFAULT 'posts:read posts:write analytics:read' NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_token_hash_unique" UNIQUE("token_hash")
);
-->
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"number" text NOT NULL,
	"description" text NOT NULL,
	"amount_inr" integer NOT NULL,
	"gst_inr" integer DEFAULT 0 NOT NULL,
	"base_paise" integer DEFAULT 0 NOT NULL,
	"gst_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer DEFAULT 0 NOT NULL,
	"status" varchar(10) DEFAULT 'paid' NOT NULL,
	"razorpay_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"uploaded_by_id" uuid,
	"url" text NOT NULL,
	"storage_key" text,
	"name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "metrics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"platform" varchar(20) NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"engagement" integer DEFAULT 0 NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" varchar(20) DEFAULT 'tip' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"plan" varchar(10) DEFAULT 'pro' NOT NULL,
	"cycle" varchar(10) DEFAULT 'monthly' NOT NULL,
	"amount_inr" integer NOT NULL,
	"base_paise" integer DEFAULT 0 NOT NULL,
	"gst_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(6) DEFAULT 'INR' NOT NULL,
	"method" varchar(20),
	"method_detail" text,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "post_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"social_account_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"platform_post_id" text,
	"url" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_by_id" uuid,
	"caption" text DEFAULT '' NOT NULL,
	"platforms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{"likes":0,"comments":0,"shares":0,"impressions":0}'::jsonb NOT NULL,
	"ai_assisted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"current_workspace_id" uuid,
	"user_agent" text,
	"ip" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
-->
CREATE TABLE IF NOT EXISTS "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"platform_account_id" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"avatar_url" text,
	"avatar_hue" integer DEFAULT 40 NOT NULL,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"token_expires_at" timestamp with time zone,
	"scopes" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'connected' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"prefs" jsonb DEFAULT '{"timezone":"Asia/Kolkata (GMT+5:30)","digest":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
-->
CREATE TABLE IF NOT EXISTS "workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" varchar(20) DEFAULT 'editor' NOT NULL,
	"token_hash" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_hash_unique" UNIQUE("token_hash")
);
-->
CREATE TABLE IF NOT EXISTS "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" varchar(10) DEFAULT 'free' NOT NULL,
	"plan_renews_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
-->
DO $$ BEGIN ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "posts" ADD CONSTRAINT "posts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
DO $$ BEGIN ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-->
CREATE INDEX IF NOT EXISTS "api_keys_ws_idx" ON "api_keys" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "invoices_ws_idx" ON "invoices" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "media_ws_idx" ON "media_assets" USING btree ("workspace_id");
-->
CREATE UNIQUE INDEX IF NOT EXISTS "snapshot_unique" ON "metrics_snapshots" USING btree ("workspace_id","date","platform");
-->
CREATE INDEX IF NOT EXISTS "notif_ws_idx" ON "notifications" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "payments_ws_idx" ON "payments" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "targets_post_idx" ON "post_targets" USING btree ("post_id");
-->
CREATE INDEX IF NOT EXISTS "targets_status_idx" ON "post_targets" USING btree ("status");
-->
CREATE INDEX IF NOT EXISTS "posts_ws_idx" ON "posts" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" USING btree ("status");
-->
CREATE INDEX IF NOT EXISTS "posts_due_idx" ON "posts" USING btree ("status","scheduled_at");
-->
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" USING btree ("user_id");
-->
CREATE UNIQUE INDEX IF NOT EXISTS "account_unique" ON "social_accounts" USING btree ("workspace_id","platform","platform_account_id");
-->
CREATE INDEX IF NOT EXISTS "account_ws_idx" ON "social_accounts" USING btree ("workspace_id");
-->
CREATE INDEX IF NOT EXISTS "invites_ws_idx" ON "workspace_invites" USING btree ("workspace_id");
-->
CREATE UNIQUE INDEX IF NOT EXISTS "members_unique" ON "workspace_members" USING btree ("workspace_id","user_id");
`;
