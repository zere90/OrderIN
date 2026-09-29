import { Business, Opportunity, OpportunityKind, OrderItem } from "../types";
import { v2 as ru, money, readableDate } from "../i18n/ru";
import { localDate, offsetDate } from "../data/mock";
export interface OpportunityService {
  getOpportunities(business: Business, now?: Date): Opportunity[];
}
export const opportunitiesService: OpportunityService = {
  getOpportunities(b, now = new Date()) {
    const result: Opportunity[] = [];
    const paid = b.orders.filter((o) => o.paidAt);
    const p = b.products;
    const names = (items: OrderItem[]) =>
      items
        .map(
          (i) =>
            `${p.find((x) => x.id === i.productId)?.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`,
        )
        .join(" + ");
    function add(
      kind: OpportunityKind,
      icon: string,
      reason: string,
      items: OrderItem[],
      recipients: string[],
      discount = 1,
      checklist?: Opportunity["checklist"],
    ) {
      const original = items.reduce(
        (s, i) => s + (p.find((x) => x.id === i.productId)?.price || 0) * i.qty,
        0,
      );
      const price = Math.round((original * discount) / 10) * 10;
      const ids = [...new Set(recipients)];
      const revenue = price * ids.length;
      const id = `${b.id}-${kind}`;
      const cost = items.reduce(
        (s, i) => s + (p.find((x) => x.id === i.productId)?.cost || 0) * i.qty,
        0,
      );
      const extra =
        kind === "combo"
          ? ru.comboMath(
              price,
              original,
              price ? Math.round(((price - cost) / price) * 100) : 0,
            ) + "\n"
          : "";
      const draft =
        kind === "preorder"
          ? ru.depositMessage(names(items), price / 2) +
            ` https://pay.example/kaspi/preorder-${id}`
          : kind === "basket"
            ? ru.basketMessage(names(items), price) +
              ` https://pay.example/kaspi/basket-${id}`
            : ru.offer(names(items), price);
      result.push({
        id,
        kind,
        title: ru[kind],
        icon,
        reason,
        calculation:
          kind === "shopping"
            ? ru.purchaseMath(original, checklist?.length || 0)
            : extra +
              ru.calculation(
                kind === "preorder" ? price / 2 : price,
                ids.length,
                kind === "preorder" ? revenue / 2 : revenue,
              ),
        price,
        expectedRevenue: kind === "preorder" ? revenue / 2 : revenue,
        recipientIds: ids,
        items,
        draft,
        checklist,
      });
    }
    const pairs = new Map<
      string,
      { items: OrderItem[]; count: number; chats: string[] }
    >();
    paid
      .filter((o) => o.items.length > 1)
      .forEach((o) => {
        const key = o.items
          .map((i) => `${i.productId}:${i.qty}`)
          .sort()
          .join(",");
        const entry = pairs.get(key) || { items: o.items, count: 0, chats: [] };
        entry.count++;
        entry.chats.push(o.chatId);
        pairs.set(key, entry);
      });
    const pair = [...pairs.values()].sort((a, b) => b.count - a.count)[0];
    if (b.type === "kofe" && pair)
      add(
        "combo",
        "coffee",
        ru.coPurchase(pair.count),
        pair.items,
        pair.chats,
        0.82,
      );
    if (b.type === "aru") {
      const outfit = p
        .filter((x) => x.stock > 0 && x.category === "product")
        .filter((x, i, all) => all.findIndex((y) => y.name === x.name) === i)
        .slice(0, 2);
      const matching = b.chats
        .filter(
          (c) =>
            c.requestedProductId &&
            outfit.some(
              (x) =>
                p.find((y) => y.id === c.requestedProductId)?.name === x.name,
            ),
        )
        .map((c) => c.id);
      if (outfit.length === 2)
        add(
          "outfit",
          "checkroom",
          ru.outfitReason(matching.length),
          outfit.map((x) => ({ productId: x.id, qty: 1 })),
          matching,
          0.9,
        );
      const last = p.find((x) => x.stock > 0 && x.stock < 3 && x.size);
      if (last)
        add(
          "last_size",
          "straighten",
          ru.lastSizeReason(last.stock, last.size!),
          [{ productId: last.id, qty: 1 }],
          b.chats
            .filter(
              (c) =>
                c.requestedSize === last.size &&
                c.requestedProductId === last.id,
            )
            .map((c) => c.id),
        );
    }
    if (b.type === "dala") {
      const repeating = b.chats.filter((c) => {
        const dates = paid
          .filter((o) => o.chatId === c.id)
          .map((o) => new Date(o.paidAt!).getTime())
          .sort((a, b) => a - b);
        return dates.some(
          (d, i) => i > 0 && Math.abs((d - dates[i - 1]) / 86400000 - 7) <= 1,
        );
      });
      if (pair && repeating.length)
        add(
          "basket",
          "shopping_bag",
          ru.weeklyReason(repeating.length),
          pair.items,
          repeating.map((c) => c.id),
        );
      const expiring = p.find(
        (x) =>
          x.expiresAt &&
          x.stock > 0 &&
          x.expiresAt >= localDate(now) &&
          x.expiresAt <= localDate(offsetDate(3, now)),
      );
      if (expiring)
        add(
          "expiry",
          "schedule",
          ru.expiryReason(readableDate(expiring.expiresAt), expiring.stock),
          [{ productId: expiring.id, qty: 1 }],
          repeating.map((c) => c.id),
          0.75,
        );
    }
    if (b.type === "nur") {
      const service = p.find((x) => x.intervalDays);
      if (service) {
        const due = b.chats.filter((c) => {
          const last = paid
            .filter(
              (o) =>
                o.chatId === c.id &&
                o.items.some((i) => i.productId === service.id),
            )
            .sort((a, b) => b.paidAt!.localeCompare(a.paidAt!))[0];
          return (
            last &&
            (now.getTime() - Date.parse(last.paidAt!)) / 86400000 >=
              service.intervalDays!
          );
        });
        add(
          "slots",
          "schedule",
          ru.beautyReason(due.length, b.slots.length),
          [{ productId: service.id, qty: 1 }],
          due.slice(0, b.slots.length).map((c) => c.id),
        );
      }
      if (pair)
        add(
          "package",
          "spa",
          ru.packageReason(new Set(pair.chats).size),
          pair.items,
          pair.chats,
          0.9,
        );
    }
    if (b.type === "tumar") {
      const sold = p.find(
        (x) =>
          x.stock === 0 && b.chats.some((c) => c.requestedProductId === x.id),
      );
      if (sold) {
        const recipients = b.chats
          .filter((c) => c.requestedProductId === sold.id)
          .map((c) => c.id);
        add(
          "preorder",
          "style",
          ru.waitReason(recipients.length),
          [{ productId: sold.id, qty: 1 }],
          recipients,
        );
        add(
          "demand",
          "trending_up",
          ru.demandReason(recipients.length),
          [{ productId: sold.id, qty: 1 }],
          recipients,
        );
      }
    }
    if (b.type === "bake") {
      const anniversaries = paid.filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getFullYear() === now.getFullYear() - 1 &&
          Math.abs(
            new Date(now.getFullYear(), d.getMonth(), d.getDate()).getTime() -
              now.getTime(),
          ) <
            7 * 86400000
        );
      });
      const holiday = [
        { month: 2, day: 8, name: "8 марта" },
        { month: 2, day: 22, name: "Наурыз" },
      ].find((h) => {
        const date = new Date(now.getFullYear(), h.month, h.day);
        const days = (date.getTime() - now.getTime()) / 86400000;
        return days >= 0 && days <= 14;
      });
      if (holiday && !anniversaries.length)
        add(
          "occasion",
          "cake",
          ru.holidayReason(
            holiday.name,
            new Set(paid.map((o) => o.chatId)).size,
          ),
          [{ productId: p[0].id, qty: 1 }],
          paid.map((o) => o.chatId),
        );
      if (anniversaries.length)
        add(
          "occasion",
          "cake",
          ru.occasionReason(new Set(anniversaries.map((o) => o.chatId)).size),
          [{ productId: p[0].id, qty: 1 }],
          anniversaries.map((o) => o.chatId),
        );
      const tomorrow = b.orders.filter(
        (o) =>
          o.date === localDate(offsetDate(1, now)) &&
          o.status !== "cancelled" &&
          o.status !== "completed",
      );
      const needs = new Map<string, number>();
      tomorrow.forEach((o) =>
        o.items.forEach((i) =>
          p
            .find((x) => x.id === i.productId)
            ?.components?.forEach((c) =>
              needs.set(
                c.productId,
                (needs.get(c.productId) || 0) + c.qty * i.qty,
              ),
            ),
        ),
      );
      const checklist = [...needs].flatMap(([id, qty]) => {
        const item = p.find((x) => x.id === id)!;
        const missing = Math.max(0, Math.round((qty - item.stock) * 100) / 100);
        return missing
          ? [
              {
                id,
                name: item.name,
                qty: missing,
                unit: item.unit,
                done: false,
              },
            ]
          : [];
      });
      add(
        "shopping",
        "shopping_cart",
        ru.shoppingReason(tomorrow.length),
        checklist.map((x) => ({ productId: x.id, qty: x.qty })),
        [],
        1,
        checklist,
      );
    }
    return result.filter((o) => !b.hiddenOpportunities.includes(o.id));
  },
};
export const getOpportunities = opportunitiesService.getOpportunities;
