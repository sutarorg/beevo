-- Beevo RLS hardening (applied once via psql; idempotent).
-- The API uses the privileged driver user (superuser: bypasses RLS), and
-- every request verifies authorization in server code. These policies make
-- direct access by least-privilege roles safe as well. The `app_user` role
-- exists so a restricted pool *could* be added without policy changes.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_user', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- audit_logs is append-only for app_user: revoke update/delete explicitly.
REVOKE UPDATE, DELETE ON public.audit_logs FROM app_user;
-- financial tables: ledger/payments/enrollments are server-written only.
REVOKE UPDATE, DELETE ON public.commission_ledger FROM app_user;
REVOKE UPDATE, DELETE ON public.payments FROM app_user;
REVOKE UPDATE, DELETE ON public.orders FROM app_user;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self ON users;
CREATE POLICY users_self ON users TO app_user
  USING (id = current_setting('app.user_id', true))
  WITH CHECK (id = current_setting('app.user_id', true));
DROP POLICY IF EXISTS users_public_creator ON users;
CREATE POLICY users_public_creator ON users FOR SELECT TO app_user
  USING (handle IS NOT NULL AND suspended_at IS NULL);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS courses_owner ON courses;
CREATE POLICY courses_owner ON courses TO app_user
  USING (creator_id = current_setting('app.user_id', true))
  WITH CHECK (creator_id = current_setting('app.user_id', true));
DROP POLICY IF EXISTS courses_public_published ON courses;
CREATE POLICY courses_public_published ON courses FOR SELECT TO app_user
  USING (status = 'published');

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sections_owner ON sections;
CREATE POLICY sections_owner ON sections TO app_user
  USING (course_id IN (SELECT id FROM courses WHERE creator_id = current_setting('app.user_id', true)))
  WITH CHECK (course_id IN (SELECT id FROM courses WHERE creator_id = current_setting('app.user_id', true)));
DROP POLICY IF EXISTS sections_public ON sections;
CREATE POLICY sections_public ON sections FOR SELECT TO app_user
  USING (course_id IN (SELECT id FROM courses WHERE status = 'published'));

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lessons_owner ON lessons;
CREATE POLICY lessons_owner ON lessons TO app_user
  USING (section_id IN (SELECT s.id FROM sections s JOIN courses c ON c.id = s.course_id WHERE c.creator_id = current_setting('app.user_id', true)))
  WITH CHECK (section_id IN (SELECT s.id FROM sections s JOIN courses c ON c.id = s.course_id WHERE c.creator_id = current_setting('app.user_id', true)));
DROP POLICY IF EXISTS lessons_public ON lessons;
CREATE POLICY lessons_public ON lessons FOR SELECT TO app_user
  USING (section_id IN (SELECT s.id FROM sections s JOIN courses c ON c.id = s.course_id WHERE c.status = 'published'));

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_uploader ON media_assets;
CREATE POLICY media_uploader ON media_assets TO app_user
  USING (uploader_id = current_setting('app.user_id', true))
  WITH CHECK (uploader_id = current_setting('app.user_id', true));

ALTER TABLE lesson_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_media FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_media_owner ON lesson_media;
CREATE POLICY lesson_media_owner ON lesson_media TO app_user
  USING (lesson_id IN (SELECT l.id FROM lessons l JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.creator_id = current_setting('app.user_id', true)))
  WITH CHECK (lesson_id IN (SELECT l.id FROM lessons l JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.creator_id = current_setting('app.user_id', true)));

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrollments_self ON enrollments;
CREATE POLICY enrollments_self ON enrollments FOR SELECT TO app_user
  USING (user_id = current_setting('app.user_id', true)
     OR course_id IN (SELECT id FROM courses WHERE creator_id = current_setting('app.user_id', true)));

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS progress_self ON lesson_progress;
CREATE POLICY progress_self ON lesson_progress TO app_user
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

ALTER TABLE last_accessed ENABLE ROW LEVEL SECURITY;
ALTER TABLE last_accessed FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS last_accessed_self ON last_accessed;
CREATE POLICY last_accessed_self ON last_accessed TO app_user
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_self ON orders;
CREATE POLICY orders_self ON orders FOR SELECT TO app_user
  USING (user_id = current_setting('app.user_id', true)
     OR course_id IN (SELECT id FROM courses WHERE creator_id = current_setting('app.user_id', true)));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_none ON payments;
CREATE POLICY payments_none ON payments TO app_user USING (false);

ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ledger FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_creator_read ON commission_ledger;
CREATE POLICY ledger_creator_read ON commission_ledger FOR SELECT TO app_user
  USING (creator_id = current_setting('app.user_id', true));

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payouts_creator_read ON payouts;
CREATE POLICY payouts_creator_read ON payouts FOR SELECT TO app_user
  USING (creator_id = current_setting('app.user_id', true));

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_self ON notifications;
CREATE POLICY notifications_self ON notifications TO app_user
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_none ON audit_logs;
CREATE POLICY audit_none ON audit_logs FOR SELECT TO app_user USING (false);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_roles_none ON admin_roles;
CREATE POLICY admin_roles_none ON admin_roles TO app_user USING (false);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes FORCE ROW LEVEL SECURITY;
ALTER TABLE dispute_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_self ON support_tickets;
CREATE POLICY support_self ON support_tickets TO app_user
  USING (user_id = current_setting('app.user_id', true) OR user_id IS NULL)
  WITH CHECK (user_id = current_setting('app.user_id', true));
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE payout_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payout_events_creator_read ON payout_events;
CREATE POLICY payout_events_creator_read ON payout_events FOR SELECT TO app_user
  USING (payout_id IN (SELECT id FROM payouts WHERE creator_id = current_setting('app.user_id', true)));
