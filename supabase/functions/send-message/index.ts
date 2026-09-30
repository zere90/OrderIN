import { z } from "zod";
import {
  admin,
  body,
  checked,
  graph,
  HttpError,
  json,
  owns,
  secret,
  serve,
  user,
} from "../_shared/meta.ts";
import { decryptToken, hash } from "../_shared/crypto.ts";
import { inWindow } from "../_shared/events.ts";
import { templates } from "../_shared/templates.ts";
const schema = z.object({
  conversationId: z.uuid(),
  text: z.string().trim().max(2000).default(""),
  requestId: z.uuid().optional(),
  task: z.literal("templates").optional(),
  template: z.object({
    name: z.string().max(100),
    language: z.string().max(20),
    params: z.array(z.string().max(500)).max(10),
  }).strict().optional(),
}).strict();
serve(async (req) => {
  if (req.method !== "POST") throw new HttpError(405, "method");
  const seller = await user(req);
  const parsed = schema.safeParse(await body(req));
  if (!parsed.success) throw new HttpError(400, "invalid_input");
  const input = parsed.data;
  const db = admin();
  const conv = await checked(
    db.from("conversations").select("*").eq("id", input.conversationId)
      .maybeSingle(),
  );
  if (!conv) throw new HttpError(404, "not_found");
  await owns(conv.business_id, seller.id);
  const payloadHash = await hash(
    JSON.stringify({ text: input.text, template: input.template }),
  );
  if (input.requestId) {
    const existing = await checked(
      db.from("messages").select("*").eq("client_request_id", input.requestId)
        .maybeSingle(),
    );
    if (existing) {
      if (
        existing.conversation_id !== conv.id ||
        existing.request_payload_hash !== payloadHash
      ) throw new HttpError(409, "request_conflict");
      return json({ message: existing, idempotent: true });
    }
  }
  const ch = await checked(
    db.from("channels").select("*").eq("business_id", conv.business_id).eq(
      "type",
      conv.channel,
    ).single(),
  );
  if (
    ch.status !== "connected" ||
    (ch.token_expires_at && Date.parse(ch.token_expires_at) <= Date.now())
  ) throw new HttpError(409, "reconnect");
  const token = await decryptToken(
    ch.token_encrypted,
    secret("META_TOKEN_ENCRYPTION_KEY"),
    `${ch.business_id}:${ch.type}:${ch.external_id}`,
  );
  if (input.task === "templates") {
    return json({
      templates: conv.channel === "whatsapp"
        ? await templates(ch.waba_id, token)
        : [],
    });
  }
  if (!input.requestId) throw new HttpError(400, "request_id_required");
  if (!inWindow(conv.last_inbound_at) && conv.channel === "instagram") {
    throw new HttpError(409, "window_closed");
  }
  if (!inWindow(conv.last_inbound_at) && !input.template) {
    throw new HttpError(
      409,
      conv.channel === "whatsapp" ? "template_required" : "window_closed",
    );
  }
  const customer = await checked(
    db.from("customers").select("external_user_id").eq("id", conv.customer_id)
      .single(),
  );
  if (!customer) throw new HttpError(404, "not_found");
  let text = input.text;
  let graphBody: unknown;
  if (input.template) {
    if (conv.channel !== "whatsapp") {
      throw new HttpError(400, "invalid_template");
    }
    const approved = (await templates(ch.waba_id, token)).find((t) =>
      t.name === input.template!.name && t.language === input.template!.language
    );
    if (!approved || approved.parameterCount !== input.template.params.length) {
      throw new HttpError(400, "invalid_template");
    }
    text = approved.body.replace(
      /\{\{(\d+)\}\}/g,
      (_, n) => input.template!.params[Number(n) - 1],
    );
    graphBody = {
      messaging_product: "whatsapp",
      to: customer.external_user_id,
      type: "template",
      template: {
        name: approved.name,
        language: { code: approved.language },
        components: approved.parameterCount
          ? [{
            type: "body",
            parameters: input.template.params.map((text) => ({
              type: "text",
              text,
            })),
          }]
          : [],
      },
    };
  } else {
    if (!text) throw new HttpError(400, "invalid_input");
    graphBody = conv.channel === "whatsapp"
      ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customer.external_user_id,
        type: "text",
        text: { body: text },
      }
      : { recipient: { id: customer.external_user_id }, message: { text } };
  }
  const reserved = await db.from("messages").insert({
    business_id: conv.business_id,
    conversation_id: conv.id,
    direction: "out",
    text,
    status: "sending",
    client_request_id: input.requestId,
    request_payload_hash: payloadHash,
  }).select("*").single();
  if (reserved.error) {
    if (reserved.error.code === "23505") {
      const message = await checked(
        db.from("messages").select("*").eq("client_request_id", input.requestId)
          .eq("conversation_id", conv.id).single(),
      );
      if (message?.request_payload_hash !== payloadHash) {
        throw new HttpError(409, "request_conflict");
      }
      return json({ message, idempotent: true });
    }
    throw new HttpError(503, "database");
  }
  const message = reserved.data;
  try {
    const result = await graph(
      conv.channel === "whatsapp"
        ? `${encodeURIComponent(ch.external_id)}/messages`
        : "me/messages",
      token,
      {
        instagram: conv.channel === "instagram",
        method: "POST",
        data: graphBody,
      },
    );
    const external = conv.channel === "whatsapp"
      ? result.messages?.[0]?.id
      : result.message_id;
    if (typeof external !== "string") throw Error("ambiguous response");
    const saved = await checked(
      db.rpc("complete_meta_send", {
        p_message: message.id,
        p_external: `${conv.channel}:${external}`,
      }),
    );
    return json({ message: saved });
  } catch (e) {
    // A timeout can mean Meta accepted the message. Never automatically resend an ambiguous send.
    if (e instanceof HttpError && e.code === "reconnect") {
      await db.from("channels").update({ status: "error" }).eq("id", ch.id);
      await db.from("messages").update({ status: "failed" }).eq(
        "id",
        message.id,
      ).eq("status", "sending");
      throw e;
    }
    const status =
      e instanceof HttpError && e.code === "meta_rejected" && e.status === 400
        ? "failed"
        : "unknown";
    await db.from("messages").update({ status }).eq("id", message.id).eq(
      "status",
      "sending",
    );
    throw new HttpError(
      status === "failed" ? 502 : 409,
      status === "failed" ? "send_failed" : "send_unknown",
    );
  }
});
