import type { PlatformId } from "@/lib/types";
import { env } from "./env";
import { randomToken } from "./crypto";

/**
 * Platform adapters — real OAuth 2.0 + publishing for all six networks.
 * Each adapter works in three modes:
 *  - CONFIGURED: full live OAuth + API publishing
 *  - SIMULATED (default in demo): OAuth absent → deterministic fake connect/publish
 * The engine decides per account (status === 'simulated' or token prefix 'sim.').
 */

export interface TokenSet {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string;
}

export interface ProfileInfo {
  platformAccountId: string;
  handle: string;
  displayName: string;
  followers: number;
  avatarUrl?: string | null;
}

export interface PublishInput {
  caption: string;
  media: string[]; // absolute public URLs
}

export interface PublishResult {
  platformPostId: string;
  url?: string | null;
}

export interface PlatformAdapter {
  platform: PlatformId;
  scopes: string;
  configured: () => boolean;
  authorizeUrl: (p: { state: string; redirectUri: string; codeChallenge?: string }) => string;
  exchangeCode: (code: string, redirectUri: string, codeVerifier?: string) => Promise<TokenSet>;
  fetchProfile: (tokens: TokenSet) => Promise<ProfileInfo>;
  /** Refresh an expiring/expired access token when the platform allows it. */
  refresh?: (tokens: TokenSet) => Promise<TokenSet>;
  publish: (tokens: TokenSet, input: PublishInput) => Promise<PublishResult>;
}

/** ISO-8601 YouTube duration → seconds. PT3M / PT58S etc. */
export function parseIsoDurationSeconds(iso: string): number | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** Shorts ceiling enforced both client- and server-side. */
export const YOUTUBE_SHORTS_MAX_SECONDS = 180;

class PlatformError extends Error {
  code = "PLATFORM";
}

const jsonHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

async function must<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new PlatformError(`${what} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

const basic = (id: string, secret: string) => `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;

/* ================================ META ================================ */
const META_GRAPH = "https://graph.facebook.com/v21.0";

function metaAuthorizeUrl(platform: "facebook" | "instagram", p: { state: string; redirectUri: string }) {
  const { id } = env.oauth.meta();
  const scope =
    platform === "instagram"
      ? "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management"
      : "pages_show_list,pages_manage_posts,pages_read_engagement,public_profile,email";
  const q = new URLSearchParams({ client_id: id, redirect_uri: p.redirectUri, state: p.state, scope, response_type: "code" });
  return `https://www.facebook.com/v21.0/dialog/oauth?${q}`;
}

async function metaExchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
  const { id, secret } = env.oauth.meta();
  const q = new URLSearchParams({ client_id: id, client_secret: secret, redirect_uri: redirectUri, code });
  const short = await must<{ access_token: string; expires_in?: number }>(
    await fetch(`${META_GRAPH}/oauth/access_token?${q}`),
    "Meta token exchange"
  );
  // Upgrade to a long-lived token (~60 days).
  try {
    const longQ = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: id,
      client_secret: secret,
      fb_exchange_token: short.access_token,
    });
    const long = await must<{ access_token: string; expires_in?: number }>(
      await fetch(`${META_GRAPH}/oauth/access_token?${longQ}`),
      "Meta long-lived token"
    );
    return { accessToken: long.access_token, expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null };
  } catch {
    return { accessToken: short.access_token, expiresAt: short.expires_in ? new Date(Date.now() + short.expires_in * 1000) : null };
  }
}

interface MetaPage {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: { id: string };
  followers_count?: number;
}

async function metaPages(token: string): Promise<MetaPage[]> {
  const q = new URLSearchParams({ fields: "id,name,access_token,instagram_business_account,followers_count", access_token: token });
  const data = await must<{ data: MetaPage[] }>(await fetch(`${META_GRAPH}/me/accounts?${q}`), "Meta pages");
  return data.data ?? [];
}

