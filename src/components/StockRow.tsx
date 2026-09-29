import { View } from "react-native";
import { Product } from "../types";
import { useStore } from "../store";
import { useTheme } from "../theme";
import { v2 as ru, money } from "../i18n/ru";
import { Card, Row, Label, Button, ProductThumb } from "./ui";
export function StockRow({
  product: p,
  businessId,
  editable = false,
}: {
  product: Product;
  businessId: string;
  editable?: boolean;
}) {
  const t = useTheme();
  return (
    <Card
      style={{
        padding: 14,
        borderRadius: 18,
        borderColor: p.stock < 3 ? t.warning : t.border,
      }}
    >
      <Row style={{ gap: 12 }}>
        <ProductThumb product={p} />
        <View style={{ flex: 1, gap: 2 }}>
          <Label bold>{p.name}</Label>
          {!!(p.size || p.color) && (
            <Label muted size={11}>
              {[p.size, p.color].filter(Boolean).join(" · ")}
            </Label>
          )}
          <Label muted size={12}>
            {money(p.price)} / {p.unit}
          </Label>
          {p.stock < 3 && (
            <Label size={10} bold color={t.warning}>
              {ru.low}
            </Label>
          )}
          {p.status === "preorder" && (
            <Label size={10} color={t.accent}>
              {ru.preOrderStatus}
            </Label>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Label
            display
            size={18}
            color={
              p.stock === 0 ? t.danger : p.stock < 3 ? t.warning : t.accent
            }
          >
            {p.stock}
          </Label>
          <Label muted size={11}>
            {p.unit}
          </Label>
        </View>
      </Row>
      {editable && (
        <Row style={{ justifyContent: "flex-end" }}>
          <Button
            small
            secondary
            title="−"
            disabled={p.stock <= 0}
            onPress={() => useStore.getState().stock(businessId, p.id, -1)}
          />
          <Button
            small
            secondary
            title="+"
            onPress={() => useStore.getState().stock(businessId, p.id, 1)}
          />
        </Row>
      )}
    </Card>
  );
}
