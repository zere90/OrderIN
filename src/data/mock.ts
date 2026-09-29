import { Chat, Customer, Message, Order, Product } from "../types";
export const products: Product[] = [
  {
    id: "honey",
    name: "Медовик",
    price: 12500,
    stock: 5,
    emoji: "🍯",
    keywords: ["медовик", "бал торты", "honey cake"],
  },
  {
    id: "choco",
    name: "Шоколадный торт",
    price: 14000,
    stock: 3,
    emoji: "🍫",
    keywords: ["шоколадный торт", "шоколадты торт", "chocolate cake"],
  },
  {
    id: "cupcake",
    name: "Капкейк",
    price: 1200,
    stock: 18,
    emoji: "🧁",
    keywords: ["капкейк", "cupcake"],
  },
  {
    id: "cheese",
    name: "Чизкейк",
    price: 15000,
    stock: 2,
    emoji: "🍰",
    keywords: ["чизкейк", "cheesecake"],
  },
  {
    id: "macaron",
    name: "Макарон",
    price: 800,
    stock: 2,
    emoji: "🍪",
    keywords: ["макарон", "macaron"],
  },
];
export const customers: Customer[] = [
  { id: "a", name: "Айгерім Сапар", initials: "АС" },
  { id: "d", name: "Дарья Ким", initials: "ДК" },
  { id: "s", name: "Sarah Wilson", initials: "SW" },
  { id: "m", name: "Мадина Омар", initials: "МО" },
  { id: "a2", name: "Алексей Петров", initials: "АП" },
];
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function seed() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const date = localDate(tomorrow);
  const stamp = (minutes: number) =>
    new Date(now.getTime() - minutes * 60000).toISOString();
  const chats: Chat[] = customers.map((c, i) => ({
    id: `chat-${i}`,
    customerId: c.id,
    channel: i % 2 ? "instagram" : "whatsapp",
    unread: i < 3,
  }));
  const messages: Message[] = [
    {
      id: "m0",
      chatId: "chat-0",
      role: "customer",
      text: "Сәлем! Ертең 2 медовик керек. Мекенжай: Мәңгілік Ел 25, Астана.",
      createdAt: stamp(4),
      analysis: {
        type: "order",
        items: [{ productId: "honey", qty: 2 }],
        date,
        address: "Мәңгілік Ел 25, Астана",
        confidence: 0.96,
      },
    },
    {
      id: "m1",
      chatId: "chat-1",
      role: "customer",
      text: "Здравствуйте! Закажу 6 капкейков на завтра. Адрес: Кабанбай батыра 12, кв. 8.",
      createdAt: stamp(12),
      analysis: {
        type: "order",
        items: [{ productId: "cupcake", qty: 6 }],
        date,
        address: "Кабанбай батыра 12, кв. 8",
        confidence: 0.98,
      },
    },
    {
      id: "m2",
      chatId: "chat-2",
      role: "customer",
      text: "Hi! Can I order 1 chocolate cake for tomorrow? Address: 10 Turan Avenue, Astana.",
      createdAt: stamp(25),
      analysis: {
        type: "order",
        items: [{ productId: "choco", qty: 1 }],
        date,
        address: "10 Turan Avenue, Astana",
        confidence: 0.94,
      },
    },
    {
      id: "m3",
      chatId: "chat-3",
      role: "customer",
      text: "Сәлеметсіз бе! Чизкейк құрамында жаңғақ бар ма? Есть доставка?",
      createdAt: stamp(48),
      analysis: { type: "question", items: [], confidence: 0.9 },
    },
    {
      id: "m4",
      chatId: "chat-4",
      role: "customer",
      text: "Спасибо за медовик! Очень вкусно, вся семья в восторге 🙌",
      createdAt: stamp(70),
      analysis: { type: "feedback", items: [], confidence: 0.99 },
    },
  ];
  const orders: Order[] = messages
    .filter((m) => m.analysis?.type === "order")
    .map((m, i) => ({
      id: `QZ-${1041 + i}`,
      chatId: m.chatId,
      messageId: m.id,
      items: m.analysis!.items,
      date,
      address: m.analysis!.address,
      status: "draft",
      createdAt: m.createdAt,
    }));
  orders.push({
    id: "QZ-1040",
    chatId: "chat-4",
    messageId: "previous",
    items: [{ productId: "honey", qty: 1 }],
    status: "paid",
    createdAt: stamp(120),
    paidAt: stamp(70),
    total: 12500,
    date: localDate(now),
    address: "Сыганак 18, Астана",
  });
  orders.push({
    id: "QZ-1039",
    chatId: "chat-3",
    messageId: "previous-2",
    items: [{ productId: "cupcake", qty: 4 }],
    status: "awaiting_payment",
    createdAt: stamp(140),
    total: 4800,
    paymentUrl: "https://pay.example/kaspi/QZ-1039",
    date,
    address: "Туран 32, Астана",
  });
  return { products: products.map((p) => ({ ...p })), chats, messages, orders };
}