function metaAdapter(platform: "facebook" | "instagram"): PlatformAdapter {
  return {
    platform,
    scopes: platform === "instagram" ? "instagram_content_publish" : "pages_manage_posts",
    configured: () => !!(env.oauth.meta().id && env.oauth.meta().secret),
    authorizeUrl: (p) => metaAuthorizeUrl(platform, p),
    exchangeCode: metaExchangeCode,
    /** Meta long-lived tokens (~60d) can be exchanged again while still valid. */
    async refresh(tokens) {
      const { id, secret } = env.oauth.meta();
      const q = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: id,
        client_secret: secret,
        fb_exchange_token: tokens.accessToken,
      });
      const res = await must<{ access_token: string; expires_in?: number }>(
        await fetch(`${META_GRAPH}/oauth/access_token?${q}`),
        "Meta token refresh"
      );
      return {
        accessToken: res.access_token,
        expiresAt: res.expires_in ? new Date(Date.now() + res.expires_in * 1000) : null,
      };
    },
    async fetchProfile(tokens) {
      const pages = await metaPages(tokens.accessToken);
      const page = platform === "instagram" ? pages.find((pg) => pg.instagram_business_account) : pages[0];
      if (!page)
        throw new PlatformError(
          platform === "instagram"
            ? "No Instagram Business account linked to any of your Facebook Pages"
            : "No Facebook Page found on this account"
        );
      if (platform === "instagram") {
        const igId = page.instagram_business_account!.id;
        const q = new URLSearchParams({ fields: "id,username,name,followers_count,profile_picture_url", access_token: tokens.accessToken });
        const ig = await must<{ id: string; username: string; name?: string; followers_count?: number; profile_picture_url?: string }>(
          await fetch(`${META_GRAPH}/${igId}?${q}`),
          "Instagram profile"
        );
        return {
          platformAccountId: `${igId}:page:${page.id}`,
          handle: `@${ig.username}`,
          displayName: ig.name || ig.username,
          followers: ig.followers_count ?? 0,
          avatarUrl: ig.profile_picture_url ?? null,
        };
      }
      return {
        platformAccountId: page.id,
        handle: page.name,
        displayName: page.name,
        followers: page.followers_count ?? 0,
        avatarUrl: null,
      };
    },
    async publish(tokens, input) {
      const [pageId, isIgWithPage] = platform === "instagram" ? [undefined, true] : [undefined, false];
      void pageId;
      const pages = await metaPages(tokens.accessToken);
      if (platform === "instagram") {
        const page = pages.find((pg) => pg.instagram_business_account);
        if (!page) throw new PlatformError("No linked Instagram Business account");
        const igId = page.instagram_business_account!.id;
        const pageToken = page.access_token ?? tokens.accessToken;
        if (!input.media[0]) throw new PlatformError("Instagram requires at least one image or video");
        const container = await must<{ id: string }>(
          await fetch(`${META_GRAPH}/${igId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: input.media[0], caption: input.caption, access_token: pageToken }),
          }),
          "Instagram media container"
        );
        const published = await must<{ id: string }>(
          await fetch(`${META_GRAPH}/${igId}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
          }),
          "Instagram publish"
        );
        return { platformPostId: published.id, url: null };
      }
      const page = pages[0];
      if (!page) throw new PlatformError("No Facebook Page available");
      const pageToken = page.access_token ?? tokens.accessToken;
      const endpoint = input.media[0] ? `${META_GRAPH}/${page.id}/photos` : `${META_GRAPH}/${page.id}/feed`;
      const body: Record<string, string> = input.media[0]
        ? { url: input.media[0], caption: input.caption, access_token: pageToken }
        : { message: input.caption, access_token: pageToken };
      const out = await must<{ id: string; post_id?: string }>(
        await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
        "Facebook publish"
      );
      return { platformPostId: out.post_id ?? out.id, url: null };
    },
  };
}

