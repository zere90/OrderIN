import { View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../store";
import { ThemeProvider, useTheme } from "../theme";
import { localDate } from "../data/mock";
import { collectedOf } from "../services/inventory";
import { Business } from "../types";
import { money, v2 as ru } from "../i18n/ru";
import { BottomSheet, Button, Row, Label, SpringPress } from "./ui";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
function BusinessRow({
  business: b,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const t = useTheme();
  const current = useStore((s) => s.currentBusinessId);
  const toast = useToast();
  const revenue = b.orders
    .filter((o) => o.paidAt && localDate(new Date(o.paidAt)) === localDate())
    .reduce((s, o) => s + collectedOf(o, b.products), 0);
  const unread = b.chats.reduce((s, c) => s + c.unread, 0);
  return (
    <SpringPress
      onPress={() => {
        useStore.getState().switchBusiness(b.id);
        onClose();
        router.replace("/today");
        toast(ru.switched(b.name));
      }}
      label={b.name}
    >
      <Row
        style={{
          padding: 10,
          borderRadius: 16,
          backgroundColor: current === b.id ? t.tint : t.transparent,
          gap: 12,
        }}
      >
        <LinearGradient
          colors={t.gradient}
          style={{ width: 4, height: 40, borderRadius: 2 }}
        />
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: t.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={t.skin.icon} />
        </View>
        <View style={{ flex: 1 }}>
          <Label bold>{b.name}</Label>
          <Label size={11} muted>
            {t.skin.businessType}
          </Label>
        </View>
        <View>
          <Label bold size={12} color={t.accent}>
            {money(revenue)}
          </Label>
          {unread > 0 && (
            <Label size={10} color={t.danger}>
              {unread} {ru.newChats.toLowerCase()}
            </Label>
          )}
        </View>
        {current === b.id && <Icon name="check_circle" size={18} />}
      </Row>
    </SpringPress>
  );
}
export function BusinessSwitcher({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const businesses = useStore((s) => s.businesses);
  return (
    <BottomSheet visible={visible} onClose={onClose} title={ru.myBusinesses}>
      {Object.values(businesses).map((b) => (
        <ThemeProvider key={b.id} skinId={b.type}>
          <BusinessRow business={b} onClose={onClose} />
        </ThemeProvider>
      ))}
      <Button
        secondary
        icon="add_business"
        title={ru.addBusiness}
        onPress={() => {
          onClose();
          router.push({ pathname: "/onboarding", params: { add: "1" } });
        }}
      />
      <Button
        secondary
        icon="manage_accounts"
        title={ru.settings}
        onPress={() => {
          onClose();
          router.push("/settings");
        }}
      />
    </BottomSheet>
  );
}
