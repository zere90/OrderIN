import { Screen } from "../../src/components/Screen";
import { useState, useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { v2 as ru, time } from "../../src/i18n/ru";
import {
  Label,
  Row,
  Field,
  Button,
  Chip,
  EmptyState,
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
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<string>();
  useEffect(() => {
    if (b) useStore.getState().read(b.id, id);
  }, [b?.id, id]);
  if (!chat)
    return (
      <Screen back>
        <EmptyState />
      </Screen>
    );
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
      <Row style={{ flexWrap: "wrap" }}>
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
                {owner ? (
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
                ) : (
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
              {order && <OrderCard order={order} businessId={b.id} editable />}
              {message.role === "customer" && !order && (
                <>
                  <Label size={10} muted>
                    {message.analysis?.type === "question"
                      ? ru.question
                      : ru.feedback}
                  </Label>
                  <Button
                    small
                    secondary
                    title={analyzing === message.id ? ru.analyzing : ru.analyze}
                    disabled={!!analyzing}
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
                `${ru.tryonLink}\n${Linking.createURL(`/tryon/${b.products[0].id}`, { queryParams: { businessId: b.id, chatId: id } })}`,
              )
            }
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
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