/* ============================== YOUTUBE =============================== */
const youtube: PlatformAdapter = {
  platform: "youtube",
  scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
  configured: () => !!(env.oauth.google().id && env.oauth.google().secret),
  authorizeUrl: ({ state, redirectUri }) => {
    const q = new URLSearchParams({
      client_id: env.oauth.google().id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: youtube.scopes,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  },
  async exchangeCode(code, redirectUri) {
    const { id, secret } = env.oauth.google();
    const res = await must<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      }),
      "Google token exchange"
    );
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token ?? null,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
      scope: res.scope,
    };
  },
  async fetchProfile(tokens) {
    const data = await must<{ items?: { id: string; snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url?: string } } }; statistics?: { subscriberCount?: string } }[] }>(
      await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
        headers: jsonHeaders(tokens.accessToken),
      }),
      "YouTube channel"
    );
    const ch = data.items?.[0];
    if (!ch) throw new PlatformError("No YouTube channel on this Google account");
    return {
      platformAccountId: ch.id,
      handle: ch.snippet.customUrl || ch.snippet.title,
      displayName: ch.snippet.title,
      followers: Number(ch.statistics?.subscriberCount ?? 0),
      avatarUrl: ch.snippet.thumbnails?.default?.url ?? null,
    };
  },
  /** Google access tokens last 1h — refresh them in the engine. */
  async refresh(tokens) {
    if (!tokens.refreshToken)
      throw new PlatformError("YouTube account needs to be reconnected (no refresh token stored)");
    const { id, secret } = env.oauth.google();
    const res = await must<{ access_token: string; expires_in: number }>(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken!,
          client_id: id,
          client_secret: secret,
        }),
      }),
      "Google token refresh"
    );
    return {
      accessToken: res.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
    };
  },
  async publish(tokens, input) {
    // Shorts-only channel: reject images outright, require a video file.
    const image = input.media.find((m) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(m));
    if (image)
      throw new PlatformError("YouTube posts cannot include images — attach a Short (vertical video ≤ 3 min)");
    const video = input.media.find((m) => /\.(mp4|mov|webm|mkv)(\?|$)/i.test(m));
    if (!video) throw new PlatformError("YouTube Shorts require a video file (mp4/mov/webm)");
    // Resumable upload — initiate.
    const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: { ...jsonHeaders(tokens.accessToken), "X-Upload-Content-Type": "video/*" },
      body: JSON.stringify({
        snippet: { title: input.caption.slice(0, 95) || "Beevo upload", description: input.caption },
        status: { privacyStatus: "public" },
      }),
    });
    if (!init.ok) throw new PlatformError(`YouTube upload init failed (${init.status})`);
    const sessionUri = init.headers.get("location");
    if (!sessionUri) throw new PlatformError("YouTube did not return an upload session");
    const bytes = new Uint8Array(await (await fetch(video)).arrayBuffer());
    const uploaded = await must<{ id: string }>(
      await fetch(sessionUri, { method: "PUT", headers: { "Content-Type": "video/*" }, body: bytes }),
      "YouTube video upload"
    );

    /* ---- Shorts-only enforcement (server-side, cannot be bypassed) ----
       Read contentDetails; anything longer than 3 minutes is deleted again. */
    const details = await must<{ items?: { contentDetails?: { duration?: string } }[] }>(
      await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${uploaded.id}`,
        { headers: jsonHeaders(tokens.accessToken) }
      ),
      "YouTube video details"
    );
    const isoDur = details.items?.[0]?.contentDetails?.duration;
    const seconds = isoDur ? parseIsoDurationSeconds(isoDur) : null;
    if (seconds === null || seconds > YOUTUBE_SHORTS_MAX_SECONDS) {
      // Enforce: remove the offending upload before Beevo counts it.
      await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${uploaded.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }).catch(() => undefined);
      throw new PlatformError(
        `Only YouTube Shorts are allowed — this video is over 3 minutes long. The violating upload was deleted.`
      );
    }
    return { platformPostId: uploaded.id, url: `https://youtube.com/shorts/${uploaded.id}` };
  },
};

