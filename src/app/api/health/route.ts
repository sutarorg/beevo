import { getConfiguredIntegrationsSummary, isSupabaseAdminConfigured } from "@/lib/env";
import { jsonOk } from "@/lib/security/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const integrations = getConfiguredIntegrationsSummary();
  let databaseReachable = false;

  if (isSupabaseAdminConfigured()) {
    try {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("credit_packages").select("id").limit(1);
      databaseReachable = !error;
    } catch {
      databaseReachable = false;
    }
  }

  return jsonOk({
    status: "ok",
    timestamp: new Date().toISOString(),
    databaseReachable,
    integrations,
  });
}
