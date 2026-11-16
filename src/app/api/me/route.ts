import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { updateProfileSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUser();
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      auth.adminSupabase.from("profiles").select("*").eq("user_id", auth.userId).maybeSingle(),
      auth.adminSupabase.from("credit_wallets").select("*").eq("user_id", auth.userId).maybeSingle(),
    ]);

    return jsonOk({
      user: {
        id: auth.userId,
        email: profile?.email ?? auth.email,
        fullName: profile?.full_name ?? "",
        avatarUrl: profile?.avatar_url ?? null,
        role: auth.role,
        accountStatus: profile?.account_status ?? auth.accountStatus,
        notificationPreferences: profile?.notification_preferences ?? {},
        createdAt: profile?.created_at ?? new Date().toISOString(),
      },
      wallet: {
        availableCredits: Number(wallet?.available_credits ?? 0),
        reservedCredits: Number(wallet?.reserved_credits ?? 0),
        updatedAt: wallet?.updated_at ?? new Date().toISOString(),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    const parsed = await parseJsonBody(request, updateProfileSchema);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.fullName !== undefined) updates.full_name = parsed.fullName;
    if (parsed.avatarUrl !== undefined) updates.avatar_url = parsed.avatarUrl;

    const { data, error } = await auth.adminSupabase
      .from("profiles")
      .update(updates)
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return jsonOk({
      user: {
        id: data.user_id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        notificationPreferences: data.notification_preferences,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
