import { View } from "react-native";
import { Product } from "../types";
import { useStore } from "../store";
import { useTheme } from "../theme";
import { ru, money } from "../i18n/ru";
import { Button, Card, Label, Row } from "./ui";
export function StockRow({ product: p }: { product: Product }) {
  const c = useTheme();
  return (
    <Card>
      <Row>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: c.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Label size={36}>{p.emoji}</Label>
        </View>
        <View style={{ flex: 1 }}>
          <Label bold>{p.name}</Label>
          <Label muted>{money(p.price)}</Label>
          {p.stock < 3 && (
            <Label color={c.warning} size={12}>
              ⚠ {ru.low}
            </Label>
          )}
        </View>
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Label muted size={12}>
            {ru.available}
          </Label>
          <Label size={22} bold>
            {p.stock}
          </Label>
        </View>
        <Button
          title="−"
          secondary
          disabled={p.stock === 0}
          onPress={() => useStore.getState().stock(p.id, -1)}
        />
        <Button
          title="+"
          secondary
          onPress={() => useStore.getState().stock(p.id, 1)}
        />
      </Row>
    </Card>
  );
}
