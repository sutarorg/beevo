import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import {
  adminCreditAdjustSchema,
  createProjectSchema,
  signupSchema,
} from "@/lib/validation/schemas";

describe("Domain 8: Security, Rate Limiting, Input Validation & SQL Schema Hardening", () => {
  it("enforces sliding-window rate limits with 429 ApiError", () => {
    const policy = { keyPrefix: `test-rl-${Date.now()}`, limit: 2, windowMs: 10_000 };
    expect(() => enforceRateLimit("client-1", policy)).not.toThrow();
    expect(() => enforceRateLimit("client-1", policy)).not.toThrow();
    expect(() => enforceRateLimit("client-1", policy)).toThrow(/Too many requests/i);
  });

  it("validates strict Zod request schemas", () => {
    expect(
      createProjectSchema.safeParse({
        title: "Honeybee Science",
        originalIdea: "Explain how honeybees make honey in a friendly kids cartoon story.",
        durationSeconds: 180,
      }).success
    ).toBe(true);

    expect(
      createProjectSchema.safeParse({
        title: "Too Long",
        originalIdea: "Valid idea prompt over ten characters",
        durationSeconds: 900,
      }).success
    ).toBe(false);

    expect(
      adminCreditAdjustSchema.safeParse({
        targetUserId: "00000000-0000-0000-0000-000000000001",
        direction: "credit",
        credits: 0,
        reason: "Zero credits must be rejected",
      }).success
    ).toBe(false);

    expect(
      signupSchema.safeParse({
        fullName: "Aarav",
        email: "aarav@example.com",
        password: "short",
      }).success
    ).toBe(false);
  });

  it("verifies SQL migrations enforce RLS, append-only ledger immutability, and SKIP LOCKED queue", () => {
    const schemaSql = fs
      .readFileSync(
        path.join(process.cwd(), "supabase/migrations/202611150001_beevo_core_schema.sql"),
        "utf8"
      )
      .toLowerCase();
    const rlsSql = fs
      .readFileSync(
        path.join(process.cwd(), "supabase/migrations/202611150002_beevo_rls_and_functions.sql"),
        "utf8"
      )
      .toLowerCase();

    const requiredTables = [
      "profiles",
      "user_roles",
      "credit_wallets",
      "credit_ledger",
      "credit_packages",
      "payments",
      "projects",
      "project_settings",
      "characters",
      "storyboards",
      "scenes",
      "assets",
      "scene_assets",
      "voice_generations",
      "timelines",
      "generations",
      "render_jobs",
      "generation_jobs",
      "webhook_events",
      "email_outbox",
      "music_library",
      "provider_usage",
      "audit_logs",
    ];

    for (const table of requiredTables) {
      expect(schemaSql).toContain(`create table if not exists public.${table}`);
      expect(rlsSql).toContain(`alter table public.${table} enable row level security`);
    }

    expect(rlsSql).toContain("trg_credit_ledger_immutable");
    expect(rlsSql).toContain("trg_audit_logs_immutable");
    expect(rlsSql).toContain("for update skip locked");
    expect(rlsSql).toContain("revoke all on function public.allocate_purchase_credits");
    expect(rlsSql).toContain("revoke all on function public.reserve_generation_credits");
  });
});
