import { createHandler } from "./handler.ts";
import { inputSchema, validateOutput } from "./schemas.ts";
import { createProvider } from "./provider.ts";
const assert = (v: unknown) => {
  if (!v) throw Error("assertion failed");
};
const input = {
  task: "analyze_message" as const,
  text: "Два латте",
  businessType: "kofe",
  products: [{ id: "latte", name: "Латте", price: 1200, variants: [] }],
};
const output = {
  type: "order",
  language: "ru",
  items: [{ productId: "latte", name: "Латте", qty: 2 }],
  confidence: 0.9,
  missing: [],
};
const request = (body: unknown = input, device = "device") =>
  new Request("http://local/ai", {
    method: "POST",
    headers: { authorization: "Bearer test", "x-device-id": device },
    body: JSON.stringify(body),
  });
Deno.test("reject missing auth and spoofed device before provider", async () => {
  let calls = 0;
  const h = createHandler({
    authenticate: async () => "device",
    rateLimit: async () => true,
    provider: () => {
      calls++;
      throw Error();
    },
    log: () => {},
  });
  assert(
    (await h(new Request("http://local", { method: "POST" }))).status === 401,
  );
  assert((await h(request(input, "spoof"))).status === 401);
  assert(calls === 0);
});
Deno.test("60 calls allowed, 61st denied; no body in logs", async () => {
  let count = 0;
  const logs: unknown[] = [];
  const h = createHandler({
    authenticate: async () => "device",
    rateLimit: async () => ++count <= 60,
    provider: () => ({
      generate: async () => ({
        text: JSON.stringify(output),
        inputTokens: 10,
        outputTokens: 20,
      }),
    }),
    log: (r) => logs.push(r),
  });
  for (let i = 0; i < 60; i++) assert((await h(request())).status === 200);
  assert((await h(request())).status === 429);
  assert(!JSON.stringify(logs).includes("латте"));
  assert(Object.keys(logs[0] as object).length === 4);
});
Deno.test("malformed output retries once then other", async () => {
  let calls = 0;
  const h = createHandler({
    authenticate: async () => "device",
    rateLimit: async () => true,
    provider: () => ({
      generate: async () => {
        calls++;
        return { text: "bad", inputTokens: 1, outputTokens: 1 };
      },
    }),
    log: () => {},
  });
  assert((await (await h(request())).json()).type === "other");
  assert(calls === 2);
});
Deno.test("input limits and exact catalog validation", () => {
  assert(!inputSchema.safeParse({ ...input, text: "x".repeat(2001) }).success);
  assert(
    !inputSchema.safeParse({
      task: "draft_reply",
      businessType: "kofe",
      shopName: "Cafe",
      tone: "nice",
      history: Array(11).fill({ role: "customer", text: "Hi" }),
    }).success,
  );
  let rejected = false;
  try {
    validateOutput(input, {
      ...output,
      items: [{ productId: "fake", name: "Pizza", qty: 1 }],
    });
  } catch {
    rejected = true;
  }
  assert(rejected);
});
Deno.test("campaign rejects invented numbers and injects computed price", () => {
  const campaign = inputSchema.parse({
    task: "write_campaign",
    opportunity: {
      type: "combo",
      title: "Combo",
      price: 2500,
      expectedRevenue: 10000,
      recipientCount: 4,
      draft: "Combo",
    },
    customerName: "Ali",
    language: "en",
  });
  let rejected = false;
  try {
    validateOutput(campaign, { message: "50% discount!" });
  } catch {
    rejected = true;
  }
  assert(rejected);
  assert(
    JSON.stringify(
      validateOutput(campaign, { message: "Hello! Combo for {{price}} ₸." }),
    ).includes("2 500"),
  );
});
Deno.test("provider failure is sanitized", async () => {
  const h = createHandler({
    authenticate: async () => "device",
    rateLimit: async () => true,
    provider: () => ({
      generate: async () => {
        throw Error("secret customer content");
      },
    }),
    log: () => {},
  });
  const r = await h(request());
  assert(r.status === 503);
  assert(!(await r.text()).includes("secret"));
});
Deno.test("both adapters send image securely and normalize usage", async () => {
  for (const provider of ["gemini", "anthropic"]) {
    let payload = "";
    const p = createProvider(
      (n) => ({
        AI_PROVIDER: provider,
        GEMINI_API_KEY: "test",
        ANTHROPIC_API_KEY: "test",
      }[n]),
      ((_url, init) => {
        payload = String(init?.body);
        return Promise.resolve(
          new Response(JSON.stringify(
            provider === "gemini"
              ? {
                candidates: [{ content: { parts: [{ text: "{}" }] } }],
                usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4 },
              }
              : {
                content: [{ type: "text", text: "{}" }],
                usage: { input_tokens: 3, output_tokens: 4 },
              },
          )),
        );
      }) as typeof fetch,
    );
    const r = await p.generate(
      inputSchema.parse({
        task: "read_invoice",
        image: "/9j/test",
        mimeType: "image/jpeg",
        products: [],
      }),
      new AbortController().signal,
      false,
    );
    assert(r.inputTokens === 3 && r.outputTokens === 4);
    assert(payload.includes("/9j/test"));
  }
});

Deno.test("invoice and mapping reject bad catalog, invalid quantities, duplicate columns", () => {
  const invoice = inputSchema.parse({
    task: "read_invoice",
    image: "/9j/test",
    mimeType: "image/jpeg",
    products: input.products,
  });
  for (
    const row of [{
      name: "Fake",
      productId: "fake",
      qty: 1,
      price: 2,
      unit: "шт",
      confidence: 1,
    }, { name: "Латте", qty: -1, price: 2, unit: "шт", confidence: 1 }]
  ) {
    let failed = false;
    try {
      validateOutput(invoice, { rows: [row] });
    } catch {
      failed = true;
    }
    assert(failed);
  }
  const mapping = inputSchema.parse({
    task: "map_excel_columns",
    headers: ["name", "qty", "price"],
    sampleRows: [],
  });
  let failed = false;
  try {
    validateOutput(mapping, {
      mapping: { name: 0, qty: 0, price: 2, sku: -1, size: -1, color: -1 },
      confidence: 1,
    });
  } catch {
    failed = true;
  }
  assert(failed);
  assert(
    !!validateOutput(mapping, {
      mapping: { name: 0, qty: 1, price: 2, sku: -1, size: -1, color: -1 },
      confidence: 0.8,
    }),
  );
});
Deno.test("valid repair succeeds and invalid input never calls provider", async () => {
  let calls = 0;
  const h = createHandler({
    authenticate: async () => "device",
    rateLimit: async () => true,
    provider: () => ({
      generate: async () => ({
        text: ++calls === 1 ? "bad" : JSON.stringify(output),
        inputTokens: 1,
        outputTokens: 1,
      }),
    }),
    log: () => {},
  });
  assert(
    (await h(request({ ...input, text: "x".repeat(2001) }))).status === 400,
  );
  assert(calls === 0);
  assert((await (await h(request())).json()).type === "order");
  assert(calls === 2);
});
