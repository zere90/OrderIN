import {
  Business,
  BusinessType,
  Chat,
  Customer,
  Message,
  Order,
  Product,
} from "../types";
import { skinMap } from "../theme/skins";
import { products as kofe } from "./kofe";
import { products as aru } from "./aru";
import { products as dala } from "./dala";
import { products as nur } from "./nur";
import { products as tumar } from "./tumar";
import { products as bake } from "./bake";
export const catalogs = { kofe, aru, dala, nur, tumar, bake };
export const products = bake;
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const offsetDate = (days: number, now = new Date()) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
};
export const customers: Customer[] = [
  { id: "c1", name: "Дана Сейткали", initials: "DS" },
  { id: "c2", name: "Aisha_kz", initials: "AK" },
  { id: "c3", name: "Мади Ержанов", initials: "МЕ" },
  { id: "c4", name: "Saltanat_beauty", initials: "SB" },
  { id: "c5", name: "Нурлан К.", initials: "НК" },
  { id: "c6", name: "Айгерім Сапар", initials: "АС" },
  { id: "c7", name: "Алия Омар", initials: "АО" },
  { id: "c8", name: "Sarah Wilson", initials: "SW" },
];
export function seedBusiness(
  type: BusinessType,
  id: string = type,
  now = new Date(),
): Business {
  const catalog: Product[] = catalogs[type].map((p) => ({
    ...p,
    id: `${id}-${p.id}`,
    keywords: [...p.keywords],
  }));
  if (type === "aru") {
    const sizes = ["M", "S", "L", "S", "XS"];
    const colors = ["Розовый", "Розовый", "Синий", "Белый", "Бежевый"];
    catalog.forEach((p, i) => {
      p.size = sizes[i];
      p.color = colors[i];
    });
  }
  if (type === "tumar") {
    catalog[0].size = "M";
    catalog[1].size = "M";
    catalog[3].size = "L";
  }
  if (type === "dala") catalog[3].expiresAt = localDate(offsetDate(2, now));
  if (type === "nur") {
    catalog[0].intervalDays = 21;
    catalog[1].intervalDays = 30;
  }
  if (type === "bake")
    catalog[0].components = [
      { productId: catalog[3].id, qty: 0.5 },
      { productId: catalog[4].id, qty: 0.4 },
      { productId: catalog[5].id, qty: 0.2 },
    ];
  // Food recipes are inventory requirements in addition to the finished product count.
  const chats: Chat[] = customers.map((c, i) => ({
    id: `${id}-chat-${i}`,
    customerId: c.id,
    channel: i % 2 ? "instagram" : "whatsapp",
    unread:
      type === "aru" ? 0 : type === "bake" ? (i === 0 ? 1 : 0) : i < 3 ? 1 : 0,
    ...(i > 0
      ? {
          requestedProductId: catalog[type === "aru" ? 1 : 0].id,
          requestedSize:
            type === "aru" ? "S" : type === "tumar" ? "M" : undefined,
        }
      : {}),
  }));
  const tomorrow = localDate(offsetDate(1, now));
  const date = localDate(now);
  const stamp = (minutes: number) =>
    new Date(now.getTime() - minutes * 60000).toISOString();
  const orderTexts: Record<BusinessType, string> = {
    kofe: "Мне нужно 2 латте и 1 круассан, можно доставку? Адрес: ул. Абая 12, кв. 34.",
    aru: "Сәлем! Маған 1 платье Summer Rose M керек. Завтра, адрес: Туран 12.",
    dala: "Сәлем! Закажу хлеб ×2, молоко и яйца. Адрес: Мәңгілік Ел 25.",
    nur: "Запишите меня на маникюр завтра. Сәлем, на 14:00 можно?",
    tumar: "Сәлем! Хочу 1 футболку Tumar M, адрес: Сыганак 18.",
    bake: "Сәлем! Ертең 2 медовик керек. Мекенжай: Мәңгілік Ел 25, Астана.",
  };
  const question: Record<BusinessType, string> = {
    kofe: "А можно латте на овсяном молоке?",
    aru: "А есть размер S в розовом?",
    dala: "Можно как обычно: хлеб, молоко и яйца каждую неделю?",
    nur: "Пора обновить маникюр. Какие окна свободны?",
    tumar: "Худи Steppe M закончился? Запишите в лист ожидания!",
    bake: "В прошлом году брали торт на день рождения. Повторим?",
  };
  const mainItems =
    type === "kofe"
      ? [
          { productId: catalog[0].id, qty: 2 },
          { productId: catalog[1].id, qty: 1 },
        ]
      : [
          {
            productId: catalog[type === "tumar" ? 1 : 0].id,
            qty: type === "bake" ? 2 : 1,
          },
        ];
  const messages: Message[] = chats.flatMap((c, i) => [
    {
      id: `${id}-msg-${i}`,
      chatId: c.id,
      role: "customer" as const,
      text:
        i === 0
          ? orderTexts[type]
          : i === 2
            ? "Спасибо за быструю доставку! Рахмет 🙏"
            : question[type],
      createdAt: stamp(4 + i * 15),
      analysis:
        i === 0
          ? {
              type: "order" as const,
              items: mainItems,
              date: tomorrow,
              address: "ул. Абая 12, кв. 34",
              confidence: 0.96,
            }
          : {
              type: i === 2 ? ("feedback" as const) : ("question" as const),
              items: [],
              confidence: 0.94,
            },
    },
  ]);
  const orders: Order[] = [
    {
      id: `${id}-1041`,
      chatId: chats[0].id,
      messageId: messages[0].id,
      items: mainItems,
      date: tomorrow,
      address: "ул. Абая 12, кв. 34",
      status: "draft",
      createdAt: stamp(4),
    },
  ];
  const pair =
    type === "kofe"
      ? mainItems
      : [
          { productId: catalog[type === "tumar" ? 1 : 0].id, qty: 1 },
          {
            productId:
              catalog[type === "nur" ? 1 : type === "tumar" ? 2 : 1].id,
            qty: 1,
          },
        ];
  for (let i = 0; i < 8; i++) {
    const days =
      type === "nur"
        ? 28 + i
        : type === "bake"
          ? 365
          : type === "dala"
            ? 7
            : 1 + (i % 3);
    const old = offsetDate(-days, now);
    if (type === "bake") old.setFullYear(now.getFullYear() - 1);
    orders.push({
      id: `${id}-history-${i}`,
      chatId: chats[i].id,
      messageId: "history",
      items: pair,
      status: "completed",
      createdAt: old.toISOString(),
      paidAt: old.toISOString(),
      total: pair.reduce(
        (s, it) =>
          s + catalog.find((p) => p.id === it.productId)!.price * it.qty,
        0,
      ),
      date: localDate(old),
    });
    if (type === "dala") {
      const older = offsetDate(-14, now);
      orders.push({
        ...orders.at(-1)!,
        id: `${id}-weekly-${i}`,
        createdAt: older.toISOString(),
        paidAt: older.toISOString(),
      });
    }
  }
  const series =
    type === "kofe"
      ? [41200, 38700, 52100, 47300, 61800, 44500, 47300]
      : type === "aru"
        ? [46000, 58000, 62000, 42000, 71000, 68000, 89500]
        : type === "bake"
          ? [12500, 19000, 15000, 24500, 18000, 21000, 23100]
          : [18000, 23000, 21000, 27500, 33000, 26000, 31500];
  // Historical receipts carry their sale-time totals, independent of today's catalog prices.
  for (let i = 0; i < 7; i++) {
    const day = offsetDate(i - 6, now);
    orders.push({
      id: `${id}-receipt-${i}`,
      chatId: chats[2].id,
      messageId: "receipt",
      items: [{ productId: catalog[0].id, qty: 1 }],
      status: i === 6 ? "paid" : "completed",
      createdAt: day.toISOString(),
      paidAt: day.toISOString(),
      total: series[i],
      date: localDate(day),
    });
  }
  orders.push({
    id: `${id}-1040`,
    chatId: chats[3].id,
    messageId: "pending",
    items: [{ productId: catalog[1].id, qty: 1 }],
    status: "awaiting_payment",
    total: catalog[1].price,
    createdAt: stamp(90),
    date: tomorrow,
    paymentUrl: `https://pay.example/kaspi/${id}-1040`,
  });
  return {
    id,
    type,
    name: skinMap[type].name,
    customers: customers.map((c) => ({ ...c })),
    products: catalog,
    chats,
    messages,
    orders,
    history: [
      {
        id: `${id}-initial`,
        productId: catalog[1].id,
        name: catalog[1].name,
        delta: catalog[1].stock,
        source: "manual",
        createdAt: now.toISOString(),
      },
    ],
    hiddenOpportunities: [],
    createdOpportunities: [],
    lists: [],
    answers: {},
    connections: { instagram: true, whatsapp: true, kaspi: true },
    slots: [`${date} 16:00`, `${tomorrow} 11:00`, `${tomorrow} 15:00`],
  };
}
export function seed() {
  return {
    businesses: Object.fromEntries(
      (["kofe", "aru", "bake"] as const).map((t) => [t, seedBusiness(t)]),
    ),
    currentBusinessId: "kofe",
    owner: "Aziza",
    onboarded: false,
    mode: "system" as const,
  };
}
