import { useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Order } from "../types";
import { useStore, totalOf, validateOrder } from "../store";
import { money, readableDate, v2 as ru } from "../i18n/ru";
import { useTheme } from "../theme";
import {
  AICard,
  AILabel,
  Row,
  Label,
  Button,
  Field,
  StatusPill,
  Chip,
} from "./ui";
import { useToast } from "./Toast";
export function OrderCard({
  order,
  businessId,
  editable = false,
}: {
  order: Order;
  businessId: string;
  editable?: boolean;
}) {
  const b = useStore((s) => s.businesses[businessId]);
  const t = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const canEdit = editable && order.status === "draft";
  let warning = "";
  try {
    validateOrder(order, b.products);
  } catch (e) {
    warning = e instanceof Error ? e.message : ru.invalid;
  }
  const edit = (
    patch: Parameters<ReturnType<typeof useStore.getState>["edit"]>[2],
  ) => useStore.getState().edit(b.id, order.id, patch);
  async function run(
    action: () => Promise<void>,
    message: string,
    payment = false,
  ) {
    setBusy(true);
    try {
      await action();
      toast(message);
      if (payment)
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
    } catch (e) {
      toast(e instanceof Error ? e.message : ru.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AICard>
      <Row>
        <AILabel />
        <Label bold size={12} style={{ flex: 1 }}>
          {ru.detected}
        </Label>
        <StatusPill status={order.status} />
      </Row>
      {order.items.map((it, i) => {
        const p = b.products.find((p) => p.id === it.productId);
        return (
          <View key={`${it.productId}-${i}`} style={{ gap: 8 }}>
            <Row>
              <Label bold size={13} style={{ flex: 1 }}>
                {p?.name} {p?.size}
              </Label>
              <Label muted size={12}>
                ×{it.qty}
              </Label>
              <Label bold color={t.accent} size={13}>
                {money((p?.price || 0) * it.qty)}
              </Label>
            </Row>
            {canEdit && (
              <Row>
                <Button
                  title="−"
                  small
                  secondary
                  disabled={busy || it.qty <= 1}
                  onPress={() =>
                    edit({
                      items: order.items.map((x, j) =>
                        j === i ? { ...x, qty: x.qty - 1 } : x,
                      ),
                    })
                  }
                />
                <Field
                  accessibilityLabel={`${ru.qty}: ${p?.name}`}
                  value={String(it.qty)}
                  keyboardType="number-pad"
                  style={{ width: 60 }}
                  editable={!busy}
                  onChangeText={(text) =>
                    edit({
                      items: order.items.map((x, j) =>
                        j === i
                          ? { ...x, qty: Number(text.replace(/\D/g, "")) }
                          : x,
                      ),
                    })
                  }
                />
                <Button
                  title="+"
                  small
                  secondary
                  disabled={busy}
                  onPress={() =>
                    edit({
                      items: order.items.map((x, j) =>
                        j === i ? { ...x, qty: x.qty + 1 } : x,
                      ),
                    })
                  }
                />
                <Button
                  title={ru.remove}
                  small
                  secondary
                  disabled={busy}
                  onPress={() =>
                    edit({ items: order.items.filter((_, j) => j !== i) })
                  }
                />
              </Row>
            )}
          </View>
        );
      })}
      {canEdit && (
        <>
          <Label muted size={11}>
            {ru.add}
          </Label>
          <Row style={{ flexWrap: "wrap" }}>
            {b.products
              .filter(
                (p) =>
                  ["product", "service"].includes(p.category) &&
                  !order.items.some((i) => i.productId === p.id),
              )
              .map((p) => (
                <Chip
                  key={p.id}
                  title={`${p.name} ${p.size || ""}`}
                  onPress={() =>
                    edit({
                      items: [...order.items, { productId: p.id, qty: 1 }],
                    })
                  }
                />
              ))}
          </Row>
          <Label muted size={11}>
            {ru.date}
          </Label>
          <Field
            value={order.date || ""}
            placeholder={ru.date}
            accessibilityLabel={ru.date}
            onChangeText={(date) => edit({ date })}
          />
          <Label muted size={11}>
            {ru.address}
          </Label>
          <Field
            value={order.address || ""}
            placeholder={ru.address}
            accessibilityLabel={ru.address}
            onChangeText={(address) => edit({ address })}
          />
        </>
      )}
      {!canEdit && (
        <>
          <Label muted size={12}>
            {readableDate(order.date)}
          </Label>
          <Label muted size={12}>
            {order.address || "—"}
          </Label>
        </>
      )}
      <Row
        style={{ borderTopWidth: 1.5, borderColor: t.border, paddingTop: 12 }}
      >
        <Label style={{ flex: 1 }}>{ru.total}</Label>
        {canEdit ? (
          <Field
            accessibilityLabel={ru.total}
            keyboardType="decimal-pad"
            value={String(totalOf(order, b.products))}
            onChangeText={(text) =>
              edit({ total: Number(text.replace(",", ".")) })
            }
            style={{ width: 130 }}
          />
        ) : (
          <Label display size={18} color={t.accent}>
            {money(totalOf(order, b.products))}
          </Label>
        )}
      </Row>
      {order.deposit && (
        <Label size={12} color={t.accent}>
          {ru.deposit}: {money(totalOf(order, b.products) * order.deposit)}
        </Label>
      )}
      {!!warning && ["draft", "awaiting_payment"].includes(order.status) && (
        <Label size={12} color={t.warningText}>
          {warning}
        </Label>
      )}
      {canEdit && (
        <Button
          title={ru.confirm}
          disabled={busy || !!warning}
          onPress={() =>
            void run(
              () => useStore.getState().confirm(b.id, order.id),
              ru.linkSent,
            )
          }
        />
      )}
      {order.status === "awaiting_payment" && (
        <>
          <Button
            title={ru.simulate}
            disabled={busy || !!warning}
            onPress={() =>
              void run(
                () => useStore.getState().pay(b.id, order.id),
                ru.paymentSuccess,
                true,
              )
            }
          />
          <Button
            secondary
            title={ru.copy}
            onPress={() =>
              void run(async () => {
                await Clipboard.setStringAsync(order.paymentUrl || "");
              }, ru.copied)
            }
          />
        </>
      )}
      {order.status === "paid" && (
        <Button
          title={ru.complete}
          onPress={() => {
            useStore.getState().finish(b.id, order.id);
            toast(ru.completed);
          }}
        />
      )}
      {editable && ["draft", "awaiting_payment"].includes(order.status) && (
        <Button
          title={ru.cancel}
          secondary
          disabled={busy}
          onPress={() => useStore.getState().cancel(b.id, order.id)}
        />
      )}
    </AICard>
  );
}
