import { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../src/store";
import { customers } from "../../src/data/mock";
import { ru, time } from "../../src/i18n/ru";
import { useTheme } from "../../src/theme";
import {
  Button,
  ChannelBadge,
  EmptyState,
  Field,
  Label,
  Row,
} from "../../src/components/ui";
import { OrderCard } from "../../src/components/OrderCard";
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, messages, orders } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<string>();
  const scroll = useRef<ScrollView>(null);
  const chat = chats.find((ch) => ch.id === id);
  const customer = customers.find((c) => c.id === chat?.customerId);
  useEffect(() => {
    useStore.getState().read(id);
  }, [id]);
  if (!chat) return <EmptyState />;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: customer?.name }} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Row>
          <ChannelBadge channel={chat.channel} />
          <Label muted size={10}>
            {ru.demo}
          </Label>
        </Row>
        {messages
          .filter((m) => m.chatId === id)
          .map((message) => {
            const order = orders.find((o) => o.messageId === message.id);
            return (
              <View key={message.id} style={{ gap: 10 }}>
                <View
                  style={{
                    alignSelf:
                      message.role === "customer" ? "flex-start" : "flex-end",
                    maxWidth: "90%",
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor:
                      message.role === "customer" ? c.card : c.bubble,
                    gap: 6,
                  }}
                >
                  {message.role === "bot" && (
                    <Label size={11} bold>
                      ✦ {ru.ai}
                    </Label>
                  )}
                  <Label>{message.text}</Label>
                  <Label muted size={10}>
                    {time(message.createdAt)}
                  </Label>
                </View>
                {message.analysis && message.analysis.type !== "order" && (
                  <Label muted size={11}>
                    {ru[message.analysis.type]}
                  </Label>
                )}
                {order && (
                  <>
                    <Label muted size={11}>
                      ✦ {ru.detected} · {ru.confidence}{" "}
                      {Math.round((message.analysis?.confidence || 0) * 100)}%
                    </Label>
                    <OrderCard order={order} editable />
                  </>
                )}
                {message.role === "customer" && !order && (
                  <Button
                    title={analyzing === message.id ? ru.analyzing : ru.analyze}
                    disabled={!!analyzing}
                    secondary
                    onPress={() => {
                      setAnalyzing(message.id);
                      void useStore
                        .getState()
                        .analyze(message)
                        .catch(() => Alert.alert(ru.error))
                        .finally(() => setAnalyzing(undefined));
                    }}
                  />
                )}
              </View>
            );
          })}
      </ScrollView>
      <View
        style={{
          padding: 12,
          paddingBottom: Math.max(12, inset.bottom),
          backgroundColor: c.card,
          borderTopWidth: 1,
          borderColor: c.border,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Field
          accessibilityLabel={ru.reply}
          value={text}
          onChangeText={setText}
          placeholder={ru.reply}
          style={{ flex: 1 }}
          multiline
        />
        <Button
          title={ru.send}
          disabled={!text.trim() || busy}
          onPress={() => {
            setBusy(true);
            void useStore
              .getState()
              .reply(id, text)
              .then(() => {
                setText("");
                setTimeout(
                  () => scroll.current?.scrollToEnd({ animated: true }),
                  100,
                );
              })
              .catch(() => Alert.alert(ru.error))
              .finally(() => setBusy(false));
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
