import { admin, checked, secret, serve } from "../_shared/meta.ts";
import { processAiJobs } from "../_shared/jobs.ts";
import { createMetaWebhook } from "./handler.ts";
declare const EdgeRuntime: { waitUntil(work: Promise<void>): void };
serve(createMetaWebhook({
  verifyToken: secret("META_VERIFY_TOKEN"),
  metaSecret: secret("META_APP_SECRET"),
  instagramSecret: Deno.env.get("INSTAGRAM_APP_SECRET"),
  async save(events) {
    await checked(
      admin().rpc("ingest_meta_events", {
        p_messages: events.messages,
        p_statuses: events.statuses,
      }),
    );
  },
  process: processAiJobs,
  waitUntil: (work) => EdgeRuntime.waitUntil(work),
}));
