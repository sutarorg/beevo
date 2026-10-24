CREATE TABLE "checkout_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"token_hash" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provisioned_via_checkout" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "checkout_verifications_email_idx" ON "checkout_verifications" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "checkout_verifications_token_idx" ON "checkout_verifications" USING btree ("token_hash");