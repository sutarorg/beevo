import { handleApiError, jsonOk } from "@/lib/security/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return jsonOk({ signedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
