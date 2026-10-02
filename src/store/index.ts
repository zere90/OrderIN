import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { seed, seedBusiness } from "../data/mock";
import {
  Business,
  BusinessType,
  Order,
  Message,
  Opportunity,
  ImportRow,
  ImportMode,
  StockSource,
} from "../types";
import {
  totalOf,
  validateOrder,
  inventoryNeeds,
  validateImport,
  productKey,
  depositFor,
} from "../services/inventory";
import { aiService } from "../services/ai";
import { paymentService } from "../services/payments";
import { messagingService } from "../services/messaging";
import { v2 as ru } from "../i18n/ru";
export { totalOf, validateOrder } from "../services/inventory";
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
interface State {
  businesses: Record<string, Business>;
  currentBusinessId: string;
  owner: string;
  onboarded: boolean;
  mode: "system" | "light" | "dark";
  hydrated: boolean;
  reset: () => void;
  switchBusiness: (id: string) => void;
  addBusiness: (
    type: BusinessType,
    answers?: Record<string, string>,
    connections?: Record<string, boolean>,
    forceNew?: boolean,
  ) => string;
  completeOnboarding: () => void;
  setMode: (mode: State["mode"]) => void;
  read: (bid: string, id: string) => void;
  edit: (
    bid: string,
    id: string,
    patch: Partial<Pick<Order, "items" | "date" | "address" | "total">>,
  ) => void;
  confirm: (bid: string, id: string) => Promise<void>;
  pay: (bid: string, id: string) => Promise<void>;
  finish: (bid: string, id: string) => void;
  cancel: (bid: string, id: string) => void;
  reply: (bid: string, id: string, text: string) => Promise<void>;
  analyze: (bid: string, message: Message) => Promise<void>;
  stock: (bid: string, id: string, delta: number) => void;
  importStock: (
    bid: string,
    rows: ImportRow[],
    mode: ImportMode,
    source: StockSource,
    expected?: string,
  ) => void;
  hide: (bid: string, id: string, hidden: boolean) => void;
  sendOpportunity: (
    bid: string,
    op: Opportunity,
    text: string,
    recipients: string[],
  ) => Promise<void>;
  createOpportunity: (bid: string, op: Opportunity) => string | undefined;
  checkItem: (bid: string, listId: string, itemId: string) => void;
  createOrder: (bid: string, productId: string, chatId?: string) => string;
}
let generation = 0;
const locks = new Set<string>();
export const stockFingerprint = (b: Business) =>
  JSON.stringify(b.products.map((p) => [p.id, p.stock, p.price]));
