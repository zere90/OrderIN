const assert = require("node:assert/strict");
const Module = require("node:module");
const ts = require("typescript");
const fs = require("node:fs");
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
      removeItem: async (k) => storage.delete(k),
    };
  return load.call(this, name, ...args);
};
const { useStore, stockFingerprint } = require("../src/store/index.ts");
const { seedBusiness, localDate } = require("../src/data/mock.ts");
const { getOpportunities } = require("../src/services/opportunities.ts");
const { importService, previewChanges } = require("../src/services/imports.ts");
const { parseMessage, aiService } = require("../src/services/ai.ts");
const {
  validateOrder,
  collectedOf,
  productKey,
} = require("../src/services/inventory.ts");
const { sampleWorkbook } = require("../src/data/sampleWorkbook.ts");
const { skins } = require("../src/theme/skins.ts");
const s = () => useStore.getState();
const biz = (id) => s().businesses[id];
async function main() {
  const csv = importService.parse(
    new TextEncoder().encode("атауы,саны,бағасы\nТест,3,1500").buffer,
  );
  assert.equal(
    importService.map(csv, importService.guess(csv.headers))[0].qty,
    3,
  );
  const march = new Date(2026, 2, 5, 12);
  const seasonal = seedBusiness("bake", "seasonal", march);
  seasonal.orders = seasonal.orders.filter(
    (o) => new Date(o.createdAt).getFullYear() === 2026,
  );
  assert.match(
    getOpportunities(seasonal, march).find((o) => o.kind === "occasion").reason,
    /8 марта/,
  );
  const clothing = seedBusiness("aru");
  assert.equal(
    parseMessage("Закажу 1 платье Summer Rose S", new Date(), clothing.products)
      .items.length,
    1,
  );
  assert.equal(
    parseMessage("Закажу 1 платье Summer Rose S", new Date(), clothing.products)
      .items[0].productId,
    "aru-dress-s",
  );

  const now = new Date(2026, 8, 29, 12);
  assert.equal(skins.length, 6);
  assert.deepEqual(
    skins.map((s) => s.accent),
    ["#4A2C1D", "#1E1B22", "#4E7D5E", "#6D5A96", "#46639A", "#B9313A"],
  );
  for (const type of ["kofe", "aru", "dala", "nur", "tumar", "bake"]) {
    const b = seedBusiness(type, type, now);
    const ops = getOpportunities(b, now);
    assert.ok(ops.length >= 1, type);
    assert.ok(
      ops.every(
        (o) =>
          Number.isFinite(o.price) &&
          o.recipientIds.every((id) => b.chats.some((c) => c.id === id)),
      ),
    );
    assert.ok(b.products.every((p) => p.id.startsWith(type + "-")));
  }
  const coffee = seedBusiness("kofe", "kofe", now);
  const combo = getOpportunities(coffee, now)[0];
  assert.equal(combo.kind, "combo");
  assert.equal(combo.price, 1890);
  assert.equal(combo.recipientIds.length, 8);
  assert.match(combo.calculation, /58%/);
  const richer = {
    ...coffee,
    products: coffee.products.map((p) => ({ ...p, price: p.price * 2 })),
  };
  assert.equal(getOpportunities(richer, now)[0].price, 3770);
  const noPairs = {
    ...coffee,
    orders: coffee.orders.map((o) => ({ ...o, items: o.items.slice(0, 1) })),
  };
  assert.equal(getOpportunities(noPairs, now).length, 0);
  const bakery = seedBusiness("bake", "bake", now);
  assert.ok(
    getOpportunities(bakery, now).find((o) => o.kind === "shopping").checklist
      .length > 0,
  );
  const emptyChats = { ...seedBusiness("tumar", "tumar", now), chats: [] };
  assert.equal(getOpportunities(emptyChats, now).length, 0);
  for (const [text, id, qty, type] of [
    ["Ертең екі медовик керек. Мекенжай: Туран 12", "bake-honey", 2, "bake"],
    ["Закажу 6 капкейков на завтра. Адрес: Абая 12", "bake-cupcake", 6, "bake"],
    [
      "Please order two latte for tomorrow. Address: 10 Turan",
      "kofe-latte",
      2,
      "kofe",
    ],
  ]) {
    const a = parseMessage(text, now, seedBusiness(type).products);
    assert.equal(a.type, "order");
    assert.equal(a.items[0].productId, id);
    assert.equal(a.items[0].qty, qty);
    assert.equal(a.date, "2026-09-30");
    assert.ok(a.address);
  }
  assert.equal(parseMessage("Спасибо за медовик!").type, "feedback");
  assert.equal(parseMessage("Сколько стоит медовик?").type, "question");
  assert.equal(
    parseMessage("Закажу медовик на 03.10.2026", now).date,
    "2026-10-03",
  );
  const start = Date.now();
  await aiService.analyzeMessage("Order 1 latte", coffee.products);
  assert.ok(Date.now() - start >= 550);
  s().reset();
  const bid = "kofe";
  const order = biz(bid).orders[0];
  const qty = biz(bid).products[0].stock;
  const bakerySnapshot = JSON.stringify(biz("bake"));
  s().edit(bid, order.id, { items: [{ productId: "kofe-latte", qty: 999 }] });
  await assert.rejects(s().confirm(bid, order.id));
  s().edit(bid, order.id, { items: [{ productId: "kofe-latte", qty: 0 }] });
  await assert.rejects(s().confirm(bid, order.id));
  s().edit(bid, order.id, {
    items: [{ productId: "kofe-latte", qty: 2 }],
    date: "2026-02-31",
  });
  await assert.rejects(s().confirm(bid, order.id));
  s().edit(bid, order.id, { date: "2026-10-01" });
  await Promise.all([s().confirm(bid, order.id), s().confirm(bid, order.id)]);
  assert.equal(biz(bid).messages.filter((m) => m.role === "bot").length, 1);
  assert.equal(biz(bid).products[0].stock, qty);
  const pay = s().pay(bid, order.id);
  s().switchBusiness("aru");
  await pay;
  await s().pay(bid, order.id);
  assert.equal(biz(bid).products[0].stock, qty - 2);
  assert.equal(JSON.stringify(biz("bake")), bakerySnapshot);
  assert.equal(biz(bid).history.at(-1).source, "sale");
  s().finish(bid, order.id);
  s().cancel(bid, order.id);
  assert.equal(biz(bid).orders[0].status, "completed");
  s().reset();
  await s().confirm(bid, order.id);
  s().stock(bid, "kofe-latte", -999);
  await assert.rejects(s().pay(bid, order.id));
  s().reset();
  const confirming = s().confirm(bid, order.id);
  s().reset();
  await confirming;
  assert.equal(biz(bid).orders[0].status, "draft");
  const op = getOpportunities(biz(bid))[0];
  s().hide(bid, op.id, true);
  assert.ok(!getOpportunities(biz(bid)).some((o) => o.id === op.id));
  s().hide(bid, op.id, false);
  assert.ok(getOpportunities(biz(bid)).some((o) => o.id === op.id));
  const messages = biz(bid).messages.length;
  await s().sendOpportunity(
    bid,
    op,
    "Предложение",
    op.recipientIds.slice(0, 2),
  );
  assert.equal(biz(bid).messages.length, messages + 2);
  const comboId = s().createOpportunity(bid, op);
  assert.ok(biz(bid).products.some((p) => p.id === comboId));
  const count = biz(bid).products.length;
  s().createOpportunity(bid, op);
  assert.equal(biz(bid).products.length, count);
  const tid = s().addBusiness("tumar");
  const pre = getOpportunities(biz(tid)).find((o) => o.kind === "preorder");
  const pid = s().createOpportunity(tid, pre);
  const oid = s().createOrder(tid, pid);
  await s().confirm(tid, oid);
  await s().pay(tid, oid);
  const preorder = biz(tid).orders.find((o) => o.id === oid);
  assert.equal(collectedOf(preorder, biz(tid).products), 12000);
  assert.equal(biz(tid).products.find((p) => p.id === pid).stock, 0);
  const shopping = getOpportunities(biz("bake")).find(
    (o) => o.kind === "shopping",
  );
  const lid = s().createOpportunity("bake", shopping);
  const item = biz("bake").lists[0].items[0];
  s().checkItem("bake", lid, item.id);
  assert.equal(biz("bake").lists[0].items[0].done, true);
  const table = importService.parse(
    fs.readFileSync("assets/sample-stock.xlsx"),
  );
  assert.deepEqual(importService.parse(sampleWorkbook, "base64"), table);
  const map = importService.guess(table.headers);
  const rows = importService.map(table, map);
  assert.equal(rows.length, 4);
  assert.equal(previewChanges(rows, biz(bid).products)[0].delta, 6);
  assert.equal(importService.guess(["атауы", "саны", "бағасы"]).price, 2);
  assert.equal(importService.guess(["product", "quantity", "price"]).qty, 1);
  assert.throws(() => importService.map(table, { ...map, qty: map.name }));
  assert.throws(() =>
    s().importStock(
      bid,
      [{ name: "X", qty: -1, price: 1, confidence: 1 }],
      "replace",
      "excel",
    ),
  );
  assert.throws(() =>
    s().importStock(bid, [rows[0], rows[0]], "replace", "excel"),
  );
  const fp = stockFingerprint(biz(bid));
  s().stock(bid, "kofe-latte", 1);
  assert.throws(() => s().importStock(bid, rows, "replace", "excel", fp));
  const other = JSON.stringify(biz("aru"));
  s().importStock(bid, rows, "replace", "excel", stockFingerprint(biz(bid)));
  assert.equal(biz(bid).products[0].stock, 30);
  assert.equal(JSON.stringify(biz("aru")), other);
  assert.equal(biz(bid).history.at(-1).source, "excel");
  const variants = [
    {
      name: "Тест",
      size: "M",
      color: "Розовый",
      qty: 2,
      price: 100,
      confidence: 1,
    },
    {
      name: "Тест",
      size: "L",
      color: "Розовый",
      qty: 3,
      price: 100,
      confidence: 1,
    },
  ];
  s().importStock("aru", variants, "replace", "manual");
  assert.equal(biz("aru").products.filter((p) => p.name === "Тест").length, 2);
  const recognized = await importService.recognize(biz(bid).products);
  assert.equal(recognized[3].confidence, 0.41);
  const milk = biz(bid).products[2];
  s().importStock(
    bid,
    [
      {
        productId: milk.id,
        name: milk.name,
        qty: 2,
        price: milk.price,
        confidence: 1,
      },
    ],
    "add",
    "invoice",
  );
  assert.ok(biz(bid).history.some((h) => h.source === "invoice"));
  const newId = s().addBusiness("aru", {}, {}, true);
  assert.notEqual(newId, "aru");
  assert.equal(
    Object.values(s().businesses).filter((b) => b.type === "aru").length,
    2,
  );
  s().setMode("dark");
  s().completeOnboarding();
  await new Promise((r) => setTimeout(r, 0));
  const saved = JSON.parse(storage.get("orderin-demo-v2"));
  assert.equal(saved.state.mode, "dark");
  assert.equal(saved.state.onboarded, true);
  await useStore.persist.rehydrate();
  assert.equal(s().mode, "dark");
  // MVP demo journey: a customer message typed in demo mode becomes an AI order,
  // goes through confirmation/payment and deducts stock exactly once.
  s().reset();
  const demoChat = biz("kofe").chats[1].id;
  const latteBefore = biz("kofe").products[0].stock;
  assert.equal(s().receive("kofe", demoChat, "   "), undefined);
  assert.equal(s().receive("kofe", "missing-chat", "2 латте"), undefined);
  const incoming = s().receive("kofe", demoChat, "Закажу 3 латте на завтра. Адрес: Кенесары 40");
  assert.equal(incoming.role, "customer");
  await s().analyze("kofe", incoming);
  const live = biz("kofe").orders.find((o) => o.messageId === incoming.id);
  assert.equal(live.status, "draft");
  assert.deepEqual(live.items, [{ productId: biz("kofe").products[0].id, qty: 3 }]);
  assert.equal(live.address, "Кенесары 40");
  await s().confirm("kofe", live.id);
  await Promise.all([s().pay("kofe", live.id), s().pay("kofe", live.id)]);
  assert.equal(biz("kofe").products[0].stock, latteBefore - 3);
  assert.ok(biz("kofe").messages.some((m) => m.chatId === demoChat && m.role === "bot"));
  const { isDailyReceipt } = require("../src/services/inventory.ts");
  const { orderNo } = require("../src/i18n/ru.ts");
  assert.equal(orderNo("kofe-1041"), "№ 1041");
  assert.match(orderNo("1760000000000-abc123"), /^№ \d{4}$/);
  assert.equal(biz("kofe").orders.filter(isDailyReceipt).length, 7);
  console.log(
    "Passed: six skins and business seeds; computed opportunities; ru/kk/en parser; order lifecycle and stock; duplicate payment/reset/switch races; outreach/create/hide/undo; preorder deposits; shopping checklist; XLSX/CSV mapping and validation; import isolation/stale previews/variants; persistence; demo customer message → AI order → payment.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
