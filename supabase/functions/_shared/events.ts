import { z } from "zod";
const id = z.string().min(1).max(300);
const anyObject = z.record(z.string(), z.unknown());
const envelope = z.object({
  object: z.string(),
  entry: z.array(anyObject).max(100),
});
export type MetaEvent = {
  channel: "whatsapp" | "instagram";
  account: string;
  user: string;
  name: string;
  external: string;
  text: string;
  mediaUrl: string | null;
  mediaId: string | null;
  sentAt: string;
  direction: "in" | "out";
};
export type StatusEvent = {
  channel: "whatsapp" | "instagram";
  account: string;
  external: string;
  status: "sent" | "delivered" | "read" | "failed";
  at: string;
};
const stamp = (value: unknown, milliseconds = false) => {
  const n = Number(value) * (milliseconds ? 1 : 1000);
  if (!Number.isFinite(n) || n <= 0 || n > Date.now() + 300000) {
    throw Error("timestamp");
  }
  return new Date(n).toISOString();
};
const str = (v: unknown) => typeof v === "string" ? v : "";
const secureUrl = (v: unknown) =>
  typeof v === "string" && v.startsWith("https://") ? v : null;
export function parseEvents(
  raw: unknown,
): { messages: MetaEvent[]; statuses: StatusEvent[] } {
  const payload = envelope.parse(raw);
  const messages: MetaEvent[] = [];
  const statuses: StatusEvent[] = [];
  if (payload.object === "whatsapp_business_account") {
    for (const entry of payload.entry) {
      const changes = z.array(anyObject).max(100).parse(entry.changes || []);
      for (const change of changes) {
        if (change.field !== "messages") {
          continue;
        }
        const value = z.object({
          metadata: z.object({ phone_number_id: id }),
          messages: z.array(anyObject).max(100).optional(),
          contacts: z.array(anyObject).optional(),
          statuses: z.array(anyObject).max(100).optional(),
        }).parse(change.value);
        const account = value.metadata.phone_number_id;
        for (const m of value.messages || []) {
          const from = id.parse(m.from);
          const contact = value.contacts?.find((c) => c.wa_id === from);
          const profile = contact?.profile as
            | Record<string, unknown>
            | undefined;
          const media = m[str(m.type)] as Record<string, unknown> | undefined;
          const interactive = m.interactive as
            | Record<string, Record<string, unknown>>
            | undefined;
          const text = str((m.text as Record<string, unknown>)?.body) ||
            str(media?.caption) || str(interactive?.button_reply?.title) ||
            str(interactive?.list_reply?.title);
          messages.push({
            channel: "whatsapp",
            account,
            user: from,
            name: str(profile?.name) || from,
            external: `whatsapp:${id.parse(m.id)}`,
            text: text.slice(0, 10000),
            mediaUrl: null,
            mediaId:
              ["image", "audio", "video", "document", "sticker"].includes(
                  str(m.type),
                )
                ? str(media?.id) || null
                : null,
            sentAt: stamp(m.timestamp),
            direction: "in",
          });
        }
        for (const s of value.statuses || []) {
          if (["sent", "delivered", "read", "failed"].includes(str(s.status))) {
            statuses.push({
              channel: "whatsapp",
              account,
              external: `whatsapp:${id.parse(s.id)}`,
              status: s.status as StatusEvent["status"],
              at: stamp(s.timestamp),
            });
          }
        }
      }
    }
  }
  if (payload.object === "instagram") {
    for (const entry of payload.entry) {
      const account = id.parse(entry.id);
      for (
        const ev of z.array(anyObject).max(100).parse(entry.messaging || [])
      ) {
        const sender = id.parse((ev.sender as Record<string, unknown>)?.id);
        const recipient = id.parse(
          (ev.recipient as Record<string, unknown>)?.id,
        );
        const m = ev.message as Record<string, unknown> | undefined;
        const read = ev.read as Record<string, unknown> | undefined;
        if (read?.mid) {
          statuses.push({
            channel: "instagram",
            account,
            external: `instagram:${id.parse(read.mid)}`,
            status: "read",
            at: stamp(ev.timestamp, true),
          });
        }
        if (!m?.mid) continue;
        const echo = m.is_echo === true || sender === account;
        const attachments = Array.isArray(m.attachments)
          ? m.attachments as Record<string, unknown>[]
          : [];
        const media = attachments[0]?.payload as
          | Record<string, unknown>
          | undefined;
        messages.push({
          channel: "instagram",
          account,
          user: echo ? recipient : sender,
          name: echo ? recipient : sender,
          external: `instagram:${id.parse(m.mid)}`,
          text: str(m.text).slice(0, 10000),
          mediaUrl: secureUrl(media?.url),
          mediaId: null,
          sentAt: stamp(ev.timestamp, true),
          direction: echo ? "out" : "in",
        });
      }
    }
  }
  return { messages, statuses };
}
export function inWindow(lastInbound: string | null, now = Date.now()) {
  if (!lastInbound) return false;
  const at = Date.parse(lastInbound);
  return Number.isFinite(at) && at <= now && now - at < 24 * 60 * 60 * 1000;
}
