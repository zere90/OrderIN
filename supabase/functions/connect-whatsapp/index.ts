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
import { encryptToken } from "../_shared/crypto.ts";
// TODO: Embedded Signup with coexistence: validate the Meta code server-side,
// exchange it, inspect granted WABA/phone assets, subscribe the WABA, then persist
// through this interface. Never accept a browser-provided access token as proof.
export interface EmbeddedSignupConnection {
  businessId: string;
  code: string;
  phoneNumberId: string;
  wabaId: string;
  coexistence: boolean;
}
const schema = z.object({ businessId: z.uuid() }).strict();
serve(async (req) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  const seller = await user(req);
  // Shared test-number secrets must never be claimable by an arbitrary anonymous installation.
  if (seller.id !== secret("WHATSAPP_DEV_SELLER_ID")) {
    throw new HttpError(403, "dev_seller_only");
  }
  const parsed = schema.safeParse(await body(req));
  if (!parsed.success) throw new HttpError(400, "invalid_input");
  const { businessId } = parsed.data;
  await owns(businessId, seller.id);
  const external = secret("WHATSAPP_PHONE_NUMBER_ID"),
    waba = secret("WHATSAPP_WABA_ID"),
    token = secret("WHATSAPP_TOKEN");
  const debug = await graph(
    `debug_token?input_token=${encodeURIComponent(token)}`,
    `${secret("META_APP_ID")}|${secret("META_APP_SECRET")}`,
  );
  if (
    debug.data?.is_valid !== true ||
    String(debug.data?.app_id) !== secret("META_APP_ID")
  ) throw new HttpError(400, "wrong_meta_app");
  const db = admin();
  const existing = await checked(
    db.from("channels").select("business_id").eq("type", "whatsapp").eq(
      "external_id",
      external,
    ).maybeSingle(),
  );
  if (existing && existing.business_id !== businessId) {
    throw new HttpError(409, "already_connected");
  }
  const phones = await graph(
    `${
      encodeURIComponent(waba)
    }/phone_numbers?fields=id,display_phone_number,verified_name`,
    token,
  );
  const phone = phones.data?.find((p: { id: string }) => p.id === external);
  if (!phone) throw new HttpError(400, "phone_not_in_waba");
  await graph(`${encodeURIComponent(waba)}/subscribed_apps`, token, {
    method: "POST",
    data: {},
  });
  const expiry = Deno.env.get("WHATSAPP_TOKEN_EXPIRES_AT");
  if (
    expiry &&
    (!Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) <= Date.now())
  ) throw new HttpError(400, "token_expired");
  const channel = await checked(
    db.from("channels").upsert({
      business_id: businessId,
      type: "whatsapp",
      external_id: external,
      display_name: phone.display_phone_number || phone.verified_name ||
        external,
      status: "connected",
      token_encrypted: await encryptToken(
        token,
        secret("META_TOKEN_ENCRYPTION_KEY"),
        `${businessId}:whatsapp:${external}`,
      ),
      token_expires_at: expiry || null,
      waba_id: waba,
      token_updated_at: new Date().toISOString(),
    }, { onConflict: "business_id,type" }).select(channelColumns).single(),
  );
  return json({ channel, mode: "development" });
});
