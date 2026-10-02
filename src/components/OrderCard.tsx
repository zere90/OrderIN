import { useEffect, useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../theme";
import { Order } from "../types";
import { useStore, totalOf } from "../store";
import { money, readableDate, ru } from "../i18n/ru";
import { Button, Card, Field, Label, Row, StatusPill } from "./ui";
export function OrderCard({
  order,
  editable = false,
}: {
  order: Order;
  editable?: boolean;
}) {
  const colors = useTheme();
  const products = useStore((s) => s.products);
  const edit = useStore((s) => s.edit);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const canEdit = editable && order.status === "draft";
  const shortage = order.items.some(
    (i) => i.qty > (products.find((p) => p.id === i.productId)?.stock || 0),
  );
  async function run(
    action: () => Promise<void>,
    success: string,
    payment = false,
  ) {
    setBusy(true);
    try {
      await action();
      setNotice(success);
      if (payment)
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
    } catch (e) {
      setNotice(e instanceof Error ? e.message : ru.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Row>
        <Label bold>{order.id}</Label>
        <StatusPill status={order.status} />
      </Row>
      {order.items.map((item, index) => {
        const product = products.find((p) => p.id === item.productId)!;
        return (
          <View key={`${item.productId}-${index}`} style={{ gap: 8 }}>
            <Row>
              <Label size={24}>{product.emoji}</Label>
              <View style={{ flex: 1 }}>
                <Label bold>{product.name}</Label>
                <Label muted size={12}>
                  {money(product.price)} × {item.qty}
                </Label>
              </View>
              <Label bold>{money(product.price * item.qty)}</Label>
            </Row>
            {canEdit && (
              <Row>
                <Button
                  title="−"
                  secondary
                  disabled={busy || item.qty <= 1}
                  onPress={() =>
                    edit(order.id, {
                      items: order.items.map((it, j) =>
                        j === index ? { ...it, qty: it.qty - 1 } : it,
                      ),
                    })
                  }
                />
                <Field
                  accessibilityLabel={`${ru.quantity}: ${product.name}`}
                  keyboardType="number-pad"
                  value={String(item.qty)}
                  editable={!busy}
                  onChangeText={(text) =>
                    edit(order.id, {
                      items: order.items.map((it, j) =>
                        j === index
                          ? { ...it, qty: Number(text.replace(/\D/g, "")) }
                          : it,
                      ),
                    })
                  }
                  style={{ width: 70 }}
                />
                <Button
                  title="+"
                  secondary
                  disabled={busy}
                  onPress={() =>
                    edit(order.id, {
                      items: order.items.map((it, j) =>
                        j === index ? { ...it, qty: it.qty + 1 } : it,
                      ),
                    })
                  }
                />
                <Button
                  title={ru.remove}
                  secondary
                  disabled={busy}
                  onPress={() =>
                    edit(order.id, {
                      items: order.items.filter((_, j) => j !== index),
                    })
                  }
                />
              </Row>
            )}
          </View>
        );
      })}
      {canEdit && (
        <>
          <Label muted size={12}>
            {ru.add}
          </Label>
          <Row>
            {products
              .filter((p) => !order.items.some((i) => i.productId === p.id))
              .map((p) => (
                <Button
                  key={p.id}
                  title={`${p.emoji} ${p.name}`}
                  secondary
                  disabled={busy}
                  onPress={() =>
                    edit(order.id, {
                      items: [...order.items, { productId: p.id, qty: 1 }],
                    })
                  }
                />
              ))}
          </Row>
          <Label muted size={12}>
            {ru.date}
          </Label>
          <Field
            accessibilityLabel={ru.date}
            value={order.date || ""}
            editable={!busy}
            placeholder="2026-09-30"
            onChangeText={(date) => edit(order.id, { date })}
          />
          <Label muted size={12}>
            {ru.address}
          </Label>
          <Field
            accessibilityLabel={ru.address}
            value={order.address || ""}
            editable={!busy}
            placeholder={ru.address}
            onChangeText={(address) => edit(order.id, { address })}
          />
        </>
      )}
      {!canEdit && (
        <>
          <Label muted>{readableDate(order.date)}</Label>
          <Label muted>{order.address || "—"}</Label>
        </>
      )}
      <Row>
        <View style={{ flex: 1 }}>
          <Label muted>{ru.total}</Label>
        </View>
        <Label size={23} bold>
          {money(totalOf(order, products))}
        </Label>
      </Row>
      {shortage && ["draft", "awaiting_payment"].includes(order.status) && (
        <Label>{ru.shortage}</Label>
      )}
      {canEdit && (
        <Button
          title={ru.confirm}
          disabled={busy || shortage || !order.items.length}
          onPress={() =>
            void run(() => useStore.getState().confirm(order.id), ru.sent)
          }
        />
      )}
      {order.status === "awaiting_payment" && (
        <>
          <Button
            title={ru.simulate}
            disabled={busy || shortage}
            onPress={() =>
              void run(
                () => useStore.getState().pay(order.id),
                ru.paymentSuccess,
                true,
              )
            }
          />
          {order.paymentUrl && (
            <Button
              title={ru.copy}
              secondary
              onPress={() =>
                void run(async () => {
                  await Clipboard.setStringAsync(order.paymentUrl!);
                }, ru.copied)
              }
            />
          )}
        </>
      )}
      {order.status === "paid" && (
        <Button
          title={ru.complete}
          onPress={() => useStore.getState().finish(order.id)}
        />
      )}
      {editable && ["draft", "awaiting_payment"].includes(order.status) && (
        <Button
          title={ru.cancel}
          disabled={busy}
          secondary
          onPress={() => useStore.getState().cancel(order.id)}
        />
      )}
      {!!notice && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tint,
          }}
        >
          <Label bold>{notice}</Label>
        </View>
      )}
    </Card>
  );
}
