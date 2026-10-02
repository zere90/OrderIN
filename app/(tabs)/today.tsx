import { Screen } from "../../src/components/Screen";
import { View, Share } from "react-native";
import { router } from "expo-router";
import { useBusiness, useStore } from "../../src/store";
import { localDate, offsetDate } from "../../src/data/mock";
import { collectedOf } from "../../src/services/inventory";
import { getOpportunities } from "../../src/services/opportunities";
import { v2 as ru } from "../../src/i18n/ru";
import { useTheme } from "../../src/theme";
import {
  Label,
  Row,
  SpringPress,
  ProductThumb,
  Card,
} from "../../src/components/ui";
import {
  HeroRevenueCard,
  StatTile,
} from "../../src/components/HeroRevenueCard";
import { OpportunityCard } from "../../src/components/OpportunityCard";
import { useToast } from "../../src/components/Toast";
export default function Today() {
  const b = useBusiness();
  const t = useTheme();
  const toast = useToast();
  const data = Array.from({ length: 7 }, (_, i) =>
    b.orders
      .filter(
        (o) =>
          o.paidAt &&
          localDate(new Date(o.paidAt)) === localDate(offsetDate(i - 6)),
      )
      .reduce((s, o) => s + collectedOf(o, b.products), 0),
  );
  const op = getOpportunities(b)[0];
  const actions = [
    {
      title: ru.newOrder,
      icon: "add_shopping_cart",
      press: () => {
        const p = b.products.find(
          (p) => p.category === "product" || p.category === "service",
        );
        if (p) {
          const id = useStore.getState().createOrder(b.id, p.id);
          router.push({
            pathname: "/order/[id]",
            params: { id, businessId: b.id },
          });
        }
      },
    },
    {
      title: ru.stock,
      icon: "inventory_2",
      press: () => router.push("/stock"),
    },
    {
      title: ru.share,
      icon: "share",
      press: () => {
        void Share.share({
          message: `Qazyna · ${b.name}\n${ru.journey}`,
        }).catch(() => toast(ru.error));
      },
    },
  ];
  return (
    <Screen>
      <HeroRevenueCard data={data} />
      <Row style={{ gap: 12, alignItems: "stretch" }}>
        <StatTile
          title={ru.orderCount}
          value={
            b.orders.filter(
              (o) => localDate(new Date(o.createdAt)) === localDate(),
            ).length
          }
          icon="receipt_long"
        />
        <StatTile
          title={ru.newChats}
          value={b.chats.filter((c) => c.unread > 0).length}
          icon="chat_bubble"
        />
      </Row>
      {op && <OpportunityCard key={`${b.id}-${op.id}`} op={op} compact />}
      <Label muted bold size={11}>
        {ru.quick}
      </Label>
      <Row style={{ gap: 12, alignItems: "stretch" }}>
        {actions.map((a) => (
          <SpringPress key={a.title} onPress={a.press} style={{ flex: 1 }}>
            <Card
              style={{
                alignItems: "center",
                padding: 12,
                gap: 6,
                borderColor: t.tint,
              }}
            >
              <ProductThumb icon={a.icon} size={36} />
              <Label bold size={11} style={{ textAlign: "center" }}>
                {a.title}
              </Label>
            </Card>
          </SpringPress>
        ))}
      </Row>
    </Screen>
  );
}
