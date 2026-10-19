import { aiConfigured } from "../../src/services/supabase";
import { RemoteChats } from "../../src/components/RemoteChats";
import { Screen } from "../../src/components/Screen";
import { ReactNode, useState } from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useBusiness } from "../../src/store";
import { useTheme } from "../../src/theme";
import { v2 as ru, time } from "../../src/i18n/ru";
import {
  Row,
  Label,
  Chip,
  SpringPress,
  EmptyState,
  SegmentedControl,
} from "../../src/components/ui";
import { Icon } from "../../src/components/Icon";
function DemoChats({ switcher }: { switcher?: ReactNode }) {
  const b = useBusiness();
  const t = useTheme();
  const [filter, setFilter] = useState("all");
  const list = b.chats
    .filter(
      (c) =>
        filter === "all" ||
        filter === c.channel ||
        (filter === "orders" &&
          b.orders.some((o) => o.chatId === c.id && o.status === "draft")) ||
        (filter === "questions" &&
          b.messages.some(
            (m) => m.chatId === c.id && m.analysis?.type === "question",
          )),
    )
    .sort((a, z) =>
      (
        b.messages.filter((m) => m.chatId === z.id).at(-1)?.createdAt || ""
      ).localeCompare(
        b.messages.filter((m) => m.chatId === a.id).at(-1)?.createdAt || "",
      ),
    );
  return (
    <Screen title={`${ru.inbox} · ${b.name}`} subtitle="Instagram + WhatsApp">
      {switcher}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {(["all", "instagram", "whatsapp", "orders", "questions"] as const).map(
          (f) => (
            <Chip
              key={f}
              title={ru[f]}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ),
        )}
      </ScrollView>
      <View>
        {list.map((chat) => {
          const customer = b.customers.find((c) => c.id === chat.customerId)!;
          const last = b.messages.filter((m) => m.chatId === chat.id).at(-1);
          const order = b.orders.some(
            (o) => o.chatId === chat.id && o.status === "draft",
          );
          return (
            <SpringPress
              key={chat.id}
              label={customer.name}
              onPress={() =>
                router.push({
                  pathname: "/chat/[id]",
                  params: { id: chat.id, businessId: b.id },
                })
              }
            >
              <Row
                style={{
                  paddingVertical: 14,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderColor: t.border,
                  backgroundColor: chat.unread ? t.tint : t.transparent,
                }}
              >
                <LinearGradient
                  colors={t.thumbGradient}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Label display size={12} color={t.accent}>
                    {customer.initials}
                  </Label>
                  <View
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: t[chat.channel],
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: t.card,
                    }}
                  >
                    <Icon name={chat.channel} size={9} color={t.white} />
                  </View>
                </LinearGradient>
                <View style={{ flex: 1, gap: 4 }}>
                  <Row>
                    <Label bold style={{ flex: 1 }}>
                      {customer.name}
                    </Label>
                    <Label muted size={11}>
                      {last ? time(last.createdAt) : ""}
                    </Label>
                  </Row>
                  <Row>
                    <Label muted size={13} lines={1} style={{ flex: 1 }}>
                      {last?.text}
                    </Label>
                    {order && (
                      <Label size={10} bold color={t.accent}>
                        {ru.order}
                      </Label>
                    )}
                    {chat.unread > 0 && (
                      <View
                        style={{
                          backgroundColor: t.primary,
                          borderRadius: 9,
                          minWidth: 18,
                          alignItems: "center",
                        }}
                      >
                        <Label color={t.white} size={10}>
                          {chat.unread}
                        </Label>
                      </View>
                    )}
                  </Row>
                </View>
              </Row>
            </SpringPress>
          );
        })}
      </View>
      {!list.length && <EmptyState />}
    </Screen>
  );
}

// Demo chats always stay available so the core journey works without a backend.
// When Supabase is configured, connected Instagram/WhatsApp chats get their own tab.
export default function Chats() {
  const [source, setSource] = useState<"demo" | "live">("demo");
  if (!aiConfigured) return <DemoChats />;
  const switcher = (
    <SegmentedControl
      value={source}
      onChange={(v) => setSource(v as "demo" | "live")}
      items={[
        { id: "demo", title: ru.demoChats },
        { id: "live", title: ru.liveChats },
      ]}
    />
  );
  return source === "live"
    ? <RemoteChats switcher={switcher} />
    : <DemoChats switcher={switcher} />;
}
