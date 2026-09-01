import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, socialAccounts } from "@/db/schema";
import { adapterFor, oauthRedirectUri } from "@/lib/server/platforms";
import { encrypt, hmacSha256, timingSafeEqual } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import { eq, and } from "drizzle-orm";
import type { PlatformId } from "@/lib/types";

export const dynamic = "force-dynamic";

const OAUTH_COOKIE = "beevo_oauth";
const PKCE_COOKIE = "beevo_pkce";
const HUES: Record<string, number> = { instagram: 335, facebook: 215, twitter: 40, linkedin: 210, pinterest: 0, youtube: 5 };

function redirect(path: string): NextResponse {
  return NextResponse.redirect(`${env.appUrl()}${path}`);
}

export async function GET(req: Request, ctx: { params: Promise<{ platform: string }> }) {
  const { platform } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");

  if (errParam) return redirect(`/accounts?oauth_error=${encodeURIComponent(errParam)}`);
  if (!code || !state) return redirect(`/accounts?oauth_error=missing_code`);

  const jar = await cookies();
  const cookieState = jar.get(OAUTH_COOKIE)?.value;
  jar.delete(OAUTH_COOKIE);

  if (!cookieState || cookieState !== state) {
    return redirect(`/accounts?oauth_error=${encodeURIComponent("State mismatch — please try connecting again")}`);
  }
  const [payload, sig] = state.split(".");
  const expected = hmacSha256(payload, env.encryptionKey().toString("hex"));
  if (!timingSafeEqual(expected, sig)) {
    return redirect(`/accounts?oauth_error=${encodeURIComponent("Invalid OAuth state signature")}`);
  }
  let parsed: { p: string; ws: string; t?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return redirect(`/accounts?oauth_error=malformed_state`);
  }
  if (parsed.p !== platform) return redirect(`/accounts?oauth_error=platform_mismatch`);

  try {
    const adapter = adapterFor(platform);
    const pkce = jar.get(PKCE_COOKIE)?.value;
    jar.delete(PKCE_COOKIE);

    const tokens = await adapter.exchangeCode(code, oauthRedirectUri(platform), pkce);
    const profile = await adapter.fetchProfile(tokens);

    const [account] = await db
      .insert(socialAccounts)
      .values({
        workspaceId: parsed.ws,
        platform: platform as PlatformId,
        platformAccountId: profile.platformAccountId,
        handle: profile.handle,
        displayName: profile.displayName,
        followers: profile.followers,
        avatarUrl: profile.avatarUrl ?? null,
        avatarHue: HUES[platform] ?? 40,
        accessTokenEnc: encrypt(tokens.accessToken),
        refreshTokenEnc: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt ?? null,
        scopes: tokens.scope ?? adapter.scopes,
        status: "connected",
        lastSyncAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialAccounts.workspaceId, socialAccounts.platform, socialAccounts.platformAccountId],
        set: {
          handle: profile.handle,
          displayName: profile.displayName,
          followers: profile.followers,
          accessTokenEnc: encrypt(tokens.accessToken),
          refreshTokenEnc: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
          tokenExpiresAt: tokens.expiresAt ?? null,
          status: "connected",
          lastSyncAt: new Date(),
        },
      })
      .returning();

    await db.insert(notifications).values({
      workspaceId: parsed.ws,
      kind: "account",
      title: `${adapter.platform === "twitter" ? "X" : platform[0].toUpperCase() + platform.slice(1)} connected`,
      body: `${profile.handle} is now linked to this hive.`,
    });

    // If this was a previously-expiring account, clear the stale markers.
    await db
      .update(socialAccounts)
      .set({ status: "connected" })
      .where(and(eq(socialAccounts.id, account.id), eq(socialAccounts.workspaceId, parsed.ws)));

    return redirect(`/accounts?connected=${platform}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth exchange failed";
    console.error("[oauth callback]", msg);
    return redirect(`/accounts?oauth_error=${encodeURIComponent(msg.slice(0, 220))}`);
  }
}
