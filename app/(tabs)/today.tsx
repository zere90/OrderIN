import { Screen } from "../../src/components/Screen";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { View, Share } from "react-native";
import { router } from "expo-router";
import { useBusiness, useStore } from "../../src/store";
import { localDate, offsetDate } from "../../src/data/mock";
import { collectedOf, isDailyReceipt } from "../../src/services/inventory";
import { getOpportunities } from "../../src/services/opportunities";
import { money, v2 as ru } from "../../src/i18n/ru";
import { useTheme } from "../../src/theme";
import {
  Label,
  Row,
  SpringPress,
  ProductThumb,
  Card,
  BottomSheet,
  Button,
  Chip,
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
  const [sheet, setSheet] = useState(false);
  const [chatId, setChatId] = useState<string>();
  const [productId, setProductId] = useState<string>();
  const sellable = b.products.filter(
    (p) =>
      (p.category === "product" || p.category === "service") &&
      (p.stock > 0 || p.status === "preorder"),
  );
  const actions = [
    {
      title: ru.newOrder,
      icon: "add_shopping_cart",
      press: () => {
        setChatId(b.chats[0]?.id);
        setProductId(sellable[0]?.id);
        setSheet(true);
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
        const message = `OrderIN · ${b.name}\n${ru.journey}`;
        // Web browsers without the Share API fall back to the clipboard.
        void Share.share({ message })
          .catch(() =>
            Clipboard.setStringAsync(message).then(() => toast(ru.shareCopied))
          )
          .catch(() => toast(ru.error));
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
              (o) =>
                !isDailyReceipt(o) &&
                o.status !== "cancelled" &&
                localDate(new Date(o.createdAt)) === localDate(),
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
      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={ru.newOrderTitle}
      >
        <Label bold size={12}>
          {ru.customer}
        </Label>
        <Row style={{ flexWrap: "wrap" }}>
          {b.chats.map((c) => (
            <Chip
              key={c.id}
              title={b.customers.find((x) => x.id === c.customerId)?.name ||
                c.id}
              active={chatId === c.id}
              onPress={() => setChatId(c.id)}
            />
          ))}
        </Row>
        <Label bold size={12}>
          {ru.product}
        </Label>
        {sellable.length
          ? (
            <Row style={{ flexWrap: "wrap" }}>
              {sellable.map((p) => (
                <Chip
                  key={p.id}
                  title={`${p.name}${p.size ? ` ${p.size}` : ""} · ${money(p.price)}`}
                  active={productId === p.id}
                  onPress={() => setProductId(p.id)}
                />
              ))}
            </Row>
          )
          : <Label color={t.warningText}>{ru.noProducts}</Label>}
        <Button
          title={ru.createDraft}
          disabled={!chatId || !productId}
          onPress={() => {
            if (!chatId || !productId) return;
            const id = useStore.getState().createOrder(b.id, productId, chatId);
            setSheet(false);
            toast(ru.orderCreated);
            router.push({
              pathname: "/order/[id]",
              params: { id, businessId: b.id },
            });
          }}
        />
      </BottomSheet>
    </Screen>
  );
}
