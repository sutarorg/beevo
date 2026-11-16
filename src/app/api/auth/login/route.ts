import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    enforceRateLimit(`login:${getClientIp(request)}`, RATE_LIMITS.auth);
    const parsed = await parseJsonBody(request, loginSchema);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (error || !data.user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    return jsonOk({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
