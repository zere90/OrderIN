import { inputSchema, other, validateOutput } from "./schemas.ts";
import type { Provider } from "./provider.ts";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-device-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
export interface Dependencies {
  authenticate(token: string): Promise<string | null>;
  rateLimit(deviceId: string): Promise<boolean>;
  provider(): Provider;
  log(
    record: {
      task: string;
      inputTokens: number;
      outputTokens: number;
      latency: number;
    },
  ): void;
}
async function readBody(req: Request) {
  if (Number(req.headers.get("content-length")) > 4_100_000) {
    throw Error("size");
  }
  const reader = req.body?.getReader();
  if (!reader) throw Error("body");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 4_100_000) {
      await reader.cancel();
      throw Error("size");
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    joined.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder().decode(joined));
}
export function createHandler(deps: Dependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    try {
      const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)
        ?.[1];
      if (!token) return json({ error: "unauthorized" }, 401);
      const device = await deps.authenticate(token);
      if (!device || req.headers.get("x-device-id") !== device) {
        return json({ error: "unauthorized" }, 401);
      }
      if (!await deps.rateLimit(device)) {
        return json({ error: "rate_limit" }, 429);
      }
      let input;
      try {
        input = inputSchema.parse(await readBody(req));
      } catch {
        return json({ error: "invalid_input" }, 400);
      }
      const start = Date.now();
      let inputTokens = 0, outputTokens = 0;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 13000);
      try {
        const provider = deps.provider();
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await provider.generate(
            input,
            controller.signal,
            attempt > 0,
          );
          inputTokens += result.inputTokens;
          outputTokens += result.outputTokens;
          try {
            return json(validateOutput(input, JSON.parse(result.text)));
          } catch { /* one schema repair, no customer content in logs */ }
        }
        return input.task === "analyze_message"
          ? json(other)
          : json({ error: "invalid_output" }, 502);
      } catch {
        return json({ error: "ai_unavailable" }, 503);
      } finally {
        clearTimeout(timer);
        deps.log({
          task: input.task,
          inputTokens,
          outputTokens,
          latency: Date.now() - start,
        });
      }
    } catch {
      return json({ error: "unavailable" }, 503);
    }
  };
}
