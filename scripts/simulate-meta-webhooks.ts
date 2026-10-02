import { instagramPayload, whatsappPayload } from "./meta-webhook-fixtures.ts";
const target = Deno.env.get("WEBHOOK_URL") ||
  "http://127.0.0.1:54321/functions/v1/meta-webhook";
// Deliberately local-only: this script must not inject fake customers into production.
const url = new URL(target);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw Error("Use a local webhook URL");
}
const secret = Deno.env.get("META_APP_SECRET");
if (!secret) throw Error("Set local META_APP_SECRET");
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const suffix = Deno.env.get("TEST_MESSAGE_ID") || "qazyna-simulation";
const payloads = [
  whatsappPayload(
    Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "test-phone",
    `wamid.${suffix}`,
  ),
  instagramPayload(
    Deno.env.get("INSTAGRAM_TEST_ACCOUNT_ID") || "test-instagram",
    `mid.${suffix}`,
  ),
];
for (const payload of payloads) {
  const raw = JSON.stringify(payload);
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(raw),
  );
  const signature = "sha256=" +
    Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0"))
      .join("");
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": signature,
      },
      body: raw,
    });
    console.log(
      `${payload.object} delivery ${attempt + 1}: HTTP ${response.status}`,
    );
    if (!response.ok) Deno.exitCode = 1;
  }
}
