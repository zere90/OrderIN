import { Order, Product, OrderItem, ImportRow, ImportMode } from "../types";
import { v2 as ru } from "../i18n/ru";
export const totalOf = (order: Order, products: Product[]) =>
  order.total ??
  order.items.reduce(
    (sum, i) =>
      sum + (products.find((p) => p.id === i.productId)?.price || 0) * i.qty,
    0,
  );
export const collectedOf = (order: Order, products: Product[]) =>
  Math.round(totalOf(order, products) * (order.deposit ?? 1));
export function inventoryNeeds(items: OrderItem[], products: Product[]) {
  const needs = new Map<string, number>();
  const visit = (id: string, qty: number, path: string[]) => {
    const p = products.find((p) => p.id === id);
    if (!p || path.includes(id)) throw Error(ru.invalid);
    if (p.status === "preorder") return;
    needs.set(id, (needs.get(id) || 0) + qty);
    p.components?.forEach((i) =>
      visit(i.productId, qty * i.qty, [...path, id]),
    );
  };
  items.forEach((i) => visit(i.productId, i.qty, []));
  return needs;
}
export function validateOrder(order: Order, products: Product[]) {
  if (
    order.total !== undefined &&
    (!Number.isFinite(order.total) || order.total < 0)
  )
    throw Error(ru.invalid);
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
  for (const [id, qty] of inventoryNeeds(order.items, products))
    if (qty > (products.find((p) => p.id === id)?.stock || 0) + 1e-8)
      throw Error(ru.shortage);
}
export function productKey(p: { name: string; size?: string; color?: string }) {
  return [p.name, p.size || "", p.color || ""]
    .map((s) => s.trim().toLocaleLowerCase())
    .join("|");
}
export function validateImport(rows: ImportRow[], mode: ImportMode) {
  if (
    !rows.length ||
    rows.some(
      (r) =>
        !r.name.trim() ||
        !Number.isFinite(r.qty) ||
        r.qty < 0 ||
        !Number.isFinite(r.price) ||
        r.price < 0,
    )
  )
    throw Error(ru.invalidRows);
  const keys = rows.map(productKey);
  if (new Set(keys).size !== keys.length) throw Error(ru.duplicateRows);
}

// Apply each line's payment terms proportionally, including mixed preorders.
export function depositFor(items: OrderItem[], products: Product[]) {
  const gross = items.reduce(
    (sum, i) =>
      sum + (products.find((p) => p.id === i.productId)?.price || 0) * i.qty,
    0,
  );
  const due = items.reduce((sum, i) => {
    const p = products.find((p) => p.id === i.productId);
    return sum + (p?.price || 0) * i.qty * (p?.deposit ?? 1);
  }, 0);
  return gross > 0 && due < gross ? due / gross : undefined;
}
