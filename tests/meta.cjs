const assert = require("node:assert/strict"),
  Module = require("node:module"),
  ts = require("typescript"),
  fs = require("node:fs");
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
let responseStatus = "sent";
let fail = false;
const ids = [];
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
            data: { session: { user: { id: "seller" } } },
          }),
        },
        functions: {
          invoke: async (_name, { body }) => {
            calls++;
            ids.push(body.requestId);
            if (fail) throw Error("sensitive raw provider error");
            return {
              data: {
                message: {
                  id: "message",
                  conversation_id: body.conversationId,
                  text: body.text,
                  sent_at: new Date().toISOString(),
                  status: responseStatus,
                },
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
const { SupabaseMessagingService } = require(
  "../src/services/remoteMessaging.ts",
);
const { serviceWindowOpen, MessagingError } = require(
  "../src/services/metaApi.ts",
);
(async () => {
  const service = new SupabaseMessagingService();
  await Promise.all([
    service.send("chat", "Привет"),
    service.send("chat", "Привет"),
  ]);
  assert.equal(calls, 1);
  assert.equal(storage.size, 0);
  fail = true;
  await assert.rejects(
    service.send("chat", "Проверка"),
    (e) => e instanceof MessagingError && !e.message.includes("sensitive"),
  );
  assert.equal(storage.size, 1);
  const pendingId = ids.at(-1);
  await assert.rejects(
    service.send("chat", "Другой текст"),
    (e) => e.code === "send_unknown",
  );
  assert.equal(calls, 2);
  fail = false;
  responseStatus = "unknown";
  await assert.rejects(
    new SupabaseMessagingService().send("chat", "Проверка"),
    (e) => e.code === "send_unknown",
  );
  assert.equal(ids.at(-1), pendingId);
  assert.equal(storage.size, 1);
  responseStatus = "read";
  await service.send("chat", "Проверка");
  assert.equal(ids.at(-1), pendingId);
  assert.equal(storage.size, 0);
  responseStatus = "failed";
  await assert.rejects(
    service.send("chat", "Ошибка"),
    (e) => e.code === "send_failed",
  );
  assert.equal(storage.size, 0);
  const now = Date.now();
  assert(serviceWindowOpen(new Date(now - 1000).toISOString(), now));
  assert(!serviceWindowOpen(new Date(now - 86400000).toISOString(), now));
  assert(!serviceWindowOpen(null, now));
  console.log(
    "Passed: messaging concurrent-send lock, durable retry IDs, ambiguous send protection, sanitized real errors (no mock success), terminal failure cleanup, 24-hour boundary.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
