import { Analysis } from "../types";
import { localDate, products } from "../data/mock";
export interface AiService {
  analyzeMessage(text: string): Promise<Analysis>;
}
const numbers: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  один: 1,
  одна: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  бір: 1,
  екі: 2,
  үш: 3,
  төрт: 4,
  бес: 5,
  алты: 6,
};
export function parseMessage(text: string, now = new Date()): Analysis {
  const lower = text.toLowerCase();
  const wantsOrder = /закаж|заказ|керек|тапсырыс|order|please|хочу|нужно/.test(
    lower,
  );
  const feedback = /спасибо|рахмет|thank|вкусно|дәмді|delicious/.test(lower);
  const items = products.flatMap((p) => {
    const keyword = p.keywords.find((k) => lower.includes(k));
    if (!keyword) return [];
    const index = lower.indexOf(keyword);
    const before =
      lower
        .slice(Math.max(0, index - 25), index)
        .trim()
        .split(/\s+/)
        .pop() || "";
    const after = lower
      .slice(index + keyword.length)
      .match(/^[а-яёa-z]*\s*(?:x|×|—|-|:)?\s*(\d+)(?![\d.])/);
    const qty = /^\d+$/.test(before)
      ? Number(before)
      : numbers[before] || (after ? Number(after[1]) : 1);
    return [{ productId: p.id, qty }];
  });
  const type =
    feedback && !wantsOrder
      ? "feedback"
      : items.length && (wantsOrder || /(?:\d+|бір|екі|two|one)\s/.test(lower))
        ? "order"
        : "question";
  let date: string | undefined;
  if (/завтра|ертең|tomorrow/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    date = localDate(d);
  } else if (/сегодня|бүгін|today/.test(lower)) date = localDate(now);
  const explicit = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const dotted = lower.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?\b/);
  if (explicit) date = explicit[1];
  else if (dotted)
    date = `${dotted[3] || now.getFullYear()}-${dotted[2].padStart(2, "0")}-${dotted[1].padStart(2, "0")}`;
  const address = text
    .match(/(?:адрес|мекенжай|address)\s*[:—-]?\s*(.+)/i)?.[1]
    .replace(/[.!]$/, "");
  return {
    type,
    items: type === "order" ? items : [],
    date,
    address,
    confidence: type === "order" ? (address && date ? 0.96 : 0.78) : 0.88,
  };
}
export const aiService: AiService = {
  async analyzeMessage(text) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return parseMessage(text);
  },
};
