import { Screen } from "../src/components/Screen";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../src/theme";
import { BusinessType } from "../src/types";
import { seedBusiness, localDate, offsetDate } from "../src/data/mock";
import { collectedOf, isDailyReceipt } from "../src/services/inventory";
import { v2 as ru } from "../src/i18n/ru";
import { Label, Row, Card, AILabel } from "../src/components/ui";
import { HeroRevenueCard } from "../src/components/HeroRevenueCard";
import { Icon } from "../src/components/Icon";
function Preview({ type }: { type: BusinessType }) {
  const t = useTheme();
  const b = seedBusiness(type);
  const data = Array.from({ length: 7 }, (_, i) =>
    b.orders
      .filter(
        (o) =>
          o.paidAt &&
          localDate(new Date(o.paidAt)) === localDate(offsetDate(i - 6)),
      )
      .reduce((s, o) => s + collectedOf(o, b.products), 0),
  );
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: 20,
        padding: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <Row>
        <Label display size={9} color={t.accent} style={{ flex: 1 }}>
          OrderIN
        </Label>
        <Icon name={t.skin.icon} size={18} />
      </Row>
      <Label muted size={8}>
        {t.skin.name}
      </Label>
      <HeroRevenueCard mini data={data} />
      <Row>
        {[
          { label: ru.orderCount, n: b.orders.filter((o) => !isDailyReceipt(o)).length },
          { label: ru.inbox, n: b.chats.length },
        ].map((s) => (
          <Card
            key={s.label}
            style={{ flex: 1, padding: 8, borderRadius: 10, gap: 2 }}
          >
            <Label display size={14} color={t.accent}>
              {s.n}
            </Label>
            <Label muted size={7}>
              {s.label}
            </Label>
          </Card>
        ))}
      </Row>
      <Card style={{ padding: 10, borderRadius: 10, gap: 5 }}>
        <AILabel />
        <Label size={8}>{t.skin.aiFeature}</Label>
      </Card>
      <Row style={{ justifyContent: "space-around" }}>
        {[
          "chat_bubble",
          "receipt_long",
          "auto_awesome",
          "inventory_2",
          "home",
        ].map((icon) => (
          <Icon key={icon} name={icon} size={14} />
        ))}
      </Row>
      <Label bold size={11}>
        {t.skin.name}
      </Label>
      <Label muted size={10}>
        {t.skin.businessType}
      </Label>
      <Row>
        {[t.primary, t.second, t.tint].map((c, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: c,
            }}
          />
        ))}
      </Row>
    </View>
  );
}
export default function Skins() {
  const t = useTheme();
  return (
    <Screen back title={ru.skinsTitle} subtitle={ru.skinsSubtitle}>
      <Row style={{ flexWrap: "wrap", alignItems: "flex-start", gap: 12 }}>
        {t.skins.map((s) => (
          <View key={s.id} style={{ width: "47%", flexGrow: 1 }}>
            <ThemeProvider skinId={s.id}>
              <Preview type={s.id} />
            </ThemeProvider>
          </View>
        ))}
      </Row>
    </Screen>
  );
}