/* ================================= X ================================== */
const x: PlatformAdapter = {
  platform: "twitter",
  scopes: "tweet.read tweet.write users.read offline.access",
  configured: () => !!env.oauth.x().id,
  authorizeUrl: ({ state, redirectUri, codeChallenge }) => {
    const q = new URLSearchParams({
      response_type: "code",
      client_id: env.oauth.x().id,
      redirect_uri: redirectUri,
      scope: x.scopes,
      state,
      code_challenge: codeChallenge ?? "",
      code_challenge_method: "S256",
    });
    return `https://twitter.com/i/oauth2/authorize?${q}`;
  },
  async exchangeCode(code, redirectUri, codeVerifier) {
    const { id, secret } = env.oauth.x();
    const res = await must<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>(
      await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(secret ? { Authorization: basic(id, secret) } : {}),
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: id,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier ?? "",
        }),
      }),
      "X token exchange"
    );
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token ?? null,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
      scope: res.scope,
    };
  },
  async fetchProfile(tokens) {
    const me = await must<{ data: { id: string; username: string; name: string; public_metrics?: { followers_count?: number } } }>(
      await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics", { headers: jsonHeaders(tokens.accessToken) }),
      "X profile"
    );
    return {
      platformAccountId: me.data.id,
      handle: `@${me.data.username}`,
      displayName: me.data.name,
      followers: me.data.public_metrics?.followers_count ?? 0,
      avatarUrl: null,
    };
  },
  /** X access tokens expire after ~2h — refresh or every later publish 401s. */
  async refresh(tokens) {
    if (!tokens.refreshToken)
      throw new PlatformError("X account needs to be reconnected (no refresh token stored)");
    const { id, secret } = env.oauth.x();
    const res = await must<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>(
      await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(secret ? { Authorization: basic(id, secret) } : {}),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken!,
          client_id: id,
        }),
      }),
      "X token refresh"
    );
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token ?? tokens.refreshToken,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
      scope: res.scope,
    };
  },
  async publish(tokens, input) {
    if (input.caption.length > 280) throw new PlatformError("Tweet exceeds 280 characters");
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: jsonHeaders(tokens.accessToken),
      body: JSON.stringify({ text: input.caption }),
    });
    if (res.status === 401 || res.status === 403) {
      const detail = (await res.text()).slice(0, 160);
      throw new PlatformError(
        `X rejected the publish (${res.status}) — reconnect X; also verify the app has "Read and write" permission. ${detail}`
      );
    }
    const out = await must<{ data: { id: string } }>(res, "X publish");
    return { platformPostId: out.data.id, url: null };
  },
};

