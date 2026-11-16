import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUser();
    const { data, error } = await auth.adminSupabase
      .from("notifications")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return jsonOk({
      notifications: (data ?? []).map((n) => ({
        id: n.id,
        category: n.category === "billing" ? "credits" : n.category,
        title: n.title,
        body: n.body,
        href: n.href,
        read: Boolean(n.read_at),
        createdAt: n.created_at,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
