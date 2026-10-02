const assert = require("node:assert/strict");
const Module = require("node:module");
const ts = require("typescript");
const fs = require("node:fs");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const storage = new Map();
let calls = 0;
let fail = false;
let hang = false;
let lastBody;
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === "@react-native-async-storage/async-storage") {
    return {
      getItem: async (k) => storage.get(k) || null,
      setItem: async (k, v) => storage.set(k, v),
      removeItem: async (k) => storage.delete(k),
    };
  }
  if (name === "@supabase/supabase-js") {
    return {
      createClient: () => ({
        auth: {
          getSession: async () => ({
            data: { session: { user: { id: "device" } } },
          }),
        },
        functions: {
          invoke: async (_name, options) => {
            calls++;
            lastBody = options.body;
            if (hang) return new Promise(() => {});
            return fail ? { error: Error("network") } : {
              data: {
                type: "order",
                items: [{ productId: "p", qty: 2 }],
                confidence: 0.95,
              },
            };
          },
        },
      }),
    };
  }
  return load.call(this, name, ...args);
};
global.window = {};
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "public-test";
const { SupabaseAiService, useAiStatus } = require(
  "../src/services/supabaseAi.ts",
);
const products = [{
  id: "p",
  name: "Латте",
  price: 1200,
  keywords: ["латте"],
  stock: 10,
  unit: "шт",
  category: "product",
}];
(async () => {
  const service = new SupabaseAiService();
  const context = { businessId: "a", businessType: "kofe", messageId: "m" };
  const results = await Promise.all([
    service.analyzeMessage("Два латте", products, context),
    service.analyzeMessage("Два латте", products, context),
  ]);
  assert.equal(calls, 1);
  assert.equal(results[0], results[1]);
  assert.equal(lastBody.products[0].id, "p");
  await new SupabaseAiService().analyzeMessage("Два латте", products, context);
  assert.equal(calls, 1);
  await service.analyzeMessage("Два латте", products, {
    ...context,
    businessId: "b",
  });
  assert.equal(calls, 2);
  fail = true;
  const fallback = await service.analyzeMessage("Хочу два латте", products, {
    ...context,
    messageId: "failed",
  });
  assert.equal(fallback.demo, true);
  assert.equal(useAiStatus.getState().error, true);
  const count = calls;
  await service.analyzeMessage("Хочу два латте", products, {
    ...context,
    messageId: "failed",
  });
  assert.equal(calls, count);
  hang = true;
  const timeout = global.setTimeout;
  global.setTimeout = (fn, ms, ...args) =>
    timeout(fn, ms === 15000 ? 5 : ms, ...args);
  const timed = await service.request(
    { task: "draft_reply" },
    async () => ({ fallback: true }),
  );
  assert.equal(timed.fallback, true);
  assert.equal(useAiStatus.getState().busy, 0);
  global.setTimeout = timeout;
  console.log(
    "Passed: remote success, concurrent and persisted cache, business isolation, failure fallback, 15-second deadline, demo/error state.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
