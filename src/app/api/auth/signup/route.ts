import { getAppUrl, isResendConfigured, isSupabaseAdminConfigured } from "@/lib/env";
import { enqueueAndSendEmail } from "@/lib/resend/client";
import { buildWelcomeEmail } from "@/lib/resend/templates";
import { ApiError, handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { enforceRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    enforceRateLimit(`signup:${getClientIp(request)}`, RATE_LIMITS.auth);
    const parsed = await parseJsonBody(request, signupSchema);

    const supabase = await createSupabaseServerClient();
    const appUrl = getAppUrl();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: { full_name: parsed.fullName },
        emailRedirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error) {
      throw new ApiError(400, "SIGNUP_FAILED", error.message);
    }

    if (data.user && isSupabaseAdminConfigured() && isResendConfigured()) {
      const admin = createSupabaseAdminClient();
      const welcome = buildWelcomeEmail(parsed.fullName);
      await enqueueAndSendEmail(admin, {
        userId: data.user.id,
        toEmail: parsed.email,
        templateKey: "welcome",
        subject: welcome.subject,
        htmlBody: welcome.html,
        idempotencyKey: `email:welcome:${data.user.id}`,
      }).catch(() => undefined);
    }

    return jsonOk(
      {
        userId: data.user?.id ?? null,
        email: data.user?.email ?? parsed.email,
        emailConfirmationRequired: !data.session,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
