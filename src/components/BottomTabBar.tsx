import { View } from "react-native";
import { BottomTabBarProps } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";
import { Label, SpringPress } from "./ui";
import { Icon } from "./Icon";
import { v2 as ru } from "../i18n/ru";
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const inset = useSafeAreaInsets();
  const labels: Record<string, string> = {
    index: ru.inbox,
    orders: ru.orders,
    ai: ru.ai,
    stock: ru.stock,
    today: ru.today,
  };
  const icons: Record<string, string> = {
    index: "chat_bubble",
    orders: "receipt_long",
    ai: "auto_awesome",
    stock: "inventory_2",
    today: "home",
  };
  return (
    <View
      style={{
        backgroundColor: t.card,
        borderTopWidth: 1,
        borderColor: t.border,
        paddingBottom: Math.max(inset.bottom, 8),
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "flex-end",
        minHeight: 72 + inset.bottom,
      }}
    >
      {state.routes.map((route, i) => {
        const active = state.index === i;
        return (
          <SpringPress
            key={route.key}
            style={{ flex: 1, alignItems: "center" }}
            label={labels[route.name]}
            selected={active}
            onPress={() => {
              const e = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!e.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            {route.name === "ai" ? (
              <LinearGradient
                colors={t.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  ...t.shadow,
                  boxShadow: `0 4px 16px ${t.primary}55`,
                }}
              >
                <Icon name="auto_awesome" color={t.white} size={22} />
              </LinearGradient>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  paddingTop: 8,
                  paddingBottom: 6,
                  gap: 2,
                  minWidth: 52,
                }}
              >
                <Icon
                  name={icons[route.name]}
                  size={20}
                  color={active ? t.accent : t.muted}
                />
                <Label bold size={10} color={active ? t.accent : t.muted}>
                  {labels[route.name]}
                </Label>
              </View>
            )}
          </SpringPress>
        );
      })}
    </View>
  );
}
