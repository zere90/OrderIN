import { HttpError, json, limitedBody } from "../_shared/meta.ts";
import { verifySignature } from "../_shared/crypto.ts";
import {
  type MetaEvent,
  parseEvents,
  type StatusEvent,
} from "../_shared/events.ts";
export interface WebhookDependencies {
  verifyToken: string;
  metaSecret: string;
  instagramSecret?: string;
  save(
    events: { messages: MetaEvent[]; statuses: StatusEvent[] },
  ): Promise<void>;
  process(): Promise<void>;
  waitUntil(work: Promise<void>): void;
}
export function createMetaWebhook(deps: WebhookDependencies) {
  return async (req: Request) => {
    if (req.method === "GET") {
      const q = new URL(req.url).searchParams;
      if (
        q.get("hub.mode") !== "subscribe" ||
        q.get("hub.verify_token") !== deps.verifyToken
      ) throw new HttpError(403, "verification_failed");
      return new Response(q.get("hub.challenge") || "", {
        headers: { "content-type": "text/plain" },
      });
    }
    if (req.method !== "POST") throw new HttpError(405, "method");
    const raw = await limitedBody(req, 1_000_000);
    const signature = req.headers.get("x-hub-signature-256");
    const metaValid = await verifySignature(raw, signature, deps.metaSecret);
    const instagramValid = !metaValid && deps.instagramSecret
      ? await verifySignature(raw, signature, deps.instagramSecret)
      : false;
    if (!metaValid && !instagramValid) {
      throw new HttpError(401, "invalid_signature");
    }
    let events;
    try {
      const payload = JSON.parse(new TextDecoder().decode(raw));
      if (!metaValid && payload.object !== "instagram") {
        throw new HttpError(401, "invalid_signature");
      }
      events = parseEvents(payload);
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(400, "invalid_payload");
    }
    await deps.save(events); // durable commit; fail with 5xx so Meta retries if storage is unavailable
    deps.waitUntil(deps.process().catch(() => {}));
    return json({ received: true });
  };
}
