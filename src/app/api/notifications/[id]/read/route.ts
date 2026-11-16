import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    const { id } = await context.params;
    const { error } = await auth.adminSupabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.userId);

    if (error) throw new Error(error.message);

    return jsonOk({ id, read: true });
  } catch (err) {
    return handleApiError(err);
  }
}
