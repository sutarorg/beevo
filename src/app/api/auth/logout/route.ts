import { handler, ok } from "@/lib/server/http";
import { clearSessionCookie, destroySession, getSessionTokenHash } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const POST = handler(async () => {
  const hash = await getSessionTokenHash();
  if (hash) await destroySession(hash);
  await clearSessionCookie();
  return ok({ ok: true });
});
