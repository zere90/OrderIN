import { aiService, useAiStatus } from "./supabaseAi";
import * as XLSX from "xlsx";
import { ImportRow, Product } from "../types";
import { v2 as ru } from "../i18n/ru";
import { productKey, validateImport } from "./inventory";
export type ColumnField = "name" | "qty" | "price" | "size" | "color";
export type ColumnMapping = Record<ColumnField, number>;
export interface WorkbookTable {
  headers: string[];
  rows: unknown[][];
}
export interface ImportService {
  parse(data: ArrayBuffer | string, type?: "array" | "base64"): WorkbookTable;
  guess(headers: string[]): ColumnMapping;
  map(table: WorkbookTable, mapping: ColumnMapping): ImportRow[];
  recognize(products: Product[], image?: string): Promise<ImportRow[]>;
}
const aliases: Record<ColumnField, string[]> = {
  name: [
    "название",
    "товар",
    "наименование",
    "атауы",
    "өнім",
    "name",
    "product",
    "item",
  ],
  qty: [
    "количество",
    "кол-во",
    "остаток",
    "остатки",
    "qty",
    "quantity",
    "stock",
    "саны",
  ],
  price: ["цена", "стоимость", "price", "баға", "бағасы"],
  size: ["размер", "size", "өлшем"],
  color: ["цвет", "color", "colour", "түс"],
};
const numeric = (v: unknown) =>
  typeof v === "number"
    ? v
    : Number(
        String(v ?? "")
          .replace(/[\s₸]/g, "")
          .replace(",", "."),
      );
export const importService: ImportService = {
  parse(data, type = "array") {
    try {
      const bytes = type === "array" && typeof data !== "string" ? new Uint8Array(data) : undefined;
      const isBinary = bytes && ((bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf));
      const book = bytes && !isBinary
        ? XLSX.read(new TextDecoder("utf-8").decode(bytes), {type:"string", dense:true})
        : XLSX.read(data, { type, dense: true });
      const sheet = book.Sheets[book.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
      });
      if (raw.length < 2 || raw.length > 501) throw Error(ru.emptyFile);
      return {
        headers: raw[0].map(String),
        rows: raw.slice(1).filter((row) => row.some((v) => v !== "")),
      };
    } catch (e) {
      throw Error(
        e instanceof Error && e.message === ru.emptyFile
          ? ru.emptyFile
          : ru.badFile,
      );
    }
  },
  guess(headers) {
    const normalized = headers.map((h) => h.trim().toLowerCase());
    return Object.fromEntries(
      Object.entries(aliases).map(([field, names]) => [
        field,
        normalized.findIndex((h) =>
          names.some((n) => h === n || h.startsWith(n + " ")),
        ),
      ]),
    ) as ColumnMapping;
  },
  map(table, mapping) {
    const required = [mapping.name, mapping.qty, mapping.price];
    const chosen = Object.values(mapping).filter((i) => i >= 0);
    if (required.some((i) => i < 0) || new Set(chosen).size !== chosen.length)
      throw Error(ru.columnsRequired);
    const rows = table.rows.map((row) => ({
      name: String(row[mapping.name] || "").trim(),
      qty: row[mapping.qty] === "" ? NaN : numeric(row[mapping.qty]),
      price: row[mapping.price] === "" ? NaN : numeric(row[mapping.price]),
      size: mapping.size >= 0 ? String(row[mapping.size] || "") : undefined,
      color: mapping.color >= 0 ? String(row[mapping.color] || "") : undefined,
      confidence: 1,
    }));
    validateImport(rows, "replace");
    return rows;
  },
  async recognize(products, image) {
    if (image) {
      const result = await aiService.readInvoice(image, products, () => importService.recognize(products));
      return result.rows.map(row => ({...row, size: row.variant?.size ?? row.size, color: row.variant?.color ?? row.color}));
    }
    useAiStatus.setState({demo:true});
    await new Promise((r) => setTimeout(r, 1500));
    return products.slice(0, 4).map((p, i) => ({
      productId: p.id,
      name: p.name,
      qty: [5, 20, 24, 2][i],
      price: p.price,
      size: p.size,
      color: p.color,
      confidence: [0.98, 0.95, 0.72, 0.41][i],
    }));
  },
};
export function previewChanges(rows: ImportRow[], products: Product[]) {
  return rows.map((row) => {
    const old = products.find((p) => productKey(p) === productKey(row));
    return {
      ...row,
      before: old?.stock || 0,
      delta: row.qty - (old?.stock || 0),
      previousPrice: old?.price,
    };
  });
}
