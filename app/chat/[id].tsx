import { AiStatus } from "../../src/components/AiStatus";
import { aiService } from "../../src/services/ai";
import { aiRu } from "../../src/i18n/ru";
import { Screen } from "../../src/components/Screen";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { getResetGeneration, useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { time, v2 as ru } from "../../src/i18n/ru";
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Label,
  Row,
} from "../../src/components/ui";
import { OrderCard } from "../../src/components/OrderCard";
import { useToast } from "../../src/components/Toast";
export default function Chat() {
  const { id, businessId } = useLocalSearchParams<{
    id: string;
    businessId?: string;
  }>();
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const chat = b?.chats.find((c) => c.id === id);
  const customer = b?.customers.find((c) => c.id === chat?.customerId);
  const t = useTheme();
  const toast = useToast();
  const scope = useRef(`${b.id}:${id}`);
  scope.current = `${b.id}:${id}`;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [replyBusy, setReplyBusy] = useState(false);
  async function draftReplies() {
    setReplyBusy(true);
    const requestScope = scope.current;
    const revision = getResetGeneration();
    try {
      const result = await aiService.draftReply(
        b.messages.filter((m) => m.chatId === id),
        b.type,
        b.name,
      );
      if (requestScope === scope.current && revision === getResetGeneration()) {
        setSuggestions(result.replies);
      }
    } finally {
      setReplyBusy(false);
    }
  }
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<string>();
  useEffect(() => {
    if (b) useStore.getState().read(b.id, id);
  }, [b?.id, id]);
  if (!chat) {
    return (
      <Screen back>
        <EmptyState />
      </Screen>
    );
  }
  async function send(text: string) {
    setBusy(true);
    try {
      await useStore.getState().reply(b.id, id, text);
      setInput("");
    } catch {
      toast(ru.error);
    } finally {
      setBusy(false);
    }
  }
  const footer = (
    <View style={{ gap: 8 }}>
      <AiStatus retry={() => void draftReplies()} />
      <Button
        small
        secondary
        title={replyBusy ? aiRu.thinking : aiRu.replies}
        disabled={replyBusy}
        onPress={() => void draftReplies()}
      />
      <Row style={{ flexWrap: "wrap" }}>
        {suggestions.map((reply) => (
          <Chip
            key={reply}
            title={reply}
            onPress={() => setInput(reply)}
          />
        ))}
        {ru.replies.map((label, i) => (
          <Chip
            key={label}
            title={label}
            onPress={() => setInput(ru.replyTexts[i])}
          />
        ))}
      </Row>
      <Row>
        <Field
          value={input}
          onChangeText={setInput}
          placeholder={ru.reply}
          accessibilityLabel={ru.reply}
          multiline
          style={{ flex: 1, backgroundColor: t.tint, borderRadius: 20 }}
        />
        <Button
          title={ru.send}
          icon="send"
          disabled={busy || !input.trim()}
          onPress={() => void send(input)}
        />
      </Row>
    </View>
  );
  return (
    <Screen
      back
      title={customer?.name}
      subtitle={ru[chat.channel]}
      footer={footer}
    >
      <Label muted size={10}>
        {ru.demo}
      </Label>
      {b.messages
        .filter((m) => m.chatId === id)
        .map((message) => {
          const owner = message.role !== "customer";
          const order = b.orders.find((o) => o.messageId === message.id);
          const bubble = (
            <>
              <Label size={14} color={owner ? t.white : t.text}>
                {message.text}
              </Label>
              <Label
                size={10}
                color={owner ? t.white : t.muted}
                style={{ textAlign: "right", opacity: 0.65 }}
              >
                {time(message.createdAt)}
              </Label>
            </>
          );
          return (
            <View key={message.id} style={{ gap: 12 }}>
              <View
                style={{
                  alignSelf: owner ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                }}
              >
                {owner
                  ? (
                    <LinearGradient
                      colors={t.gradient}
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        borderBottomRightRadius: 4,
                      }}
                    >
                      {message.role === "bot" && (
                        <Label size={10} color={t.white}>
                          ✦ Qazyna AI
                        </Label>
                      )}
                      {bubble}
                    </LinearGradient>
                  )
                  : (
                    <View
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        borderBottomLeftRadius: 4,
                        backgroundColor: t.card,
                        ...t.shadow,
                      }}
                    >
                      {bubble}
                    </View>
                  )}
              </View>
              {message.analysis && message.analysis.confidence < 0.7 && (
                <Label color={t.warningText}>
                  {aiRu.review}: {message.analysis.missing?.join(", ")}
                </Label>
              )}
              {order && <OrderCard order={order} businessId={b.id} editable />}
              {message.role === "customer" && !order && (
                <>
                  <Label size={10} muted>
                    {message.analysis?.type === "question"
                      ? ru.question
                      : message.analysis?.type === "feedback" ? ru.feedback : aiRu.other}
                  </Label>
                  <Button
                    small
                    secondary
                    title={analyzing === message.id
                      ? aiRu.thinking
                      : message.analysis?.aiCached
                      ? aiRu.cached
                      : ru.analyze}
                    disabled={!!analyzing || !!message.analysis?.aiCached}
                    onPress={() => {
                      setAnalyzing(message.id);
                      void useStore
                        .getState()
                        .analyze(b.id, message)
                        .catch(() => toast(ru.error))
                        .finally(() => setAnalyzing(undefined));
                    }}
                  />
                </>
              )}
            </View>
          );
        })}
      {b.type === "aru" && (
        <>
          <Button
            title={ru.sendTryon}
            disabled={busy}
            secondary
            onPress={() =>
              void send(
                `${ru.tryonLink}\n${
                  Linking.createURL(`/tryon/${b.products[0].id}`, {
                    queryParams: { businessId: b.id, chatId: id },
                  })
                }`,
              )}
          />
          <Button
            title={ru.tryon}
            secondary
            onPress={() =>
              router.push({
                pathname: "/tryon/[productId]",
                params: {
                  productId: b.products[0].id,
                  businessId: b.id,
                  chatId: id,
                },
              })}
          />
        </>
      )}
    </Screen>
  );
}