export const useStore = create<State>()(
  persist(
    (set, get) => {
      const update = (bid: string, fn: (b: Business) => Business) =>
        set((s) =>
          s.businesses[bid]
            ? { businesses: { ...s.businesses, [bid]: fn(s.businesses[bid]) } }
            : {},
        );
      return {
        ...seed(),
        hydrated: false,
        reset: () => {
          generation++;
          set({ ...seed(), onboarded: true });
        },
        setMode: (mode) => set({ mode }),
        completeOnboarding: () => set({ onboarded: true }),
        switchBusiness: (id) => {
          if (get().businesses[id]) set({ currentBusinessId: id });
        },
        addBusiness: (
          type,
          answers = {},
          connections = {},
          forceNew = false,
        ) => {
          const existing = forceNew
            ? undefined
            : Object.values(get().businesses).find((b) => b.type === type);
          const id = existing?.id || `${type}-${uid()}`;
          set((s) => ({
            businesses: {
              ...s.businesses,
              [id]: {
                ...(existing || seedBusiness(type, id)),
                answers,
                connections,
              },
            },
            currentBusinessId: id,
          }));
          return id;
        },
        read: (bid, id) =>
          update(bid, (b) => ({
            ...b,
            chats: b.chats.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
          })),
        edit: (bid, id, patch) =>
          update(bid, (b) => ({
            ...b,
            orders: b.orders.map((o) =>
              o.id === id && o.status === "draft"
                ? {
                    ...o,
                    ...patch,
                    total: patch.items ? undefined : (patch.total ?? o.total),
                    deposit: patch.items
                      ? depositFor(patch.items, b.products)
                      : o.deposit,
                  }
                : o,
            ),
          })),
        confirm: async (bid, id) => {
          const key = `${bid}/${id}`;
          if (locks.has(key)) return;
          locks.add(key);
          const revision = generation;
          try {
            const b = get().businesses[bid];
            const order = b?.orders.find((o) => o.id === id);
            if (!order || order.status !== "draft") return;
            validateOrder(order, b.products);
            if (
              order.total !== undefined &&
              (!Number.isFinite(order.total) || order.total < 0)
            )
              throw Error(ru.invalid);
            const url = await paymentService.createKaspiLink(order);
            const message = await messagingService.sendMessage(
              order.chatId,
              `${ru.mockLink}\n${url}`,
              "bot",
            );
            if (revision !== generation) return;
            update(bid, (current) => {
              const o = current.orders.find((o) => o.id === id);
              if (!o || o.status !== "draft") return current;
              validateOrder(o, current.products);
              return {
                ...current,
                orders: current.orders.map((x) =>
                  x.id === id
                    ? {
                        ...x,
                        status: "awaiting_payment",
                        paymentUrl: url,
                        total: totalOf(x, current.products),
                        deposit: depositFor(x.items, current.products),
                      }
                    : x,
                ),
                messages: [...current.messages, message],
              };
            });
          } finally {
            locks.delete(key);
          }
        },
        pay: async (bid, id) => {
          const key = `${bid}/${id}`;
          if (locks.has(key)) return;
          locks.add(key);
          const revision = generation;
          try {
            const receipt = await paymentService.simulatePayment(id);
            if (revision !== generation) return;
            update(bid, (b) => {
              const order = b.orders.find((o) => o.id === id);
              if (!order || order.status !== "awaiting_payment") return b;
              validateOrder(order, b.products);
              const needs = inventoryNeeds(order.items, b.products);
              return {
                ...b,
                orders: b.orders.map((o) =>
                  o.id === id
                    ? { ...o, status: "paid", paidAt: receipt.paidAt }
                    : o,
                ),
                products: b.products.map((p) => ({
                  ...p,
                  stock:
                    Math.round((p.stock - (needs.get(p.id) || 0)) * 10000) /
                    10000,
                })),
                history: [
                  ...b.history,
                  ...[...needs].map(([pid, qty]) => ({
                    id: uid(),
                    productId: pid,
                    name: b.products.find((p) => p.id === pid)!.name,
                    delta: -qty,
                    source: "sale" as const,
                    createdAt: receipt.paidAt,
                  })),
                ],
              };
            });
          } finally {
            locks.delete(key);
          }
        },
        finish: (bid, id) =>
          update(bid, (b) => ({
            ...b,
            orders: b.orders.map((o) =>
              o.id === id && o.status === "paid"
                ? { ...o, status: "completed" }
                : o,
            ),
          })),
        cancel: (bid, id) =>
          update(bid, (b) => ({
            ...b,
            orders: b.orders.map((o) =>
              o.id === id && ["draft", "awaiting_payment"].includes(o.status)
                ? { ...o, status: "cancelled" }
                : o,
            ),
          })),
        reply: async (bid, id, text) => {
          if (!text.trim()) return;
          const revision = generation;
          const message = await messagingService.sendMessage(id, text.trim());
          if (revision === generation)
            update(bid, (b) => ({ ...b, messages: [...b.messages, message] }));
        },
        analyze: async (bid, message) => {
          const revision = generation;
          const b = get().businesses[bid];
          if (!b) return;
          const analysis = await aiService.analyzeMessage(
            message.text,
            b.products,
          );
          if (revision !== generation) return;
          update(bid, (b) => ({
            ...b,
            messages: b.messages.map((m) =>
              m.id === message.id ? { ...m, analysis } : m,
            ),
            orders:
              analysis.type === "order" &&
              !b.orders.some((o) => o.messageId === message.id)
                ? [
                    ...b.orders,
                    {
                      id: uid(),
                      chatId: message.chatId,
                      messageId: message.id,
                      items: analysis.items,
                      date: analysis.date,
                      address: analysis.address,
                      status: "draft",
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : b.orders,
          }));
        },
        stock: (bid, id, delta) =>
          update(bid, (b) => {
            const p = b.products.find((p) => p.id === id);
            if (!p || !Number.isFinite(delta)) return b;
            const qty = Math.max(0, p.stock + delta);
            return {
              ...b,
              products: b.products.map((x) =>
                x.id === id ? { ...x, stock: qty } : x,
              ),
              history: [
                ...b.history,
                {
                  id: uid(),
                  productId: id,
                  name: p.name,
                  delta: qty - p.stock,
                  source: "manual",
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }),
        importStock: (bid, rows, mode, source, expected) => {
          validateImport(rows, mode);
          update(bid, (b) => {
            if (expected && stockFingerprint(b) !== expected)
              throw Error(ru.staleImport);
            const products = [...b.products];
            const history = [...b.history];
            for (const row of rows) {
              const index = products.findIndex((p) =>
                row.productId
                  ? p.id === row.productId
                  : productKey(p) === productKey(row),
              );
              const old = products[index];
              const qty =
                mode === "add" ? (old?.stock || 0) + row.qty : row.qty;
              const product = old
                ? { ...old, name: row.name, stock: qty, price: row.price }
                : {
                    id: `${bid}-${uid()}`,
                    name: row.name,
                    stock: qty,
                    price: row.price,
                    cost: 0,
                    unit: "шт",
                    icon: "inventory_2",
                    keywords: [row.name.toLowerCase()],
                    category: "product" as const,
                    size: row.size,
                    color: row.color,
                  };
              if (index < 0) products.push(product);
              else products[index] = product;
              history.push({
                id: uid(),
                productId: product.id,
                name: product.name,
                delta: qty - (old?.stock || 0),
                priceBefore: old?.price,
                priceAfter: row.price,
                source,
                createdAt: new Date().toISOString(),
              });
            }
            return { ...b, products, history };
          });
        },
        hide: (bid, id, hidden) =>
          update(bid, (b) => ({
            ...b,
            hiddenOpportunities: hidden
              ? [...new Set([...b.hiddenOpportunities, id])]
              : b.hiddenOpportunities.filter((x) => x !== id),
          })),
        sendOpportunity: async (bid, op, text, recipients) => {
          const revision = generation;
          const b = get().businesses[bid];
          const valid = [...new Set(recipients)].filter(
            (id) =>
              op.recipientIds.includes(id) && b.chats.some((c) => c.id === id),
          );
          const messages = await Promise.all(
            valid.map((id) => messagingService.sendMessage(id, text)),
          );
          if (revision === generation)
            update(bid, (b) => ({
              ...b,
              messages: [...b.messages, ...messages],
            }));
        },
        createOpportunity: (bid, op) => {
          let result: string | undefined;
          update(bid, (b) => {
            if (b.createdOpportunities.includes(op.id)) return b;
            const createdOpportunities = [...b.createdOpportunities, op.id];
            if (op.kind === "shopping") {
              result = uid();
              return {
                ...b,
                createdOpportunities,
                lists: [
                  ...b.lists,
                  {
                    id: result,
                    title: op.title,
                    items: op.checklist || [],
                    createdAt: new Date().toISOString(),
                  },
                ],
              };
            }
            const original = b.products.find(
              (p) => p.id === op.items[0]?.productId,
            );
            if (!original) return b;
            const preorder = op.kind === "preorder" || op.kind === "demand";
            const stock = preorder
              ? 0
              : Math.max(
                  0,
                  Math.floor(
                    Math.min(
                      ...op.items.map(
                        (i) =>
                          (b.products.find((p) => p.id === i.productId)
                            ?.stock || 0) / i.qty,
                      ),
                    ),
                  ),
                );
            result = `${bid}-${uid()}`;
            const product = {
              ...original,
              id: result,
              name: `${op.title}: ${op.items.map((i) => b.products.find((p) => p.id === i.productId)?.name).join(" + ")}`,
              price: op.price,
              stock,
              status: preorder ? ("preorder" as const) : undefined,
              deposit: preorder ? 0.5 : undefined,
              components: preorder ? undefined : op.items,
              keywords: [op.title.toLowerCase()],
            };
            return {
              ...b,
              createdOpportunities,
              products: [...b.products, product],
              history: [
                ...b.history,
                {
                  id: uid(),
                  productId: result,
                  name: product.name,
                  delta: stock,
                  source: "ai",
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          });
          return result;
        },
        checkItem: (bid, lid, iid) =>
          update(bid, (b) => ({
            ...b,
            lists: b.lists.map((l) =>
              l.id === lid
                ? {
                    ...l,
                    items: l.items.map((i) =>
                      i.id === iid ? { ...i, done: !i.done } : i,
                    ),
                  }
                : l,
            ),
          })),
        createOrder: (bid, pid, chatId) => {
          const id = uid();
          update(bid, (b) => {
            const p = b.products.find((p) => p.id === pid);
            if (!p) throw Error(ru.invalid);
            return {
              ...b,
              orders: [
                ...b.orders,
                {
                  id,
                  chatId: chatId || b.chats[0].id,
                  messageId: `manual-${id}`,
                  items: [{ productId: pid, qty: 1 }],
                  status: "draft",
                  createdAt: new Date().toISOString(),
                  deposit: p.deposit,
                },
              ],
            };
          });
          return id;
        },
      };
    },
    {
      name: "qazyna-demo-v2",
      version: 2,
      skipHydration: true,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        businesses: s.businesses,
        currentBusinessId: s.currentBusinessId,
        owner: s.owner,
        onboarded: s.onboarded,
        mode: s.mode,
      }),
    },
  ),
);
export const useBusiness = () =>
  useStore((s) => s.businesses[s.currentBusinessId]);
