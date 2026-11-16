import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedBrowserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (!cachedBrowserClient) {
    cachedBrowserClient = createBrowserClient(url, anonKey);
  }
  return cachedBrowserClient;
}
