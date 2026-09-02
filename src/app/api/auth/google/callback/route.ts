import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workspaces, workspaceMembers } from "@/db/schema";
import { createSession, hashPassword, setSessionCookie } from "@/lib/server/session";
import { hmacSha256, randomToken, timingSafeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { seedWorkspace } from "@/lib/server/seed";
import { emails, sendMail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "beevo_google_oauth";

function loginRedirect(msg: string) {
  return NextResponse.redirect(`${env.appUrl()}/login?error=${encodeURIComponent(msg)}`);
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) return loginRedirect(err === "access_denied" ? "Google sign-in was cancelled" : err);
  if (!code || !state) return loginRedirect("Invalid Google callback — try again");

  /* state cookie + HMAC verification (CSRF protection) */
  const jar = await cookies();
  const cookieState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  if (!cookieState || cookieState !== state) return loginRedirect("Session state expired — try signing in again");
  const [payload, sig] = state.split(".");
  const expected = hmacSha256(`google-signin:${payload}`, env.encryptionKey().toString("hex"));
  if (!timingSafeEqual(expected, sig)) return loginRedirect("Invalid sign-in state");

  const { id, secret } = env.oauth.google();
  if (!id || !secret) return loginRedirect("Google sign-in is not configured on this deployment");

  try {
    /* exchange code → access token */
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: id,
        client_secret: secret,
        redirect_uri: `${env.appUrl()}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed (${tokenRes.status})`);
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new Error("no access token returned");

    /* verified profile */
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error(`profile fetch failed (${profileRes.status})`);
    const profile = (await profileRes.json()) as GoogleUserInfo;
    if (!profile.email || profile.email_verified === false) {
      return loginRedirect("Google account email is not verified");
    }
    const email = profile.email.toLowerCase();
    const name = (profile.name ?? email.split("@")[0]).slice(0, 80) || "Bee Keeper";

    /* find or create the account */
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let workspaceId: string | null = null;

    if (user) {
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, user.id))
        .limit(1);
      if (!membership) throw new Error("account has no workspace");
      workspaceId = membership.workspaceId;
    } else {
      [user] = await db
        .insert(users)
        .values({ name, email, passwordHash: await hashPassword(randomToken(24)) })
        .returning();
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "hive"}-${randomToken(3)}`;
      const [ws] = await db
        .insert(workspaces)
        .values({ name: `${name.split(" ")[0]}'s hive`, slug, plan: "free" })
        .returning();
      await db.insert(workspaceMembers).values({ workspaceId: ws.id, userId: user.id, role: "owner" });
      await seedWorkspace(ws.id, user.id, { demo: env.demoSeed() });
      workspaceId = ws.id;
      void sendMail({ to: email, subject: "Welcome to Beevo", html: emails.welcome(name) });
    }

    const { token, expiresAt } = await createSession(user.id, workspaceId, {
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    await setSessionCookie(token, expiresAt);

    const redirect = NextResponse.redirect(`${env.appUrl()}/dashboard`);
    return redirect;
  } catch (e) {
    console.error("[google signin]", e);
    return loginRedirect(e instanceof Error ? e.message.slice(0, 180) : "Google sign-in failed");
  }
}
