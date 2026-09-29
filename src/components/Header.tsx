import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../theme";
import { useBusiness, useStore } from "../store";
import { Label, Row, SpringPress } from "./ui";
import { Icon } from "./Icon";
import { BusinessSwitcher } from "./BusinessSwitcher";
import { v2 as ru } from "../i18n/ru";
export function Header({
  title,
  subtitle,
  back = false,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
}) {
  const t = useTheme();
  const b = useBusiness();
  const owner = useStore((s) => s.owner);
  const unread = useStore((s) =>
    Object.values(s.businesses).some(
      (x) => x.id !== b.id && x.chats.some((c) => c.unread > 0),
    ),
  );
  const [open, setOpen] = useState(false);
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: t.bg,
      }}
    >
      <Row style={{ gap: 12 }}>
        {back && (
          <SpringPress
            label={ru.back}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          >
            <Icon name="arrow_back" />
          </SpringPress>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Label display size={14} color={t.accent}>
            {title || ru.greeting(owner, b.name)}
          </Label>
          <Label muted size={12}>
            {subtitle ||
              new Date().toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
          </Label>
        </View>
        <SpringPress label={ru.myBusinesses} onPress={() => setOpen(true)}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              borderWidth: 2.5,
              borderColor: t.accent,
              backgroundColor: t.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Label display size={10} color={t.accent}>
              {t.skin.initials}
            </Label>
            {unread && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: t.danger,
                  borderWidth: 2,
                  borderColor: t.card,
                }}
              />
            )}
          </View>
        </SpringPress>
      </Row>
      <BusinessSwitcher visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}
