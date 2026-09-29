import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seed } from "../data/mock";
import { Chat, Message, Order, Product } from "../types";
import { ru } from "../i18n/ru";
import { aiService } from "../services/ai";
import { paymentService } from "../services/payments";
import { messagingService } from "../services/messaging";
export const totalOf = (order: Order, products: Product[]) =>
  order.total ??
  order.items.reduce(
    (sum, i) =>
      sum + (products.find((p) => p.id === i.productId)?.price || 0) * i.qty,
    0,
  );
export function validateOrder(order: Order, products: Product[]) {
  if (
    !order.items.length ||
    order.items.some(
      (i) =>
        !Number.isInteger(i.qty) ||
        i.qty < 1 ||
        !products.some((p) => p.id === i.productId),
    )
  )
    throw Error(ru.invalid);
  if (
    order.date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(order.date) ||
      Number.isNaN(Date.parse(order.date)) ||
      new Date(order.date).toISOString().slice(0, 10) !== order.date)
  )
    throw Error(ru.invalid);
  const quantities = new Map<string, number>();
  order.items.forEach((i) =>
    quantities.set(i.productId, (quantities.get(i.productId) || 0) + i.qty),
  );
  for (const [id, qty] of quantities)
    if (qty > (products.find((p) => p.id === id)?.stock || 0))
      throw Error(ru.shortage);
}
interface State {
  products: Product[];
  chats: Chat[];
  messages: Message[];
  orders: Order[];
  hydrated: boolean;
  reset: () => void;
  read: (id: string) => void;
  stock: (id: string, delta: number) => void;
  edit: (
    id: string,
    patch: Partial<Pick<Order, "items" | "date" | "address">>,
  ) => void;
  confirm: (id: string) => Promise<void>;
  pay: (id: string) => Promise<void>;
  finish: (id: string) => void;
  cancel: (id: string) => void;
  reply: (id: string, text: string) => Promise<void>;
  analyze: (message: Message) => Promise<void>;
}
let generation = 0;
const locks = new Set<string>();
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      hydrated: false,
      reset: () => {
        generation++;
        set(seed());
      },
      read: (id) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, unread: false } : c,
          ),
        })),
      stock: (id, delta) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        })),
      edit: (id, patch) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && o.status === "draft" ? { ...o, ...patch } : o,
          ),
        })),
      confirm: async (id) => {
        if (locks.has(id)) return;
        locks.add(id);
        const revision = generation;
        try {
          const order = get().orders.find((o) => o.id === id);
          if (!order || order.status !== "draft") return;
          validateOrder(order, get().products);
          const url = await paymentService.createKaspiLink(order);
          const message = await messagingService.sendMessage(
            order.chatId,
            `${ru.mockLink}\n${url}`,
            "bot",
          );
          if (revision !== generation) return;
          const current = get().orders.find((o) => o.id === id);
          if (!current || current.status !== "draft") return;
          validateOrder(current, get().products);
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === id
                ? {
                    ...o,
                    status: "awaiting_payment",
                    paymentUrl: url,
                    total: totalOf(o, s.products),
                  }
                : o,
            ),
            messages: [...s.messages, message],
          }));
        } finally {
          locks.delete(id);
        }
      },
      pay: async (id) => {
        if (locks.has(id)) return;
        locks.add(id);
        const revision = generation;
        try {
          const receipt = await paymentService.simulatePayment(id);
          if (revision !== generation) return;
          const order = get().orders.find((o) => o.id === id);
          if (!order || order.status !== "awaiting_payment") return;
          validateOrder(order, get().products);
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === id
                ? { ...o, status: "paid", paidAt: receipt.paidAt }
                : o,
            ),
            products: s.products.map((p) => ({
              ...p,
              stock:
                p.stock -
                order.items
                  .filter((i) => i.productId === p.id)
                  .reduce((sum, i) => sum + i.qty, 0),
            })),
          }));
        } finally {
          locks.delete(id);
        }
      },
      finish: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && o.status === "paid"
              ? { ...o, status: "completed" }
              : o,
          ),
        })),
      cancel: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id && ["draft", "awaiting_payment"].includes(o.status)
              ? { ...o, status: "cancelled" }
              : o,
          ),
        })),
      reply: async (id, text) => {
        if (!text.trim()) return;
        const revision = generation;
        const message = await messagingService.sendMessage(id, text.trim());
        if (revision === generation)
          set((s) => ({ messages: [...s.messages, message] }));
      },
      analyze: async (message) => {
        const revision = generation;
        const analysis = await aiService.analyzeMessage(message.text);
        if (revision !== generation) return;
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === message.id ? { ...m, analysis } : m,
          ),
          orders:
            analysis.type === "order" &&
            !s.orders.some((o) => o.messageId === message.id)
              ? [
                  ...s.orders,
                  {
                    id: `QZ-${Date.now()}`,
                    messageId: message.id,
                    chatId: message.chatId,
                    items: analysis.items,
                    date: analysis.date,
                    address: analysis.address,
                    status: "draft",
                    createdAt: new Date().toISOString(),
                  },
                ]
              : s.orders,
        }));
      },
    }),
    {
      name: "qazyna-demo-v1",
      skipHydration: true,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        products: s.products,
        chats: s.chats,
        messages: s.messages,
        orders: s.orders,
      }),
    },
  ),
);
