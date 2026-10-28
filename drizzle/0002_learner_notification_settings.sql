ALTER TABLE "public"."users" ADD COLUMN "notify_lesson_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."users" ADD COLUMN "notify_receipt_emails" boolean DEFAULT true NOT NULL;
