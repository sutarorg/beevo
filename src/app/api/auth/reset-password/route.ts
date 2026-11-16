import { getAppUrl } from "@/lib/env";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    enforceRateLimit(`reset:${getClientIp(request)}`, RATE_LIMITS.auth);
    const parsed = await parseJsonBody(request, forgotPasswordSchema);

    const supabase = await createSupabaseServerClient();
    const appUrl = getAppUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
      redirectTo: `${appUrl}/api/auth/callback?next=/app/settings`,
    });

    if (error) {
      throw new ApiError(400, "RESET_FAILED", error.message);
    }

    return jsonOk({
      sent: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
