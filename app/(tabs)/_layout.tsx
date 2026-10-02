import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
import { ru } from "../../src/i18n/ru";
export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ru.app,
          tabBarLabel: ru.inbox,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: ru.orders,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: ru.stock,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: ru.today,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
