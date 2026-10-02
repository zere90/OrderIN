import {
  admin,
  checked,
  HttpError,
  json,
  secret,
  serve,
} from "../_shared/meta.ts";
import { decryptToken, encryptToken, hash } from "../_shared/crypto.ts";
import { processAiJobs } from "../_shared/jobs.ts";
serve(async (req) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  const supplied = req.headers.get("authorization")?.replace(/^Bearer /, "") ||
    "";
  if (await hash(supplied) !== await hash(secret("META_CRON_SECRET"))) {
    throw new HttpError(401, "unauthorized");
  }
  const db = admin();
  await checked(
    db.from("meta_oauth_states").delete().lt(
      "expires_at",
      new Date().toISOString(),
    ),
  );
  await checked(
    db.from("channels").update({ status: "expired" }).lte(
      "token_expires_at",
      new Date().toISOString(),
    ).eq("status", "connected"),
  );
  // Refresh Instagram tokens only after their first 24 hours, while still valid.
  const channels = await checked(db.rpc("claim_meta_refresh"));
  let refreshed = 0;
  for (const ch of channels || []) {
    try {
      const context = `${ch.business_id}:instagram:${ch.external_id}`;
      const key = secret("META_TOKEN_ENCRYPTION_KEY");
      const token = await decryptToken(ch.token_encrypted, key, context);
      const url = new URL("https://graph.instagram.com/refresh_access_token");
      url.search = new URLSearchParams({
        grant_type: "ig_refresh_token",
        access_token: token,
      }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      const next = await response.json();
      if (
        typeof next.access_token !== "string" ||
        !Number.isFinite(next.expires_in) || next.expires_in <= 0
      ) continue;
      await checked(
        db.from("channels").update({
          token_encrypted: await encryptToken(next.access_token, key, context),
          token_expires_at: new Date(Date.now() + next.expires_in * 1000)
            .toISOString(),
          token_updated_at: new Date().toISOString(),
          refresh_locked_until: null,
        }).eq("id", ch.id).eq("token_updated_at", ch.token_updated_at),
      );
      refreshed++;
    } catch {
      /* retain the valid token, retry next schedule; never log token responses */
    }
  }
  await processAiJobs();
  return json({ refreshed });
});
