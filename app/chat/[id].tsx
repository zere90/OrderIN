import { aiConfigured } from "../../src/services/supabase";
import { RemoteChat } from "../../src/components/RemoteChat";
import { AiStatus } from "../../src/components/AiStatus";
import { aiService } from "../../src/services/ai";
import { aiRu } from "../../src/i18n/ru";
import { Screen } from "../../src/components/Screen";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
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
  SpringPress,
} from "../../src/components/ui";
import { Icon } from "../../src/components/Icon";
import { OrderCard } from "../../src/components/OrderCard";
import { useToast } from "../../src/components/Toast";
import { Message } from "../../src/types";

function AnalysisTag({ message }: { message: Message }) {
  const t = useTheme();
  const a = message.analysis;
  if (!a) return null;
  const label = a.type === "question"
    ? ru.question
    : a.type === "feedback"
    ? ru.feedback
    : a.type === "order"
    ? ru.detected
    : aiRu.other;
  return (
    <Row style={{ gap: 6 }}>
      <View
        style={{
          backgroundColor: t.tint,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Label size={10} bold color={t.accent}>
          ✦ {label} · {Math.round(a.confidence * 100)}%
        </Label>
      </View>
      {a.demo && (
        <Label size={10} muted>
          {aiRu.demo}
        </Label>
      )}
    </Row>
  );
}

function DemoChat({ id, businessId }: { id: string; businessId?: string }) {
  const b = useStore((s) =>
    (businessId && s.businesses[businessId]) || s.businesses[s.currentBusinessId]
  );
  const chat = b?.chats.find((c) => c.id === id);
  const customer = b?.customers.find((c) => c.id === chat?.customerId);
  const t = useTheme();
  const toast = useToast();
  const scope = useRef(`${b?.id}:${id}`);
  scope.current = `${b?.id}:${id}`;
  const scroll = useRef<ScrollView>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [replyBusy, setReplyBusy] = useState(false);
  const [input, setInput] = useState("");
  const [asCustomer, setAsCustomer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState<string>();
  useEffect(() => {
    if (b && chat) useStore.getState().read(b.id, id);
  }, [b?.id, id, !!chat]);
  if (!b || !chat) {
    return (
      <Screen back title={ru.inbox}>
        <EmptyState title={ru.chatMissing} hint={ru.chatMissingHint} />
      </Screen>
    );
  }
  const business = b;
  const messages = business.messages.filter((m) => m.chatId === id);

  async function draftReplies() {
    setReplyBusy(true);
    const requestScope = scope.current;
    const revision = getResetGeneration();
    try {
      const result = await aiService.draftReply(
        messages,
        business.type,
        business.name,
      );
      if (requestScope === scope.current && revision === getResetGeneration()) {
        setSuggestions(result.replies);
      }
    } finally {
      setReplyBusy(false);
    }
  }
  async function analyze(message: Message) {
    setAnalyzing(message.id);
    try {
      await useStore.getState().analyze(business.id, message);
    } catch {
      toast(ru.error);
    } finally {
      setAnalyzing(undefined);
    }
  }
  async function send(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    try {
      if (asCustomer) {
        const message = useStore.getState().receive(business.id, id, text);
        setInput("");
        if (message) await analyze(message);
      } else {
        await useStore.getState().reply(business.id, id, text);
        setInput("");
      }
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    } catch {
      toast(ru.error);
    } finally {
      setBusy(false);
    }
  }
  const footer = (
    <View style={{ gap: 10 }}>
      <AiStatus hideDemo retry={() => void draftReplies()} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip
          title={replyBusy ? aiRu.thinking : `✦ ${aiRu.replies}`}
          active
          onPress={() => {
            if (!replyBusy) void draftReplies();
          }}
        />
        {suggestions.map((reply) => (
          <Chip key={reply} title={reply} onPress={() => setInput(reply)} />
        ))}
        {ru.replies.map((label, i) => (
          <Chip
            key={label}
            title={label}
            onPress={() => setInput(ru.replyTexts[i])}
          />
        ))}
      </ScrollView>
      <Row style={{ alignItems: "flex-end" }}>
        <SpringPress
          label={asCustomer ? ru.asCustomerOn : ru.asCustomerOff}
          selected={asCustomer}
          onPress={() => setAsCustomer((v) => !v)}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: asCustomer ? t.primary : t.tint,
            }}
          >
            <Icon
              name="person"
              size={20}
              color={asCustomer ? t.white : t.accent}
            />
          </View>
        </SpringPress>
        <Field
          value={input}
          onChangeText={setInput}
          placeholder={asCustomer ? ru.customerPlaceholder : ru.reply}
          accessibilityLabel={ru.reply}
          multiline
          style={{
            flex: 1,
            backgroundColor: t.tint,
            borderRadius: 22,
            borderColor: asCustomer ? t.accent : t.border,
            maxHeight: 110,
          }}
        />
        <SpringPress
          label={ru.send}
          disabled={busy || !input.trim()}
          onPress={() => void send(input)}
        >
          <LinearGradient
            colors={t.gradient}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="send" size={20} color={t.white} />
          </LinearGradient>
        </SpringPress>
      </Row>
      {asCustomer && (
        <Label size={11} color={t.accent}>
          {ru.asCustomerHint}
        </Label>
      )}
    </View>
  );
  return (
    <Screen
      back
      title={customer?.name}
      subtitle={`${ru[chat.channel]} · ${ru.demoBadge}`}
      footer={footer}
      scrollRef={scroll}
    >
      {messages.map((message) => {
        const owner = message.role !== "customer";
        const order = business.orders.find((o) => o.messageId === message.id);
        const bubble = (
          <>
            {message.role === "bot" && (
              <Label size={10} color={t.white} bold>
                ✦ OrderIN AI
              </Label>
            )}
            <Label size={14} color={owner ? t.white : t.text}>
              {message.text}
            </Label>
            <Label
              size={10}
              color={owner ? t.white : t.muted}
              style={{ textAlign: "right", opacity: 0.7 }}
            >
              {time(message.createdAt)}
            </Label>
          </>
        );
        return (
          <View key={message.id} style={{ gap: 8 }}>
            <View
              style={{
                alignSelf: owner ? "flex-end" : "flex-start",
                maxWidth: "84%",
              }}
            >
              {owner
                ? (
                  <LinearGradient
                    colors={t.gradient}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      borderBottomRightRadius: 4,
                    }}
                  >
                    {bubble}
                  </LinearGradient>
                )
                : (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      backgroundColor: t.card,
                      borderWidth: 1,
                      borderColor: t.border,
                    }}
                  >
                    {bubble}
                  </View>
                )}
            </View>
            {message.role === "customer" && !order && (
              <Row style={{ flexWrap: "wrap" }}>
                <AnalysisTag message={message} />
                {!message.analysis?.aiCached && (
                  <SpringPress
                    label={ru.analyze}
                    disabled={!!analyzing}
                    onPress={() => void analyze(message)}
                  >
                    <Row style={{ gap: 4, paddingVertical: 4 }}>
                      <Icon name="auto_awesome" size={14} />
                      <Label size={11} bold color={t.accent}>
                        {analyzing === message.id ? aiRu.thinking : ru.analyze}
                      </Label>
                    </Row>
                  </SpringPress>
                )}
              </Row>
            )}
            {message.analysis && message.analysis.confidence < 0.7 && (
              <Label size={11} color={t.warningText}>
                {aiRu.review}
                {message.analysis.missing?.length
                  ? `: ${message.analysis.missing.join(", ")}`
                  : ""}
              </Label>
            )}
            {order && (
              <OrderCard order={order} businessId={business.id} editable />
            )}
          </View>
        );
      })}
      {business.type === "aru" && (
        <Row style={{ gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              small
              secondary
              icon="send"
              title={ru.sendTryon}
              disabled={busy}
              onPress={() => {
                setAsCustomer(false);
                void useStore
                  .getState()
                  .reply(
                    business.id,
                    id,
                    `${ru.tryonLink}\n${
                      Linking.createURL(`/tryon/${business.products[0].id}`, {
                        queryParams: { businessId: business.id, chatId: id },
                      })
                    }`,
                  )
                  .catch(() => toast(ru.error));
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              small
              secondary
              icon="straighten"
              title={ru.tryon}
              onPress={() =>
                router.push({
                  pathname: "/tryon/[productId]",
                  params: {
                    productId: business.products[0].id,
                    businessId: business.id,
                    chatId: id,
                  },
                })}
            />
          </View>
        </Row>
      )}
    </Screen>
  );
}

export default function Chat() {
  const { id, businessId } = useLocalSearchParams<{
    id: string;
    businessId?: string;
  }>();
  // Live conversations have server UUIDs; everything else is an on-device demo chat.
  const local = useStore((s) =>
    Object.values(s.businesses).some((b) => b.chats.some((c) => c.id === id))
  );
  if (aiConfigured && !local) {
    return (
      <RemoteChat key={`${businessId}:${id}`} id={id} businessId={businessId} />
    );
  }
  return <DemoChat key={`${businessId}:${id}`} id={id} businessId={businessId} />;
}
