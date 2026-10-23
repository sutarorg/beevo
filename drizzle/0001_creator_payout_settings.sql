ALTER TABLE "users" ADD COLUMN "payout_account_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payout_ifsc" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payout_details_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_sale_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_weekly_summary" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_product_tips" boolean DEFAULT false NOT NULL;