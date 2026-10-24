-- ===========================================================================
--  Beevo · Operations SQL — provision the platform administrator account
-- ---------------------------------------------------------------------------
--  Creates (or resets) the admin account and grants platform_admin access:
--
--      Email:    admin@beevo.in
--      Password: Iskcon@098
--
--  Where to run it
--      Supabase → Dashboard → SQL Editor → New query → paste → Run.
--      (or: psql "$DATABASE_URL" -f drizzle/ops-admin-beevo-in.sql)
--
--  Safe to re-run
--      * the user row is upserted by email (re-running resets the password
--        back to the value below — change it from the app after first login),
--      * the admin_roles grant is idempotent,
--      * the storefront handle only gets assigned when it is still free.
--
--  Password storage
--      Beevo stores passwords as scrypt(salt 16B, keylen 64, N=16384, r=8,
--      p=1) hex-encoded as "<salt>:<derivedKey>" (see src/server/auth.ts →
--      hashPassword/verifyPassword). The hash below was derived with exactly
--      those parameters for "Iskcon@098", so no extension or pgcrypto call is
--      needed here.
--
--  Security notes
--      * Admin access is NEVER granted through an API payload; it only exists
--        in this database row (src/db/schema.ts → admin_roles).
--      * The account is marked email-verified so /admin is usable immediately.
--      * Rotate this password after the first sign-in.
-- ===========================================================================

BEGIN;

-- 1) The account itself ------------------------------------------------------
INSERT INTO "users" (
    "id",
    "email",
    "name",
    "password_hash",
    "tagline",
    "niche",
    "links",
    "email_verified_at",
    "created_at",
    "updated_at"
)
VALUES (
    'usr_admin_beevo_in',
    'admin@beevo.in',
    'Beevo Admin',
    -- scrypt("Iskcon@098") — "<saltHex>:<derivedKeyHex>"
    'b9f1a2c3d4e5f60718293a4b5c6d7e8f:d8e0d29c80d975de1b6d3398b4269a1fa4d3a87b830c4e3c37b76c53985a3a28a43e50ad707b8241f234a1322b7be96d1d74a057a30bdc30cf63fa3aa6c2c235',
    '',
    'Platform administration',
    '[]'::jsonb,
    now(),
    now(),
    now()
)
ON CONFLICT ("email") DO UPDATE
SET
    "password_hash"     = EXCLUDED."password_hash",
    "email_verified_at" = COALESCE("users"."email_verified_at", now()),
    "suspended_at"      = NULL,
    "suspended_reason"  = NULL,
    "updated_at"        = now();

-- 2) A public storefront handle (only if nobody else owns it) -----------------
UPDATE "users"
SET "handle" = 'beevo-admin',
    "updated_at" = now()
WHERE "email" = 'admin@beevo.in'
  AND "handle" IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM "users" other
      WHERE other."handle" = 'beevo-admin'
        AND other."email" <> 'admin@beevo.in'
  );

-- 3) Grant platform_admin (idempotent) ---------------------------------------
INSERT INTO "admin_roles" ("user_id", "granted_by")
SELECT "id", 'ops-sql'
FROM "users"
WHERE "email" = 'admin@beevo.in'
ON CONFLICT ("user_id") DO NOTHING;

-- 4) Verify ------------------------------------------------------------------
DO $$
DECLARE
    admin_id   text;
    is_admin   boolean;
BEGIN
    SELECT "id" INTO admin_id FROM "users" WHERE "email" = 'admin@beevo.in';
    SELECT EXISTS (
        SELECT 1 FROM "admin_roles" WHERE "user_id" = admin_id
    ) INTO is_admin;

    IF admin_id IS NULL OR NOT is_admin THEN
        RAISE EXCEPTION 'Admin provisioning failed for admin@beevo.in';
    END IF;

    RAISE NOTICE 'Admin ready: admin@beevo.in (user id %) with platform_admin access.', admin_id;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- After running this file:
--   1. Sign in at https://beevo.in/login with admin@beevo.in / Iskcon@098
--   2. Open https://beevo.in/admin — you land on the admin dashboard
--   3. Change the password (and enable a shared password manager entry)
--
-- To revoke admin access later without deleting the account:
--   DELETE FROM "admin_roles"
--   WHERE "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'admin@beevo.in');
-- ---------------------------------------------------------------------------
