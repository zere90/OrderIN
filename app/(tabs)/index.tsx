import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { customers } from "../../src/data/mock";
import { ru, time } from "../../src/i18n/ru";
import {
  Card,
  ChannelBadge,
  Chip,
  EmptyState,
  Label,
  Row,
  Screen,
} from "../../src/components/ui";
import { useTheme } from "../../src/theme";
export default function Inbox() {
  const c = useTheme();
  const { chats, messages, orders } = useStore();
  const [filter, setFilter] = useState("all");
  const list = chats
    .filter(
      (chat) =>
        filter === "all" ||
        filter === chat.channel ||
        (filter === "orders" &&
          orders.some((o) => o.chatId === chat.id && o.status === "draft")),
    )
    .sort((a, b) =>
      (
        messages.filter((m) => m.chatId === b.id).at(-1)?.createdAt || ""
      ).localeCompare(
        messages.filter((m) => m.chatId === a.id).at(-1)?.createdAt || "",
      ),
    );
  return (
    <Screen>
      <Label size={12} muted>
        {ru.bakery}
      </Label>
      <Label size={28} bold>
        {ru.inboxTitle}
      </Label>
      <Label muted>{ru.inboxSubtitle}</Label>
      <Row>
        {(["all", "instagram", "whatsapp", "orders"] as const).map((f) => (
          <Chip
            key={f}
            title={ru[f]}
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </Row>
      {list.map((chat) => {
        const customer = customers.find((c) => c.id === chat.customerId)!;
        const last = messages.filter((m) => m.chatId === chat.id).at(-1);
        const detected = orders.some(
          (o) => o.chatId === chat.id && o.status === "draft",
        );
        return (
          <Pressable
            key={chat.id}
            accessibilityRole="button"
            accessibilityLabel={customer.name}
            onPress={() =>
              router.push({ pathname: "/chat/[id]", params: { id: chat.id } })
            }
          >
            <Card>
              <Row>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: c.tint,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Label bold>{customer.initials}</Label>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Label bold>{customer.name}</Label>
                  <ChannelBadge channel={chat.channel} />
                </View>
                <Label size={11} muted>
                  {last ? time(last.createdAt) : ""}
                </Label>
                {chat.unread && (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: c.gold,
                    }}
                  />
                )}
              </Row>
              <Label muted>{last?.text}</Label>
              {detected && (
                <View
                  style={{
                    backgroundColor: c.tint,
                    borderRadius: 8,
                    padding: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Label size={11} bold>
                    ✦ {ru.detected}
                  </Label>
                </View>
              )}
            </Card>
          </Pressable>
        );
      })}
      {!list.length && <EmptyState />}
      <Label size={10} muted>
        {ru.demo}
      </Label>
    </Screen>
  );
}
