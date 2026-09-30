import { admin, checked } from "./meta.ts";
import { inputSchema, other, validateOutput } from "../ai/schemas.ts";
import { createProvider } from "../ai/provider.ts";
// Reuse the same task schema/prompts/provider as the authenticated ai endpoint.
// Durable queue + leases lets scheduled maintenance recover after Edge shutdown.
export async function processAiJobs() {
  const db = admin();
  const jobs = await checked(db.rpc("claim_meta_ai_jobs"));
  await Promise.all(
    (jobs || []).map(async (job: { message_id: string; attempts: number }) => {
      const start = Date.now();
      let inputTokens = 0, outputTokens = 0;
      try {
        const m = await checked(
          db.from("messages").select("id,text,business_id,sent_at").eq(
            "id",
            job.message_id,
          ).single(),
        );
        if (!m) throw Error("missing message");
        const b = await checked(
          db.from("businesses").select("type,products,seller_id").eq(
            "id",
            m.business_id,
          ).single(),
        );
        if (!b) throw Error("missing business");
        const permitted = await checked(
          db.rpc("take_ai_request", { p_device_id: b.seller_id }),
        );
        if (!permitted) {
          await checked(
            db.from("meta_ai_jobs").update({
              attempts: job.attempts - 1,
              available_at: new Date(Date.now() + 60000).toISOString(),
              locked_until: null,
            }).eq("message_id", job.message_id),
          );
          return;
        }
        const input = inputSchema.parse({
          task: "analyze_message",
          text: m.text,
          businessType: b.type,
          products: b.products,
          today: m.sent_at.slice(0, 10),
        });
        const provider = createProvider();
        let parsed: unknown = other;
        const signal = AbortSignal.timeout(13000);
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await provider.generate(input, signal, attempt > 0);
          inputTokens += result.inputTokens;
          outputTokens += result.outputTokens;
          try {
            parsed = validateOutput(input, JSON.parse(result.text));
            break;
          } catch { /* retry once */ }
        }
        const analysis = parsed as { type: string; confidence: number };
        if (analysis.type === "order") {
          await checked(
            db.from("order_drafts").upsert({
              message_id: m.id,
              business_id: m.business_id,
              parsed,
              confidence: analysis.confidence,
            }, { onConflict: "message_id", ignoreDuplicates: true }),
          );
        }
        await checked(
          db.from("meta_ai_jobs").update({ done: true, locked_until: null }).eq(
            "message_id",
            m.id,
          ),
        );
      } catch {
        await db.from("meta_ai_jobs").update({
          available_at: new Date(Date.now() + 60000 * Math.min(job.attempts, 5))
            .toISOString(),
          locked_until: null,
        }).eq("message_id", job.message_id);
      } finally {
        console.log(
          JSON.stringify({
            task: "analyze_message",
            inputTokens,
            outputTokens,
            latency: Date.now() - start,
          }),
        );
      }
    }),
  );
}
