import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/security/http";

export interface AuthenticatedContext {
  userId: string;
  email: string;
  role: "user" | "admin";
  accountStatus: "active" | "suspended";
  supabase: SupabaseClient;
  adminSupabase: SupabaseClient;
}

/**
 * Authoritative server-side user authentication via Supabase Auth getUser()
 * (validates JWT with Supabase Auth server — never trusts cookies/localStorage blindly).
 */
export async function requireUser(): Promise<AuthenticatedContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required. Please sign in to continue.");
  }

  const adminSupabase = createSupabaseAdminClient();

  const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
    adminSupabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    adminSupabase
      .from("profiles")
      .select("account_status, email")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const role = roleRow?.role === "admin" ? "admin" : "user";
  const accountStatus = profileRow?.account_status === "suspended" ? "suspended" : "active";

  if (accountStatus === "suspended") {
    throw new ApiError(
      403,
      "ACCOUNT_SUSPENDED",
      "Your account has been suspended. Contact Beevo support for assistance."
    );
  }

  return {
    userId: user.id,
    email: profileRow?.email || user.email || "",
    role,
    accountStatus,
    supabase,
    adminSupabase,
  };
}

/**
 * Strict server-side Admin RBAC verification against the trusted PostgreSQL user_roles table.
 * Logs denied attempts to audit_logs for security observability.
 */
export async function requireAdmin(actionName?: string): Promise<AuthenticatedContext> {
  const ctx = await requireUser();
  if (ctx.role !== "admin") {
    if (actionName) {
      await writeAuditLog(ctx.adminSupabase, {
        actorUserId: ctx.userId,
        actorEmail: ctx.email,
        actorRole: ctx.role,
        action: actionName,
        targetType: "admin_route",
        targetId: actionName,
        result: "denied",
        reason: "Non-admin user attempted privileged admin operation",
      });
    }
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Administrator privileges are required to access this resource."
    );
  }
  return ctx;
}

export async function writeAuditLog(
  adminSupabase: SupabaseClient,
  entry: {
    actorUserId: string | null;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    result: "success" | "denied" | "failed";
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await adminSupabase.from("audit_logs").insert({
    actor_user_id: entry.actorUserId,
    actor_email: entry.actorEmail,
    actor_role: entry.actorRole,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    result: entry.result,
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    console.error("[Beevo AuditLog Write Failed]", error.message);
  }
}
