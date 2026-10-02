import { z } from "zod";
const short = z.string().trim().min(1).max(200);
const text = z.string().trim().min(1).max(2000);
const confidence = z.number().min(0).max(1);
const variant = z.object({ size: short.optional(), color: short.optional() })
  .strict();
const product = z.object({
  id: short,
  name: short,
  price: z.number().finite().nonnegative(),
  variants: z.array(variant).max(50),
}).strict();
const products = z.array(product).max(200).refine((p) =>
  new Set(p.map((x) => x.id)).size === p.length
);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) =>
  !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
);
export const inputSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("analyze_message"),
    text,
    businessType: short,
    products,
    today: date.optional(),
  }).strict(),
  z.object({
    task: z.literal("draft_reply"),
    history: z.array(
      z.object({ role: z.enum(["customer", "seller", "bot"]), text }).strict(),
    ).min(1).max(10),
    businessType: short,
    shopName: short,
    tone: short,
  }).strict(),
  z.object({
    task: z.literal("read_invoice"),
    image: z.string().min(4).max(4_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    mimeType: z.literal("image/jpeg"),
    products,
  }).strict(),
  z.object({
    task: z.literal("map_excel_columns"),
    headers: z.array(z.string().max(200)).min(1).max(50),
    sampleRows: z.array(
      z.array(
        z.union([
          z.string().max(200),
          z.number().finite(),
          z.boolean(),
          z.null(),
        ]),
      ).max(50),
    ).max(5),
  }).strict(),
  z.object({
    task: z.literal("write_campaign"),
    opportunity: z.object({
      type: short,
      title: short,
      price: z.number().finite().nonnegative(),
      expectedRevenue: z.number().finite().nonnegative(),
      recipientCount: z.number().int().nonnegative(),
      draft: text,
    }).strict(),
    customerName: short,
    language: z.enum(["kk", "ru", "en", "mixed"]),
  }).strict(),
]);
export type Input = z.infer<typeof inputSchema>;
export type Task = Input["task"];
export const analysisSchema = z.object({
  type: z.enum(["order", "question", "feedback", "other"]),
  language: z.enum(["kk", "ru", "en", "mixed"]),
  items: z.array(
    z.object({
      productId: short,
      name: short,
      qty: z.number().int().positive().max(10000),
      variant: variant.optional(),
    }).strict(),
  ).max(100),
  date: date.optional(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  address: short.optional(),
  confidence,
  missing: z.array(short).max(20),
}).strict();
const index = z.number().int().min(-1).max(49);
export const outputSchemas = {
  analyze_message: analysisSchema,
  draft_reply: z.object({
    replies: z.array(z.string().min(1).max(500)).length(3),
  }).strict(),
  read_invoice: z.object({
    supplier: short.optional(),
    date: date.optional(),
    rows: z.array(
      z.object({
        name: short,
        qty: z.number().int().positive().max(100000),
        unit: short,
        price: z.number().finite().nonnegative(),
        confidence,
        productId: short.optional(),
        variant: variant.optional(),
      }).strict(),
    ).min(1).max(100),
  }).strict(),
  map_excel_columns: z.object({
    mapping: z.object({
      name: index,
      qty: index,
      price: index,
      sku: index,
      size: index,
      color: index,
    }).strict(),
    confidence,
  }).strict(),
  write_campaign: z.object({ message: z.string().min(1).max(1000) }).strict(),
};
export const other = {
  type: "other",
  language: "mixed",
  items: [],
  confidence: 0,
  missing: ["review"],
} as const;
export function validateOutput(input: Input, raw: unknown): unknown {
  const result = outputSchemas[input.task].parse(raw);
  if (input.task === "analyze_message") {
    const out = analysisSchema.parse(result);
    if (out.type !== "order" && out.items.length) throw Error("items");
    const seen = new Set<string>();
    for (const item of out.items) {
      const p = input.products.find((p) => p.id === item.productId);
      if (
        !p || p.name !== item.name || seen.has(p.id) ||
        (p.variants.length > 0 && !item.variant) ||
        (item.variant &&
          !p.variants.some((v) =>
            v.size === item.variant?.size && v.color === item.variant?.color
          ))
      ) throw Error("catalog");
      seen.add(p.id);
    }
  }
  if (input.task === "read_invoice") {
    for (const row of outputSchemas.read_invoice.parse(result).rows) {
      if (row.productId) {
        const p = input.products.find((p) => p.id === row.productId);
        if (
          !p || p.name !== row.name ||
          (p.variants.length > 0 && !row.variant) ||
          (row.variant &&
            !p.variants.some((v) =>
              v.size === row.variant?.size && v.color === row.variant?.color
            ))
        ) throw Error("catalog");
      }
    }
  }
  if (input.task === "map_excel_columns") {
    const indices = Object.values(
      outputSchemas.map_excel_columns.parse(result).mapping,
    ).filter((i) => i >= 0);
    if (
      indices.some((i) => i >= input.headers.length) ||
      new Set(indices).size !== indices.length
    ) throw Error("columns");
  }
  if (input.task === "write_campaign") {
    // Only server-owned numeric placeholders may appear in copy. Literal numbers,
    // percent/discount claims and unknown placeholders are rejected, never published.
    const message = outputSchemas.write_campaign.parse(result).message;
    const stripped = message.replace(/\{\{price\}\}/g, "");
    if (
      /[\p{N}%％{}]|скид|жеңілдік|discount|percent|пайыз|процент|бесплат|тегін|free|save|saving|эконом|сыйлық|gift/iu
        .test(stripped)
    ) throw Error("invented terms");
    if (
      /(?:^|[^\p{L}])(?:one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|half|один|одна|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|сто|тысяч\p{L}*|половин\p{L}*|бір|екі|үш|төрт|бес|алты|жеті|сегіз|тоғыз|он|жүз|мың|жарты)(?=$|[^\p{L}])/iu
        .test(stripped)
    ) throw Error("invented quantity");
    return {
      message: message.replaceAll("{{price}}", input.opportunity.price.toLocaleString("ru-RU", { maximumFractionDigits: 2 }).replace(/[\u00a0\u202f]/g, " ")),
    };
  }
  return result;
}
