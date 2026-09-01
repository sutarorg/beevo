import { cookies } from "next/headers";
import crypto from "crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { handler, ok, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { adapterFor, oauthRedirectUri, type ProfileInfo } from "@/lib/server/platforms";
import { randomToken, hmacSha256 } from "@/lib/server/crypto";
import { env } from "@/lib/server/env";
import type { PlatformId } from "@/lib/types";

export const dynamic = "force-dynamic";

const OAUTH_COOKIE = "beevo_oauth";
const PKCE_COOKIE = "beevo_pkce";

const HUES: Record<PlatformId, number> = { instagram: 335, facebook: 215, twitter: 40, linkedin: 210, pinterest: 0, youtube: 5 };

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ platform: string }> }) => {
  const { workspace, member } = await requireUser();
  if (member.role === "viewer") throw new ApiError(403, "Viewers can't connect accounts");
  const { platform } = await ctx.params;
  const adapter = adapterFor(platform);

  // Plan capacity check (counts distinct platforms connected).
  const connected = await db
    .select({ value: count() })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.workspaceId, workspace.id),
        inArray(socialAccounts.status, ["connected", "simulated", "expiring"])
      )
    );
  const limit = workspace.plan === "free" ? 2 : 12;
  if ((connected[0]?.value ?? 0) >= limit) {
    throw new ApiError(403, `Your plan supports up to ${limit} connected accounts`, "PLAN_LIMIT");
  }

  /* Simulated connect — lets the demo workspace operate without real OAuth apps.
     Disable entirely with ALLOW_SIMULATED_CONNECTIONS=false. */
  if (!adapter.configured()) {
    if (!env.allowSimulatedConnections()) {
      throw new ApiError(
        501,
        `${platform} OAuth is not configured on this deployment. Set the app credentials (see README → Environment Variables).`,
        "OAUTH_NOT_CONFIGURED"
      );
    }
    const profile: ProfileInfo = {
      platformAccountId: `sim_${platform}_${randomToken(6)}`,
      handle: platform === "instagram" ? "@beevo.studio" : platform === "twitter" ? "@beevostudio" : "Beevo Studio",
      displayName: "Beevo Studio",
      followers: 4000 + Math.floor(Math.random() * 42000),
    };
    const [account] = await db
      .insert(socialAccounts)
      .values({
        workspaceId: workspace.id,
        platform: platform as PlatformId,
        platformAccountId: profile.platformAccountId,
        handle: profile.handle,
        displayName: profile.displayName,
        followers: profile.followers,
        avatarHue: HUES[platform as PlatformId] ?? 40,
        accessTokenEnc: `sim.${randomToken(24)}`,
        scopes: adapter.scopes,
        status: "simulated",
        lastSyncAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialAccounts.workspaceId, socialAccounts.platform, socialAccounts.platformAccountId],
        set: { status: "simulated", lastSyncAt: new Date() },
      })
      .returning();
    return ok({ simulated: true, account: { id: account.id, platform: account.platform, handle: account.handle } });
  }

  /* Real OAuth — signed state in an httpOnly cookie, PKCE for X. */
  const payload = Buffer.from(
    JSON.stringify({ p: platform, ws: workspace.id, n: randomToken(12), t: Date.now() })
  ).toString("base64url");
  const sig = hmacSha256(payload, env.encryptionKey().toString("hex"));
  const state = `${payload}.${sig}`;

  const jar = await cookies();
  const cookieBase = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  jar.set(OAUTH_COOKIE, state, cookieBase);

  let codeChallenge: string | undefined;
  if (platform === "twitter") {
    const verifier = randomToken(48);
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    jar.set(PKCE_COOKIE, verifier, cookieBase);
    codeChallenge = challenge;
  }

  const url = adapter.authorizeUrl({ state, redirectUri: oauthRedirectUri(platform), codeChallenge });
  return ok({ url });
});
