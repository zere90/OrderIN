const assert = require("node:assert/strict");
const Module = require("node:module");
const ts = require("typescript");
const fs = require("node:fs");
// Transpile app TypeScript for Node; native storage is replaced only at the test boundary.
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const storage = new Map();
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === "@react-native-async-storage/async-storage")
    return {
      getItem: async (k) => storage.get(k) || null,
      setItem: async (k, v) => {
        storage.set(k, v);
      },
      removeItem: async (k) => {
        storage.delete(k);
      },
    };
  return load.call(this, name, ...args);
};
const { parseMessage, aiService } = require("../src/services/ai.ts");
const { useStore, validateOrder } = require("../src/store/index.ts");
const { localDate } = require("../src/data/mock.ts");
async function main() {
  const now = new Date(2026, 8, 29, 12);
  for (const [text, product, qty] of [
    ["Ертең екі медовик керек. Мекенжай: Мәңгілік Ел 25", "honey", 2],
    ["Закажу 6 капкейков на завтра. Адрес: Туран 12", "cupcake", 6],
    [
      "Please order two chocolate cakes for tomorrow. Address: 10 Turan",
      "choco",
      2,
    ],
  ]) {
    const a = parseMessage(text, now);
    assert.equal(a.type, "order");
    assert.equal(a.items[0].productId, product);
    assert.equal(a.items[0].qty, qty);
    assert.equal(a.date, "2026-09-30");
    assert.ok(a.address);
  }
  assert.equal(parseMessage("Спасибо за медовик!").type, "feedback");
  assert.equal(parseMessage("Есть ли орехи в чизкейке?").type, "question");
  assert.equal(
    parseMessage("Закажу медовик на 03.10.2026", now).date,
    "2026-10-03",
  );
  assert.equal(
    parseMessage("Order 1 honey cake 2026-10-05", now).date,
    "2026-10-05",
  );
  assert.equal(
    parseMessage("Закажу 1 медовик завтра", new Date(2026, 11, 31)).date,
    "2027-01-01",
  );
  const started = Date.now();
  await aiService.analyzeMessage("Order 1 honey cake");
  assert.ok(Date.now() - started >= 550);
  const s = () => useStore.getState();
  s().reset();
  const draft = s().orders[0];
  const before = s().products.find((p) => p.id === "honey").stock;
  s().edit(draft.id, { items: [{ productId: "honey", qty: 999 }] });
  await assert.rejects(s().confirm(draft.id));
  s().edit(draft.id, { items: [{ productId: "honey", qty: 0 }] });
  await assert.rejects(s().confirm(draft.id));
  s().edit(draft.id, {
    items: [{ productId: "honey", qty: 2 }],
    date: "2026-02-31",
  });
  await assert.rejects(s().confirm(draft.id));
  s().edit(draft.id, { date: "2026-10-01" });
  await Promise.all([s().confirm(draft.id), s().confirm(draft.id)]);
  assert.equal(s().orders[0].status, "awaiting_payment");
  assert.equal(s().messages.filter((m) => m.role === "bot").length, 1);
  assert.equal(s().products.find((p) => p.id === "honey").stock, before);
  await Promise.all([s().pay(draft.id), s().pay(draft.id)]);
  await s().pay(draft.id);
  assert.equal(s().orders[0].status, "paid");
  assert.equal(s().products.find((p) => p.id === "honey").stock, before - 2);
  assert.equal(localDate(new Date(s().orders[0].paidAt)), localDate());
  s().finish(draft.id);
  assert.equal(s().orders[0].status, "completed");
  s().cancel(draft.id);
  assert.equal(s().orders[0].status, "completed");
  s().reset();
  await s().confirm(draft.id);
  s().stock("honey", -5);
  await assert.rejects(s().pay(draft.id));
  assert.equal(s().orders[0].status, "awaiting_payment");
  s().reset();
  const confirming = s().confirm(draft.id);
  s().reset();
  await confirming;
  assert.equal(s().orders[0].status, "draft");
  const count = s().messages.length;
  await s().reply("chat-0", "Спасибо!");
  assert.equal(s().messages.length, count + 1);
  await s().analyze(s().messages[0]);
  assert.equal(s().orders.filter((o) => o.messageId === "m0").length, 1);
  assert.throws(() =>
    validateOrder(
      {
        ...draft,
        items: [
          { productId: "honey", qty: 4 },
          { productId: "honey", qty: 4 },
        ],
      },
      s().products,
    ),
  );
  s().stock("honey", -999);
  assert.equal(s().products.find((p) => p.id === "honey").stock, 0);
  await new Promise((r) => setTimeout(r, 0));
  assert.ok(storage.get("qazyna-demo-v1"));
  s().reset();
  console.log(
    "Passed: multilingual parsing, dates, delay, stock validation, lifecycle, duplicate payment, reset races, messaging, persistence.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
