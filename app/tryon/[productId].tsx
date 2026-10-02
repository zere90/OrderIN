import { Screen } from "../../src/components/Screen";
import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { v2 as ru } from "../../src/i18n/ru";
import {
  Card,
  AICard,
  AILabel,
  Label,
  Field,
  Button,
  Row,
  Chip,
  EmptyState,
} from "../../src/components/ui";
import { useToast } from "../../src/components/Toast";
const sizes = ["XS", "S", "M", "L", "XL"];
export default function Tryon() {
  const { productId, businessId, chatId } = useLocalSearchParams<{
    productId: string;
    businessId?: string;
    chatId?: string;
  }>();
  const b = useStore((s) => s.businesses[businessId || s.currentBusinessId]);
  const product = b?.products.find((p) => p.id === productId);
  const t = useTheme();
  const toast = useToast();
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("60");
  const [usual, setUsual] = useState("M");
  const [fit, setFit] = useState("regular");
  const [result, setResult] = useState<string>();
  if (!product)
    return (
      <Screen back>
        <EmptyState />
      </Screen>
    );
  const matching = b.products.find(
    (p) =>
      p.name === product.name &&
      p.size === result &&
      (!product.color || p.color === product.color),
  );
  return (
    <Screen back title={ru.tryon} subtitle={product.name}>
      <AICard>
        <AILabel />
        <Label muted size={12}>
          {ru.fitDisclaimer}
        </Label>
        <Row>
          <View style={{ flex: 1, gap: 6 }}>
            <Label size={12}>{ru.height}</Label>
            <Field
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Label size={12}>{ru.weight}</Label>
            <Field
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        </Row>
        <Label bold size={12}>
          {ru.usualSize}
        </Label>
        <Row style={{ flexWrap: "wrap" }}>
          {sizes.map((size) => (
            <Chip
              key={size}
              title={size}
              active={usual === size}
              onPress={() => setUsual(size)}
            />
          ))}
        </Row>
        <Label bold size={12}>
          {ru.fit}
        </Label>
        <Row style={{ flexWrap: "wrap" }}>
          {(["fitted", "regular", "loose"] as const).map((id) => (
            <Chip
              key={id}
              title={ru[id]}
              active={fit === id}
              onPress={() => setFit(id)}
            />
          ))}
        </Row>
        <Button
          title={ru.recommend}
          onPress={() => {
            const h = Number(height),
              w = Number(weight);
            if (
              !Number.isFinite(h) ||
              !Number.isFinite(w) ||
              h < 120 ||
              h > 220 ||
              w < 30 ||
              w > 200
            ) {
              toast(ru.invalidMeasurements);
              return;
            }
            const base = w < 45 ? 0 : w < 55 ? 1 : w < 72 ? 2 : w < 90 ? 3 : 4;
            const index =
              Math.round((base + sizes.indexOf(usual)) / 2) +
              (fit === "loose" ? 1 : fit === "fitted" ? -1 : 0) +
              (h > 190 ? 1 : 0);
            setResult(sizes[Math.min(4, Math.max(0, index))]);
          }}
        />
      </AICard>
      {result && (
        <Card>
          <Label display size={18} color={t.accent}>
            {ru.fitResult(result)}
          </Label>
          <View style={{ alignItems: "center" }}>
            <Svg width={120} height={180} viewBox="0 0 120 180">
              <Circle cx={60} cy={20} r={15} fill={t.second} />
              <Path
                d="M40 42 Q60 35 80 42 L99 92 L87 99 L76 72 L78 122 L75 175 L61 175 L60 125 L56 175 L42 175 L42 120 L44 72 L32 99 L20 92 Z"
                fill={t.tint}
                stroke={t.accent}
                strokeWidth={2}
              />
            </Svg>
          </View>
          <Label bold>{ru.sizeTable}</Label>
          <Row>
            <Label style={{ flex: 1 }}>{ru.size}</Label>
            <Label size={11} style={{ flex: 1 }}>
              {ru.chest}
            </Label>
            <Label size={11} style={{ flex: 1 }}>
              {ru.waist}
            </Label>
          </Row>
          {sizes.map((s, i) => (
            <Row
              key={s}
              style={{
                backgroundColor: s === result ? t.tint : t.transparent,
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Label style={{ flex: 1 }} bold={s === result}>
                {s}
              </Label>
              <Label style={{ flex: 1 }}>
                {80 + i * 6}–{85 + i * 6}
              </Label>
              <Label style={{ flex: 1 }}>
                {60 + i * 6}–{65 + i * 6}
              </Label>
            </Row>
          ))}
          <Button
            title={
              matching && matching.stock > 0 ? ru.orderSize : ru.unavailable
            }
            disabled={!matching || matching.stock <= 0}
            onPress={() => {
              if (!matching) return;
              const id = useStore
                .getState()
                .createOrder(b.id, matching.id, chatId);
              toast(ru.orderCreated);
              router.push({
                pathname: "/order/[id]",
                params: { id, businessId: b.id },
              });
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
