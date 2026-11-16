import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, requireEnv } from "@/lib/env";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", "Supabase Auth");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase Auth");
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookie mutation is handled by middleware
        }
      },
    },
  });
}

export async function tryCreateSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseServerClient();
}
