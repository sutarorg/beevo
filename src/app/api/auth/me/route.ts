import { handler, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const { user, workspace, member } = await requireUser();
  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaceId: workspace.id,
      workspace: workspace.name,
      plan: workspace.plan,
      role: member.role,
      timezone: user.prefs?.timezone ?? "Asia/Kolkata (GMT+5:30)",
      digest: user.prefs?.digest ?? true,
      authProvider: user.authProvider,
      hasPassword: !!user.passwordSetAt,
    },
    plan: workspace.plan,
  });
});
