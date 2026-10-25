ALTER TABLE "users" ADD COLUMN "creator_terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "learner_enabled_at" timestamp with time zone;--> statement-breakpoint
-- Backfill account kinds for existing users. Creator = owns a course,
-- registered through the website signup (audit trail), or holds a storefront
-- handle without ever enrolling as a learner. Learner = has an enrolment or
-- was provisioned at checkout. New accounts set these explicitly.
UPDATE "users" SET "creator_terms_accepted_at" = "created_at" WHERE "creator_terms_accepted_at" IS NULL AND (
  EXISTS (SELECT 1 FROM "courses" WHERE "courses"."creator_id" = "users"."id")
  OR EXISTS (SELECT 1 FROM "audit_logs" WHERE "audit_logs"."actor_id" = "users"."id" AND "audit_logs"."action" = 'user_registered')
  OR ("handle" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "enrollments" WHERE "enrollments"."user_id" = "users"."id"))
);--> statement-breakpoint
UPDATE "users" SET "learner_enabled_at" = "created_at" WHERE "learner_enabled_at" IS NULL AND (
  EXISTS (SELECT 1 FROM "enrollments" WHERE "enrollments"."user_id" = "users"."id")
  OR "provisioned_via_checkout" = true
);
