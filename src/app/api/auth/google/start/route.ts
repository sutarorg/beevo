import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handler, ApiError } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { randomToken, hmacSha256 } from "@/lib/server/crypto";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "beevo_google_oauth";

/**
 * Google account sign-in (openid email profile) — start.
 * Distinct from the YouTube platform connection, reuses GOOGLE_CLIENT_*.
 */
export const GET = handler(async () => {
  const { id } = env.oauth.google();
  if (!id) {
    return NextResponse.redirect(
      `${env.appUrl()}/login?error=${encodeURIComponent("Google sign-in is not configured on this deployment")}`
    );
  }

  const payload = Buffer.from(JSON.stringify({ flow: "signin", n: randomToken(16), t: Date.now() })).toString("base64url");
  const sig = hmacSha256(`google-signin:${payload}`, env.encryptionKey().toString("hex"));
  const state = `${payload}.${sig}`;

  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: `${env.appUrl()}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`);
});
