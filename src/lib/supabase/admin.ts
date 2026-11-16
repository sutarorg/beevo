import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured, requireEnv } from "@/lib/env";

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase Service Role client.
 * NEVER import this module into Client Components.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY_VIOLATION: Supabase admin client cannot run in browser context.");
  }
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", "Supabase Database");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", "Supabase Database");

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedAdminClient;
}

export function tryCreateSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  return createSupabaseAdminClient();
}
