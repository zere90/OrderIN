import { useState } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";
import { useStore, totalOf } from "../../src/store";
import { OrderStatus } from "../../src/types";
import { customers } from "../../src/data/mock";
import { ru, money, readableDate } from "../../src/i18n/ru";
import {
  Card,
  Chip,
  EmptyState,
  Label,
  Row,
  Screen,
  StatusPill,
} from "../../src/components/ui";
export default function Orders() {
  const [status, setStatus] = useState<OrderStatus>("awaiting_payment");
  const { orders, products, chats } = useStore();
  const list = orders.filter((o) => o.status === status);
  return (
    <Screen>
      <Label size={28} bold>
        {ru.orders}
      </Label>
      <Row>
        {(
          [
            "awaiting_payment",
            "paid",
            "completed",
            "draft",
            "cancelled",
          ] as const
        ).map((s) => (
          <Chip
            key={s}
            title={`${ru[s]} · ${orders.filter((o) => o.status === s).length}`}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </Row>
      {list.map((order) => (
        <Pressable
          key={order.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/order/[id]", params: { id: order.id } })
          }
        >
          <Card>
            <Row>
              <Label bold>{order.id}</Label>
              <StatusPill status={order.status} />
            </Row>
            <Label>
              {
                customers.find(
                  (c) =>
                    c.id ===
                    chats.find((ch) => ch.id === order.chatId)?.customerId,
                )?.name
              }
            </Label>
            <Label muted>
              {order.items
                .map(
                  (i) =>
                    `${products.find((p) => p.id === i.productId)?.name} × ${i.qty}`,
                )
                .join(", ")}
            </Label>
            <Row>
              <Label size={22} bold>
                {money(totalOf(order, products))}
              </Label>
              <Label muted>{readableDate(order.date)}</Label>
            </Row>
          </Card>
        </Pressable>
      ))}
      {!list.length && <EmptyState />}
    </Screen>
  );
}
