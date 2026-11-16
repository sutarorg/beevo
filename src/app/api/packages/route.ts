import { CANONICAL_CREDIT_PACKS } from "@/features/credits/service";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { handleApiError, jsonOk } from "@/lib/security/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return jsonOk({
        source: "published_defaults",
        packages: Object.values(CANONICAL_CREDIT_PACKS),
      });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("credit_packages")
      .select("id, name, price_paise, credits, video_minutes, currency, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`Failed loading credit packages: ${error.message}`);

    return jsonOk({
      source: "database",
      packages: (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        pricePaise: Number(p.price_paise),
        priceInr: Number(p.price_paise) / 100,
        credits: Number(p.credits),
        videoMinutes: Number(p.video_minutes),
        currency: p.currency,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
