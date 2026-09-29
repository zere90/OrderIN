import { Screen } from "../../src/components/Screen";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { v2 as ru, readableDate } from "../../src/i18n/ru";
import { Card, Label, Row, EmptyState, Button } from "../../src/components/ui";
import { OrderCard } from "../../src/components/OrderCard";
import { Icon } from "../../src/components/Icon";
export default function OrderDetail() {
  const { id, businessId } = useLocalSearchParams<{
    id: string;
    businessId?: string;
  }>();
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const order = b?.orders.find((o) => o.id === id);
  const t = useTheme();
  if (!order)
    return (
      <Screen back>
        <EmptyState />
      </Screen>
    );
  const step = ["draft", "awaiting_payment", "paid", "completed"].indexOf(
    order.status,
  );
  return (
    <Screen
      back
      title={`${ru.order} · ${order.id.slice(-8)}`}
      subtitle={readableDate(order.createdAt)}
    >
      <Card>
        <Label muted size={11} bold>
          {ru.statusTitle}
        </Label>
        {ru.timeline.map((label, i) => (
          <Row key={label}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: i <= step ? t.tint : t.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={i <= step ? "check" : "schedule"}
                size={14}
                color={i <= step ? t.accent : t.muted}
              />
            </View>
            <Label bold={i === step} color={i <= step ? t.accent : t.muted}>
              {label}
            </Label>
          </Row>
        ))}
      </Card>
      <OrderCard order={order} businessId={b.id} editable />
      <Button
        secondary
        title={ru.inbox}
        onPress={() =>
          router.push({
            pathname: "/chat/[id]",
            params: { id: order.chatId, businessId: b.id },
          })
        }
      />
    </Screen>
  );
}
