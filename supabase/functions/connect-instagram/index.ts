import { z } from "zod";
import {
  admin,
  body,
  channelColumns,
  checked,
  graph,
  HttpError,
  json,
  owns,
  secret,
  serve,
  user,
} from "../_shared/meta.ts";
import { encryptToken, hash } from "../_shared/crypto.ts";
const callback = () =>
  `${secret("SUPABASE_URL")}/functions/v1/connect-instagram`;
async function exchange(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(502, "oauth_failed");
  return response.json();
}
serve(async (req) => {
  const db = admin();
  if (req.method === "POST") {
    const seller = await user(req);
    const parsed = z.object({
      businessId: z.uuid(),
      redirectUri: z.string().max(500),
    }).strict().safeParse(await body(req));
    if (!parsed.success) throw new HttpError(400, "invalid_input");
    const { businessId, redirectUri } = parsed.data;
    await owns(businessId, seller.id);
    const allowed = secret("META_REDIRECT_URIS").split(",").map((s) =>
      s.trim()
    );
    if (!allowed.includes(redirectUri)) {
      throw new HttpError(400, "redirect_not_allowed");
    }
    const state = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (x) => x.toString(16).padStart(2, "0"),
    ).join("");
    await checked(
      db.from("meta_oauth_states").insert({
        state_hash: await hash(state),
        seller_id: seller.id,
        business_id: businessId,
        redirect_uri: redirectUri,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      }),
    );
    const url = new URL("https://www.instagram.com/oauth/authorize");
    url.search = new URLSearchParams({
      client_id: secret("INSTAGRAM_APP_ID"),
      redirect_uri: callback(),
      response_type: "code",
      scope: "instagram_business_basic,instagram_business_manage_messages",
      state,
      enable_fb_login: "0",
      force_authentication: "1",
    }).toString();
    return json({ url: url.toString() });
  }
  if (req.method !== "GET") throw new HttpError(405, "method");
  const q = new URL(req.url).searchParams;
  const state = q.get("state");
  if (!state || !/^[a-f0-9]{64}$/.test(state)) {
    throw new HttpError(400, "invalid_state");
  }
  const record = await checked(
    db.from("meta_oauth_states").delete().eq("state_hash", await hash(state))
      .gt("expires_at", new Date().toISOString()).select("*").maybeSingle(),
  );
  if (!record) throw new HttpError(400, "invalid_state");
  const finish = (result: string) => {
    const url = new URL(record.redirect_uri);
    url.searchParams.set("meta", result);
    return new Response(null, {
      status: 302,
      headers: {
        location: url.toString(),
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  };
  if (q.get("error")) return finish("cancelled");
  const code = q.get("code");
  if (!code || code.length > 4000) return finish("failed");
  try {
    await owns(record.business_id, record.seller_id);
    const short = await exchange(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: secret("INSTAGRAM_APP_ID"),
          client_secret: secret("INSTAGRAM_APP_SECRET"),
          grant_type: "authorization_code",
          redirect_uri: callback(),
          code,
        }),
      },
    );
    const shortToken = short.access_token || short.data?.[0]?.access_token;
    if (typeof shortToken !== "string") throw Error("oauth");
    const url = new URL("https://graph.instagram.com/access_token");
    url.search = new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: secret("INSTAGRAM_APP_SECRET"),
      access_token: shortToken,
    }).toString();
    const long = await exchange(url.toString());
    if (
      typeof long.access_token !== "string" ||
      !Number.isFinite(long.expires_in) || long.expires_in <= 0
    ) throw Error("oauth");
    const profile = await graph(
      "me?fields=user_id,username",
      long.access_token,
      { instagram: true },
    );
    const external = String(profile.user_id || profile.id || "");
    if (!external || !/^\d+$/.test(external)) throw Error("profile");
    const existing = await checked(
      db.from("channels").select("business_id").eq("type", "instagram").eq(
        "external_id",
        external,
      ).maybeSingle(),
    );
    if (existing && existing.business_id !== record.business_id) {
      throw Error("already connected");
    }
    const subscription = await graph(
      `${external}/subscribed_apps`,
      long.access_token,
      {
        instagram: true,
        method: "POST",
        data: {
          subscribed_fields:
            "messages,messaging_postbacks,messaging_seen,message_reactions",
        },
      },
    );
    if (subscription.success !== true) throw Error("subscribe");
    await checked(
      db.from("channels").upsert({
        business_id: record.business_id,
        type: "instagram",
        external_id: external,
        display_name: profile.username || external,
        status: "connected",
        token_encrypted: await encryptToken(
          long.access_token,
          secret("META_TOKEN_ENCRYPTION_KEY"),
          `${record.business_id}:instagram:${external}`,
        ),
        token_expires_at: new Date(Date.now() + long.expires_in * 1000)
          .toISOString(),
        token_updated_at: new Date().toISOString(),
      }, { onConflict: "business_id,type" }).select(channelColumns).single(),
    );
    return finish("connected");
  } catch {
    return finish("failed");
  }
});
