import { aiRevision } from "./aiScope";
import { aiRu } from "../i18n/ru";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { Analysis, ImportRow, Message, Opportunity, Product } from "../types";
import { AiService, mockAiService } from "./mockAi";
import { aiConfigured, deviceSession, getSupabase } from "./supabase";
import { localDate } from "../data/mock";
export const useAiStatus = create<
  { demo: boolean; busy: number; error: boolean }
>(() => ({ demo: !aiConfigured, busy: 0, error: false }));
const catalog = (products: Product[]) =>
  products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    variants: p.size || p.color ? [{ size: p.size, color: p.color }] : [],
  }));
export class SupabaseAiService implements AiService {
  private pending = new Map<string, Promise<Analysis>>();
  async request<T>(
    body: Record<string, unknown>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    useAiStatus.setState((s) => ({ busy: s.busy + 1, error: false }));
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!aiConfigured) throw Error("demo");
      const remote = (async () => {
        const device = await deviceSession();
        if (controller.signal.aborted) throw Error("timeout");
        const { data, error } = await getSupabase().functions.invoke("ai", {
          body,
          headers: { "x-device-id": device },
          signal: controller.signal,
        });
        if (error || !data || data.error) throw Error("remote");
        return data as T;
      })();
      const result = await Promise.race([
        remote,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(Error("timeout"));
          }, 15000);
        }),
      ]);
      useAiStatus.setState({ demo: false, error: false });
      return result;
    } catch {
      useAiStatus.setState({ demo: true, error: aiConfigured });
      return await fallback();
    } finally {
      if (timer) clearTimeout(timer);
      useAiStatus.setState((s) => ({ busy: Math.max(0, s.busy - 1) }));
    }
  }
  analyzeMessage(
    text: string,
    products: Product[] = [],
    context?: { businessId: string; businessType: string; messageId: string },
  ): Promise<Analysis> {
    const key = context
      ? `orderin-ai-analysis-v1:${context.businessId}:${context.messageId}`
      : undefined;
    if (key && this.pending.has(key)) return this.pending.get(key)!;
    const revision = aiRevision();
    const work = (async () => {
      if (key && typeof window !== "undefined") {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const value = JSON.parse(cached) as Analysis;
            useAiStatus.setState({ demo: !!value.demo });
            return value;
          }
        } catch { /* storage unavailable */ }
      }
      const result = await this.request<Analysis>(
        {
          task: "analyze_message",
          text,
          businessType: context?.businessType || "bakery",
          products: catalog(products),
          today: localDate(new Date()),
        },
        async () => ({
          ...await mockAiService.analyzeMessage(text, products),
          demo: true,
        }),
      );
      result.aiCached = true;
      // Cache fallback too: Retry never resends a customer message; other AI tasks can retry.
      if (key && typeof window !== "undefined" && revision === aiRevision()) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(result));
        } catch { /* in-memory cache still prevents duplicate calls */ }
      }
      return result;
    })();
    if (key) this.pending.set(key, work);
    return work;
  }
  draftReply(
    history: Message[],
    businessType: string,
    shopName: string,
    tone = "friendly",
  ) {
    const latest = history.filter((m) => m.role === "customer").at(-1)?.text ||
      "";
    const replies = /[әіңғүұқөһ]/i.test(latest)
      ? [
        "Сәлем! Толығырақ айта аласыз ба?",
        "Рахмет! Тексеріп, жауап береміз.",
        "Қай уақыт ыңғайлы?",
      ]
      : /[а-яё]/i.test(latest)
      ? aiRu.fallbackReplies
      : [
        "Hello! Could you share a few details?",
        "Thank you! We will check and reply.",
        "What time works for you?",
      ];
    return this.request<{ replies: string[] }>({
      task: "draft_reply",
      history: history.slice(-10).map((m) => ({ role: m.role, text: m.text })),
      businessType,
      shopName,
      tone,
    }, async () => ({ replies }));
  }
  readInvoice(
    image: string,
    products: Product[],
    fallback: () => Promise<ImportRow[]>,
  ) {
    return this.request<
      {
        rows: (ImportRow & {
          unit?: string;
          variant?: { size?: string; color?: string };
        })[];
        supplier?: string;
        date?: string;
      }
    >({
      task: "read_invoice",
      image,
      mimeType: "image/jpeg",
      products: catalog(products),
    }, async () => ({ rows: await fallback() }));
  }
  mapColumns(
    headers: string[],
    sampleRows: unknown[][],
    fallback: Record<string, number>,
  ) {
    return this.request<
      {
        mapping: Record<
          "name" | "qty" | "price" | "sku" | "size" | "color",
          number
        >;
        confidence: number;
      }
    >(
      {
        task: "map_excel_columns",
        headers,
        sampleRows: sampleRows.slice(0, 5),
      },
      async () => ({
        mapping: { ...fallback, sku: -1 } as Record<
          "name" | "qty" | "price" | "sku" | "size" | "color",
          number
        >,
        confidence: 0.5,
      }),
    );
  }
  writeCampaign(
    op: Opportunity,
    customerName: string,
    language: "kk" | "ru" | "en" | "mixed" = "ru",
  ) {
    return this.request<{ message: string }>({
      task: "write_campaign",
      opportunity: {
        type: op.kind,
        title: op.title,
        price: op.price,
        expectedRevenue: op.expectedRevenue,
        recipientCount: op.recipientIds.length,
        draft: op.draft,
      },
      customerName,
      language,
    }, async () => ({ message: op.draft }));
  }
}
export const aiService = new SupabaseAiService();
