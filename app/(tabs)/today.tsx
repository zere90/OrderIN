import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useStore, totalOf } from "../../src/store";
import { localDate } from "../../src/data/mock";
import { ru, money } from "../../src/i18n/ru";
import { Button, Card, Label, Row, Screen } from "../../src/components/ui";
import { useTheme } from "../../src/theme";
export default function Today() {
  const [resetOpen, setResetOpen] = useState(false);
  const { orders, products } = useStore();
  const c = useTheme();
  const today = localDate();
  const paid = orders.filter(
    (o) => o.paidAt && localDate(new Date(o.paidAt)) === today,
  );
  const pending = orders.filter((o) => o.status === "awaiting_payment");
  const draft = orders.filter((o) => o.status === "draft");
  const low = products.filter((p) => p.stock < 3);
  const dayOrders = orders.filter(
    (o) => localDate(new Date(o.createdAt)) === today,
  );
  return (
    <Screen>
      <Label size={28} bold>
        {ru.summary}
      </Label>
      <Label muted>{ru.summaryHint}</Label>
      <View
        style={{
          backgroundColor: c.primary,
          borderRadius: 20,
          padding: 24,
          gap: 12,
        }}
      >
        <Label color={c.bg} size={12}>
          {ru.revenue}
        </Label>
        <Label color={c.bg} size={36} bold>
          {money(paid.reduce((sum, o) => sum + totalOf(o, products), 0))}
        </Label>
        <Label color={c.bg} size={12}>
          {ru.bakery}
        </Label>
      </View>
      <Label bold>{ru.ordersToday}</Label>
      <Row>
        {(
          [
            "draft",
            "awaiting_payment",
            "paid",
            "completed",
            "cancelled",
          ] as const
        ).map((status) => (
          <View key={status} style={{ minWidth: "45%", flexGrow: 1 }}>
            <Card>
              <Label size={26} bold>
                {dayOrders.filter((o) => o.status === status).length}
              </Label>
              <Label muted size={12}>
                {ru[status]}
              </Label>
            </Card>
          </View>
        ))}
      </Row>
      <Card>
        <Label bold>
          {ru.pending} · {pending.length}
        </Label>
        <Label size={24} bold>
          {money(pending.reduce((sum, o) => sum + totalOf(o, products), 0))}
        </Label>
      </Card>
      <Label size={20} bold>
        {ru.needsConfirm} · {draft.length}
      </Label>
      {draft.map((o) => (
        <Pressable
          key={o.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/order/[id]", params: { id: o.id } })
          }
        >
          <Card>
            <Row>
              <Label bold>✦ {o.id}</Label>
              <Label>{money(totalOf(o, products))} →</Label>
            </Row>
          </Card>
        </Pressable>
      ))}
      <Card>
        <Label bold>{ru.low}</Label>
        {low.length ? (
          low.map((p) => (
            <Label key={p.id}>
              {p.emoji} {p.name} · {p.stock}
            </Label>
          ))
        ) : (
          <Label muted>{ru.noLow}</Label>
        )}
      </Card>
      {resetOpen ? (
        <Card>
          <Label bold>{ru.resetTitle}</Label>
          <Label muted>{ru.resetBody}</Label>
          <Button
            title={ru.resetConfirm}
            onPress={() => {
              useStore.getState().reset();
              setResetOpen(false);
            }}
          />
          <Button
            title={ru.keep}
            secondary
            onPress={() => setResetOpen(false)}
          />
        </Card>
      ) : (
        <Button title={ru.reset} secondary onPress={() => setResetOpen(true)} />
      )}
      <Label size={10} muted>
        {ru.demo}
      </Label>
    </Screen>
  );
}