/* =============================== LINKEDIN ============================= */
const linkedin: PlatformAdapter = {
  platform: "linkedin",
  scopes: "openid profile email w_member_social",
  configured: () => !!(env.oauth.linkedin().id && env.oauth.linkedin().secret),
  authorizeUrl: ({ state, redirectUri }) => {
    const q = new URLSearchParams({
      response_type: "code",
      client_id: env.oauth.linkedin().id,
      redirect_uri: redirectUri,
      state,
      scope: linkedin.scopes,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${q}`;
  },
  async exchangeCode(code, redirectUri) {
    const { id, secret } = env.oauth.linkedin();
    const res = await must<{ access_token: string; expires_in: number }>(
      await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: id, client_secret: secret }),
      }),
      "LinkedIn token exchange"
    );
    return { accessToken: res.access_token, expiresAt: new Date(Date.now() + res.expires_in * 1000) };
  },
  async fetchProfile(tokens) {
    const me = await must<{ sub: string; name?: string; email?: string; picture?: string }>(
      await fetch("https://api.linkedin.com/v2/userinfo", { headers: jsonHeaders(tokens.accessToken) }),
      "LinkedIn profile"
    );
    return {
      platformAccountId: me.sub,
      handle: me.name || me.email || "LinkedIn member",
      displayName: me.name || "LinkedIn member",
      followers: 0,
      avatarUrl: me.picture ?? null,
    };
  },
  async publish(tokens, input) {
    const me = await linkedin.fetchProfile(tokens);
    const res = await must<{ id: string }>(
      await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: { ...jsonHeaders(tokens.accessToken), "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({
          author: `urn:li:person:${me.platformAccountId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: input.caption },
              shareMediaCategory: input.media[0] ? "IMAGE" : "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      }),
      "LinkedIn publish"
    );
    return { platformPostId: res.id, url: null };
  },
};

/* ============================== PINTEREST ============================= */
const pinterest: PlatformAdapter = {
  platform: "pinterest",
  scopes: "boards:read pins:read pins:write",
  configured: () => !!(env.oauth.pinterest().id && env.oauth.pinterest().secret),
  authorizeUrl: ({ state, redirectUri }) => {
    const q = new URLSearchParams({
      client_id: env.oauth.pinterest().id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: pinterest.scopes,
      state,
    });
    return `https://www.pinterest.com/oauth/?${q}`;
  },
  async refresh(tokens) {
    if (!tokens.refreshToken)
      throw new PlatformError("Pinterest account needs to be reconnected (no refresh token stored)");
    const { id, secret } = env.oauth.pinterest();
    const res = await must<{ access_token: string; refresh_token?: string; expires_in?: number }>(
      await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(id, secret) },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken!,
        }),
      }),
      "Pinterest token refresh"
    );
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token ?? tokens.refreshToken,
      expiresAt: res.expires_in ? new Date(Date.now() + res.expires_in * 1000) : null,
    };
  },
  async exchangeCode(code, redirectUri) {
    const { id, secret } = env.oauth.pinterest();
    const res = await must<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string }>(
      await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basic(id, secret) },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      }),
      "Pinterest token exchange"
    );
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token ?? null,
      expiresAt: res.expires_in ? new Date(Date.now() + res.expires_in * 1000) : null,
      scope: res.scope,
    };
  },
  async fetchProfile(tokens) {
    const me = await must<{ id: string; username: string; business_name?: string; follower_count?: number; profile_image?: string }>(
      await fetch("https://api.pinterest.com/v5/user_account", { headers: jsonHeaders(tokens.accessToken) }),
      "Pinterest profile"
    );
    return {
      platformAccountId: me.id,
      handle: me.username,
      displayName: me.business_name || me.username,
      followers: me.follower_count ?? 0,
      avatarUrl: me.profile_image ?? null,
    };
  },
  async publish(tokens, input) {
    if (!input.media[0]) throw new PlatformError("Pinterest pins require an image");
    const boards = await must<{ items?: { id: string }[] }>(
      await fetch("https://api.pinterest.com/v5/boards?page_size=1", { headers: jsonHeaders(tokens.accessToken) }),
      "Pinterest boards"
    );
    const board = boards.items?.[0];
    if (!board) throw new PlatformError("Create at least one Pinterest board first");
    const res = await must<{ id: string }>(
      await fetch("https://api.pinterest.com/v5/pins", {
        method: "POST",
        headers: jsonHeaders(tokens.accessToken),
        body: JSON.stringify({
          board_id: board.id,
          title: input.caption.slice(0, 96) || "Beevo pin",
          description: input.caption,
          media_source: { source_type: "image_url", url: input.media[0] },
        }),
      }),
      "Pinterest pin"
    );
    return { platformPostId: res.id, url: null };
  },
};

/* ============================== REGISTRY ============================== */
export const adapters: Record<PlatformId, PlatformAdapter> = {
  instagram: metaAdapter("instagram"),
  facebook: metaAdapter("facebook"),
  twitter: x,
  linkedin,
  pinterest,
  youtube,
};

export const VALID_PLATFORMS = Object.keys(adapters) as PlatformId[];

export function adapterFor(platform: string): PlatformAdapter {
  const a = adapters[platform as PlatformId];
  if (!a) throw new PlatformError(`Unknown platform: ${platform}`);
  return a;
}

export function oauthRedirectUri(platform: string): string {
  return `${env.appUrl()}/api/oauth/${platform}/callback`;
}

export function isSimulatedToken(accessTokenEnc: string | null): boolean {
  return !accessTokenEnc || accessTokenEnc.startsWith("sim.");
}

export function simulatedPublish(platform: PlatformId): PublishResult {
  return { platformPostId: `sim_${platform}_${randomToken(8)}`, url: null };
}
