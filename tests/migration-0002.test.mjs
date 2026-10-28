import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../drizzle/0002_learner_notification_settings.sql', import.meta.url), 'utf8');

test('migration 0002 targets public.users even when auth comes first', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE migration_user NOLOGIN;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id text PRIMARY KEY);
      CREATE TABLE public.users (id text PRIMARY KEY);
      ALTER TABLE public.users OWNER TO migration_user;
      GRANT USAGE ON SCHEMA auth TO migration_user;
      SET search_path TO auth, public;
      SET ROLE migration_user;
    `);
    await db.exec(migration);
    await db.exec('RESET ROLE');
    const result = await db.query(`SELECT table_schema, column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name LIKE 'notify_%'
      ORDER BY table_schema, column_name`);
    assert.deepEqual(result.rows, [
      { table_schema: 'public', column_name: 'notify_lesson_emails', is_nullable: 'NO', column_default: 'true' },
      { table_schema: 'public', column_name: 'notify_receipt_emails', is_nullable: 'NO', column_default: 'true' },
    ]);
  } finally {
    await db.close();
  }
});
