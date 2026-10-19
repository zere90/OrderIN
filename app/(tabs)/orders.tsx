import { Screen } from "../../src/components/Screen";
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useBusiness, totalOf } from "../../src/store";
import { isDailyReceipt } from "../../src/services/inventory";
import { useTheme } from "../../src/theme";
import { v2 as ru, money, orderNo, readableDate } from "../../src/i18n/ru";
import {
  Card,
  Label,
  Row,
  SegmentedControl,
  SpringPress,
  StatusPill,
  EmptyState,
} from "../../src/components/ui";
import { Icon } from "../../src/components/Icon";
export default function Orders() {
  const b = useBusiness();
  const t = useTheme();
  const [status, setStatus] = useState("awaiting_payment");
  const list = b.orders
    .filter((o) => !isDailyReceipt(o))
    .filter((o) =>
      status === "awaiting_payment"
        ? ["draft", "awaiting_payment"].includes(o.status)
        : status === "completed"
        ? ["completed", "cancelled"].includes(o.status)
        : o.status === status,
    )
    .sort((a, z) => z.createdAt.localeCompare(a.createdAt));
  return (
    <Screen title={ru.orders} subtitle={b.name}>
      <SegmentedControl
        value={status}
        onChange={setStatus}
        items={(["awaiting_payment", "paid", "completed"] as const).map(
          (id) => ({ id, title: ru[id] }),
        )}
      />
      {list.map((order) => (
        <SpringPress
          key={order.id}
          onPress={() =>
            router.push({
              pathname: "/order/[id]",
              params: { id: order.id, businessId: b.id },
            })
          }
        >
          <Card style={{ padding: 14, borderRadius: 18 }}>
            <Row style={{ gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: t.tint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="receipt_long" size={20} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Row>
                  <Label bold style={{ flex: 1 }} lines={1}>
                    {b.customers.find(
                      (c) =>
                        c.id ===
                          b.chats.find((ch) => ch.id === order.chatId)
                            ?.customerId,
                    )?.name || ru.customer}
                  </Label>
                  <Label display size={12} color={t.accent}>
                    {money(totalOf(order, b.products))}
                  </Label>
                </Row>
                <Label muted lines={1} size={12}>
                  {order.items
                    .map(
                      (i) =>
                        `${b.products.find((p) => p.id === i.productId)?.name} ×${i.qty}`,
                    )
                    .join(", ")}
                </Label>
                <Row style={{ gap: 6 }}>
                  <StatusPill status={order.status} />
                  <Label muted size={10}>
                    {orderNo(order.id)} · {readableDate(order.date || order.createdAt)}
                  </Label>
                </Row>
              </View>
              <Icon name="chevron_right" color={t.muted} size={18} />
            </Row>
          </Card>
        </SpringPress>
      ))}
      {!list.length && (
        <EmptyState title={ru.noOrders} hint={ru.noOrdersHint} />
      )}
    </Screen>
  );
}
