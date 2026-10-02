import { aiService } from "../services/ai";
import { AiStatus } from "./AiStatus";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useStore } from "../store";
import { useRemoteMessaging } from "../hooks/useRemoteMessaging";
import {
  MessageTemplate,
  remoteMessagingService,
  TemplateSelection,
} from "../services/remoteMessaging";
import { messagingErrorText, serviceWindowOpen } from "../services/metaApi";
import { Screen } from "./Screen";
import { OpportunityCard } from "./OpportunityCard";
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  Field,
  Label,
  Row,
} from "./ui";
import { useTheme } from "../theme";
import { aiRu, metaRu, money, time } from "../i18n/ru";
export function RemoteChat(
  { id, businessId }: { id: string; businessId?: string },
) {
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const t = useTheme();
  const { snapshot, error, loading, refresh } = useRemoteMessaging(b);
  const conv = snapshot?.conversations.find((c) => c.id === id);
  const customer = snapshot?.customers.find((c) => c.id === conv?.customer_id);
  const messages = snapshot?.messages.filter((m) => m.conversation_id === id) ||
    [];
  const [suggestions, setSuggestions] = useState<string[]>([]);
  async function suggest() {
    setBusy(true);
    try {
      const result = await aiService.draftReply(
        messages.map((m) => ({
          id: m.id,
          chatId: id,
          text: m.text,
          role: m.direction === "in" ? "customer" as const : "seller" as const,
          createdAt: m.sent_at,
        })),
        b.type,
        b.name,
      );
      setSuggestions(result.replies);
    } finally {
      setBusy(false);
    }
  }
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [sendError, setSendError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [review, setReview] = useState(false);
  const [picker, setPicker] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [chosen, setChosen] = useState<MessageTemplate>();
  const [params, setParams] = useState<string[]>([]);
  const [kaspi, setKaspi] = useState(false);
  const [url, setUrl] = useState("");
  const windowOpen = serviceWindowOpen(conv?.last_inbound_at, now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const lastInbound = messages.filter((m) => m.direction === "in").at(-1)
    ?.sent_at;
  useEffect(() => {
    if (lastInbound) {
      void remoteMessagingService.read(id, lastInbound).catch(() => {});
    }
  }, [id, lastInbound]);
  async function send(text: string, template?: TemplateSelection) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setSendError("");
    try {
      await remoteMessagingService.send(id, text, template);
      setInput("");
      setKaspi(false);
      setPicker(false);
      refresh();
    } catch (e) {
      setSendError(messagingErrorText(e));
      refresh();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function chooseTemplates() {
    setBusy(true);
    setSendError("");
    try {
      setTemplates(await remoteMessagingService.templates(id));
      setPicker(true);
    } catch (e) {
      setSendError(messagingErrorText(e));
    } finally {
      setBusy(false);
    }
  }
  const footer = (
    <View style={{ gap: 8 }}>
      <AiStatus retry={() => void suggest()} />
      <Button
        small
        secondary
        title={aiRu.replies}
        disabled={busy || !messages.length}
        onPress={() => void suggest()}
      />
      <Row style={{ flexWrap: "wrap" }}>
        {suggestions.map((reply) => (
          <Chip
            key={reply}
            title={reply}
            onPress={() => setInput(reply)}
          />
        ))}
      </Row>
      {!!sendError && (
        <>
          <Label color={t.danger}>{sendError}</Label>
          <Button
            small
            secondary
            title={metaRu.reviewSend}
            onPress={() => setReview(true)}
          />
        </>
      )}
      {conv && !windowOpen && (
        <Label color={t.warningText}>{metaRu.closed}</Label>
      )}
      {conv?.channel === "whatsapp" && !windowOpen
        ? (
          <Button
            title={metaRu.chooseTemplate}
            disabled={busy}
            onPress={() => void chooseTemplates()}
          />
        )
        : (
          <Row>
            <Field
              style={{ flex: 1 }}
              multiline
              value={input}
              onChangeText={setInput}
              placeholder={metaRu.reply}
            />
            <Button
              title={metaRu.send}
              disabled={busy || !windowOpen || !input.trim()}
              onPress={() => void send(input)}
            />
          </Row>
        )}
      <Button
        small
        secondary
        title={metaRu.kaspi}
        disabled={!windowOpen || busy}
        onPress={() => setKaspi(true)}
      />
    </View>
  );
  return (
    <Screen
      back
      title={customer?.name || metaRu.loading}
      subtitle={conv?.channel}
      footer={conv ? footer : undefined}
    >
      {loading && <Label>{metaRu.loading}</Label>}
      {!loading && !conv && <Label>{metaRu.missingChat}</Label>}
      {!!error && <Label color={t.danger}>{error}</Label>}
      <Button small secondary title={metaRu.refresh} onPress={refresh} />
      {messages.map((m) => {
        const draft = snapshot?.drafts.find((d) => d.message_id === m.id);
        return (
          <View key={m.id} style={{ gap: 8 }}>
            <Card
              style={{
                backgroundColor: m.direction === "out" ? t.tint : t.card,
              }}
            >
              <Label>{m.text || metaRu.attachment}</Label>
              {!!(m.media_id || m.media_url) && (
                <Label muted>{metaRu.attachment}</Label>
              )}
              <Label muted size={10}>
                {time(m.sent_at)} · {metaRu.delivery[m.status] || m.status}
              </Label>
            </Card>
            {draft && (
              <OpportunityCard>
                <Label bold>{metaRu.draft}</Label>
                {draft.confidence < 0.7 && (
                  <Label color={t.warningText}>{aiRu.review}</Label>
                )}
                {draft.parsed.items.map((item, i) => {
                  const p = b.products.find((p) => p.id === item.productId);
                  return (
                    <Label
                      key={i}
                      color={draft.confidence < 0.7 ? t.warningText : t.text}
                    >
                      {p?.name || item.productId} {p?.size} {p?.color}{" "}
                      ×{item.qty}
                      {p ? ` · ${money(p.price * item.qty)}` : ""}
                    </Label>
                  );
                })}
                <Label>
                  {draft.parsed.date ? new Date(`${draft.parsed.date}T12:00:00`).toLocaleDateString("ru-RU") : ""} {draft.parsed.time} {draft.parsed.address}
                </Label>
                <Label muted size={11}>{metaRu.draftHint}</Label>
                {draft.status === "draft"
                  ? (
                    <Row>
                      <Button
                        small
                        title={metaRu.accept}
                        disabled={busy}
                        onPress={() =>
                          void remoteMessagingService.updateDraft(
                            draft.id,
                            "accepted",
                          ).then(refresh).catch(() =>
                            setSendError(metaRu.errors.unavailable)
                          )}
                      />
                      <Button
                        small
                        secondary
                        title={metaRu.dismiss}
                        disabled={busy}
                        onPress={() =>
                          void remoteMessagingService.updateDraft(
                            draft.id,
                            "dismissed",
                          ).then(refresh).catch(() =>
                            setSendError(metaRu.errors.unavailable)
                          )}
                      />
                    </Row>
                  )
                  : (
                    <Label>
                      {draft.status === "accepted"
                        ? metaRu.accepted
                        : metaRu.dismissed}
                    </Label>
                  )}
              </OpportunityCard>
            )}
          </View>
        );
      })}
      <BottomSheet
        visible={review}
        onClose={() => setReview(false)}
        title={metaRu.reviewSend}
      >
        <Label>{metaRu.reviewSendHint}</Label>
        <Button
          title={metaRu.unlock}
          onPress={() =>
            void remoteMessagingService.clearPendingAfterReview(id).then(() => {
              setReview(false);
              setSendError("");
              setInput("");
            })}
        />
      </BottomSheet>
      <BottomSheet
        visible={picker}
        onClose={() => setPicker(false)}
        title={metaRu.template}
      >
        {!!sendError && <Label color={t.danger}>{sendError}</Label>}
        {!templates.length && <Label>{metaRu.noTemplates}</Label>}
        {templates.map((template) => (
          <Chip
            key={`${template.name}:${template.language}`}
            title={`${template.name} · ${template.language}`}
            active={chosen === template}
            onPress={() => {
              setChosen(template);
              setParams(Array(template.parameterCount).fill(""));
            }}
          />
        ))}
        {chosen && (
          <>
            <Label>{chosen.body}</Label>
            {params.map((value, i) => (
              <Field
                key={i}
                placeholder={`${metaRu.parameter} ${i + 1}`}
                value={value}
                onChangeText={(text) =>
                  setParams((p) => p.map((v, j) => j === i ? text : v))}
              />
            ))}
            <Button
              title={metaRu.sendTemplate}
              disabled={busy || params.some((p) => !p.trim())}
              onPress={() =>
                void send("", {
                  name: chosen.name,
                  language: chosen.language,
                  params,
                })}
            />
          </>
        )}
      </BottomSheet>
      <BottomSheet
        visible={kaspi}
        onClose={() => setKaspi(false)}
        title={metaRu.kaspi}
      >
        <Label>{metaRu.kaspiHint}</Label>
        <Field
          value={url}
          onChangeText={setUrl}
          placeholder={metaRu.kaspiUrl}
        />
        {!!sendError && <Label color={t.danger}>{sendError}</Label>}
        <Button
          title={metaRu.kaspi}
          disabled={busy}
          onPress={() => {
            try {
              const parsed = new URL(url);
              if (
                parsed.protocol !== "https:" ||
                !(parsed.hostname === "kaspi.kz" ||
                  parsed.hostname.endsWith(".kaspi.kz"))
              ) throw Error();
              void send(url);
            } catch {
              setSendError(metaRu.invalidKaspi);
            }
          }}
        />
      </BottomSheet>
    </Screen>
  );
}
