import AsyncStorage from "@react-native-async-storage/async-storage";
import { Analysis, Business, Chat, Message } from "../types";
import { deviceSession, getSupabase } from "./supabase";
import { connectionsService } from "./connections";
import { checkDb, invokeMeta, MessagingError, requestId } from "./metaApi";
import type { MessagingService } from "./messaging";
export interface RemoteMessage {
  id: string;
  business_id: string;
  conversation_id: string;
  direction: "in" | "out";
  text: string;
  media_url: string | null;
  media_id: string | null;
  sent_at: string;
  status: string;
  client_request_id: string | null;
}
export interface RemoteConversation {
  id: string;
  business_id: string;
  customer_id: string;
  channel: "instagram" | "whatsapp";
  last_message_at: string | null;
  last_inbound_at: string | null;
  unread_count: number;
}
export interface RemoteCustomer {
  id: string;
  name: string;
  external_user_id: string;
}
export interface RemoteDraft {
  id: string;
  business_id: string;
  message_id: string;
  parsed: Analysis;
  confidence: number;
  status: "draft" | "accepted" | "dismissed";
}
export interface RemoteSnapshot {
  businessId: string;
  conversations: RemoteConversation[];
  customers: RemoteCustomer[];
  messages: RemoteMessage[];
  drafts: RemoteDraft[];
}
export interface MessageTemplate {
  name: string;
  language: string;
  body: string;
  parameterCount: number;
}
export interface TemplateSelection {
  name: string;
  language: string;
  params: string[];
}
export class SupabaseMessagingService implements MessagingService {
  private active = new Map<
    string,
    { payload: string; work: Promise<RemoteMessage> }
  >();
  async getChats(b: Business): Promise<Chat[]> {
    const id = await connectionsService.ensureBusiness(b);
    const s = await this.snapshot(id);
    return s.conversations.map((c) => ({
      id: c.id,
      customerId: c.customer_id,
      channel: c.channel,
      unread: c.unread_count,
    }));
  }
  async snapshot(businessId: string): Promise<RemoteSnapshot> {
    await deviceSession();
    const db = getSupabase();
    const results = await Promise.all([
      db.from("conversations").select("*").eq("business_id", businessId).order(
        "last_message_at",
        { ascending: false },
      ).limit(100),
      db.from("customers").select("id,name,external_user_id").eq(
        "business_id",
        businessId,
      ),
      db.from("messages").select("*").eq("business_id", businessId).order(
        "sent_at",
        { ascending: false },
      ).limit(500),
      db.from("order_drafts").select("*").eq("business_id", businessId),
    ]);
    results.forEach((r) => checkDb(r.error));
    return {
      businessId,
      conversations: results[0].data || [],
      customers: results[1].data || [],
      messages: (results[2].data || []).reverse(),
      drafts: results[3].data || [],
    } as RemoteSnapshot;
  }
  subscribe(businessId: string, onChange: () => void, onError: () => void) {
    const db = getSupabase();
    const channel = db.channel(`messages:${businessId}:${requestId()}`);
    for (const table of ["conversations", "messages", "order_drafts"]) {
      channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table,
        filter: `business_id=eq.${businessId}`,
      }, onChange);
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") onChange();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") onError();
    });
    return () => {
      void db.removeChannel(channel);
    };
  }
  async sendMessage(
    chatId: string,
    text: string,
    role: Message["role"] = "seller",
  ): Promise<Message> {
    const message = await this.send(chatId, text);
    return {
      id: message.id,
      chatId,
      text: message.text,
      role,
      createdAt: message.sent_at,
    };
  }
  send(
    conversationId: string,
    text: string,
    template?: TemplateSelection,
  ): Promise<RemoteMessage> {
    const payload = JSON.stringify({ text, template });
    const existing = this.active.get(conversationId);
    if (existing) {
      return existing.payload === payload
        ? existing.work
        : Promise.reject(new MessagingError("send_unknown"));
    }
    const work = this.sendOnce(conversationId, text, template).finally(() =>
      this.active.delete(conversationId)
    );
    this.active.set(conversationId, { payload, work });
    return work;
  }
  private async sendOnce(
    conversationId: string,
    text: string,
    template?: TemplateSelection,
  ): Promise<RemoteMessage> {
    await deviceSession();
    const key = `orderin-meta-outbox:${conversationId}`;
    const encoded = JSON.stringify({ text, template });
    const cached = await AsyncStorage.getItem(key);
    const previous = cached
      ? JSON.parse(cached) as { requestId: string; encoded: string }
      : null;
    // Keep the same identifier across network failures/restarts. Never assume a timeout means not sent.
    if (previous && previous.encoded !== encoded) {
      throw new MessagingError("send_unknown");
    }
    const request = previous || { requestId: requestId(), encoded };
    await AsyncStorage.setItem(key, JSON.stringify(request));
    try {
      const result = await invokeMeta<{ message: RemoteMessage }>(
        "send-message",
        { conversationId, text, template, requestId: request.requestId },
      );
      if (["sending", "unknown"].includes(result.message.status)) {
        throw new MessagingError("send_unknown");
      }
      if (result.message.status === "failed") {
        await AsyncStorage.removeItem(key);
        throw new MessagingError("send_failed");
      }
      await AsyncStorage.removeItem(key);
      return result.message;
    } catch (e) {
      if (
        e instanceof MessagingError &&
        [
          "send_failed",
          "template_required",
          "window_closed",
          "invalid_template",
          "invalid_input",
          "reconnect",
          "forbidden",
        ].includes(e.code)
      ) await AsyncStorage.removeItem(key);
      throw e;
    }
  }
  async clearPendingAfterReview(conversationId: string) {
    await AsyncStorage.removeItem(`orderin-meta-outbox:${conversationId}`);
  }
  async templates(conversationId: string) {
    return (await invokeMeta<{ templates: MessageTemplate[] }>("send-message", {
      task: "templates",
      conversationId,
    })).templates;
  }
  async read(conversationId: string, seenAt: string) {
    const { error } = await getSupabase().rpc("mark_conversation_read", {
      cid: conversationId,
      seen_at: seenAt,
    });
    checkDb(error);
  }
  async updateDraft(id: string, status: "accepted" | "dismissed") {
    const { error } = await getSupabase().from("order_drafts").update({
      status,
    }).eq("id", id);
    checkDb(error);
  }
}
export const remoteMessagingService = new SupabaseMessagingService();
