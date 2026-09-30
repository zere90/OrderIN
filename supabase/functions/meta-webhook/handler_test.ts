import {
  decryptToken,
  encryptToken,
  verifySignature,
} from "../_shared/crypto.ts";
import { inWindow, parseEvents } from "../_shared/events.ts";
import { approvedTemplates } from "../_shared/templates.ts";
import { createMetaWebhook } from "./handler.ts";
import { HttpError } from "../_shared/meta.ts";
import {
  instagramPayload,
  whatsappPayload,
} from "../../../scripts/meta-webhook-fixtures.ts";
const assert = (x: unknown) => {
  if (!x) throw Error("assertion failed");
};
async function sign(body: string, secret = "test-secret") {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return "sha256=" +
    Array.from(
      new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
      ),
      (v) => v.toString(16).padStart(2, "0"),
    ).join("");
}
const raw = JSON.stringify(whatsappPayload());
Deno.test("raw body HMAC rejects mutations, missing and malformed signatures", async () => {
  const signature = await sign(raw);
  assert(
    await verifySignature(
      new TextEncoder().encode(raw),
      signature,
      "test-secret",
    ),
  );
  assert(
    !await verifySignature(
      new TextEncoder().encode(raw + " "),
      signature,
      "test-secret",
    ),
  );
  assert(
    !await verifySignature(new TextEncoder().encode(raw), null, "test-secret"),
  );
  assert(
    !await verifySignature(
      new TextEncoder().encode(raw),
      "sha256=ff",
      "test-secret",
    ),
  );
});
Deno.test("AES-GCM authenticates ciphertext and channel context", async () => {
  const key = btoa("a".repeat(32));
  const token = await encryptToken(
    "private-token",
    key,
    "business:instagram:123",
  );
  assert(!token.includes("private-token"));
  assert(
    await decryptToken(token, key, "business:instagram:123") ===
      "private-token",
  );
  for (const context of ["other-business", "business:instagram:124"]) {
    let failed = false;
    try {
      await decryptToken(token, key, context);
    } catch {
      failed = true;
    }
    assert(failed);
  }
});
Deno.test("WhatsApp and Instagram fixtures parse correct accounts and inbound identities", () => {
  const w = parseEvents(whatsappPayload()).messages[0];
  const i = parseEvents(instagramPayload()).messages[0];
  assert(
    w.channel === "whatsapp" && w.account === "test-phone" &&
      w.direction === "in",
  );
  assert(i.channel === "instagram" && i.user === "test-customer");
  assert(w.external.startsWith("whatsapp:"));
});
Deno.test("Instagram echoes are outgoing and do not reopen customer window", () => {
  const payload = instagramPayload();
  payload.entry[0].messaging[0].sender.id = "test-instagram";
  payload.entry[0].messaging[0].recipient.id = "customer";
  const e = parseEvents(payload).messages[0];
  assert(e.direction === "out" && e.user === "customer");
});
Deno.test("24-hour boundary, future times and no inbound message", () => {
  const now = Date.now();
  assert(inWindow(new Date(now - 86399999).toISOString(), now));
  assert(!inWindow(new Date(now - 86400000).toISOString(), now));
  assert(!inWindow(new Date(now + 1).toISOString(), now));
  assert(!inWindow(null, now));
});
Deno.test("template picker exposes approved body-only templates with contiguous parameters", () => {
  const list = approvedTemplates([
    {
      status: "APPROVED",
      name: "ok",
      language: "ru",
      components: [{ type: "BODY", text: "Привет {{1}}" }],
    },
    { status: "REJECTED", name: "bad", language: "ru", components: [] },
    {
      status: "APPROVED",
      name: "header",
      language: "ru",
      components: [{ type: "HEADER", text: "x" }, { type: "BODY", text: "Hi" }],
    },
    {
      status: "APPROVED",
      name: "gap",
      language: "ru",
      components: [{ type: "BODY", text: "Hi {{2}}" }],
    },
  ]);
  assert(list.length === 1 && list[0].parameterCount === 1);
});
Deno.test("verification handshake; invalid signature never reaches storage", async () => {
  let saved = 0;
  const h = createMetaWebhook({
    verifyToken: "verify",
    metaSecret: "test-secret",
    save: async () => {
      saved++;
    },
    process: async () => {},
    waitUntil: () => {},
  });
  assert(
    await (await h(
      new Request(
        "http://local?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=42",
      ),
    )).text() === "42",
  );
  try {
    await h(new Request("http://local", { method: "POST", body: raw }));
    throw Error("accepted");
  } catch (e) {
    assert(e instanceof HttpError && e.status === 401);
  }
  assert(saved === 0);
});
Deno.test("ack waits for durable save, but never waits for AI", async () => {
  let saved = false;
  let background: Promise<void> | undefined;
  let resolve!: () => void;
  const ai = new Promise<void>((r) => resolve = r);
  const h = createMetaWebhook({
    verifyToken: "verify",
    metaSecret: "test-secret",
    save: async () => {
      saved = true;
    },
    process: () => ai,
    waitUntil: (p) => background = p,
  });
  const response = await h(
    new Request("http://local", {
      method: "POST",
      headers: { "x-hub-signature-256": await sign(raw) },
      body: raw,
    }),
  );
  assert(response.status === 200 && saved && background);
  resolve();
  await background;
});
Deno.test("database failure prevents successful acknowledgement", async () => {
  const h = createMetaWebhook({
    verifyToken: "verify",
    metaSecret: "test-secret",
    save: async () => {
      throw Error("db");
    },
    process: async () => {},
    waitUntil: () => {
      throw Error("must not run");
    },
  });
  let failed = false;
  try {
    await h(
      new Request("http://local", {
        method: "POST",
        headers: { "x-hub-signature-256": await sign(raw) },
        body: raw,
      }),
    );
  } catch {
    failed = true;
  }
  assert(failed);
});
Deno.test("Instagram app secret cannot authorize WhatsApp payloads", async () => {
  const h = createMetaWebhook({
    verifyToken: "verify",
    metaSecret: "test-secret",
    instagramSecret: "ig-secret",
    save: async () => {
      throw Error("must not save");
    },
    process: async () => {},
    waitUntil: () => {},
  });
  try {
    await h(
      new Request("http://local", {
        method: "POST",
        headers: { "x-hub-signature-256": await sign(raw, "ig-secret") },
        body: raw,
      }),
    );
    throw Error("accepted");
  } catch (e) {
    assert(e instanceof HttpError && e.status === 401);
  }
});
