import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useTheme } from "../src/theme";
import { useStore } from "../src/store";
import { Label } from "../src/components/ui";
import { ru } from "../src/i18n/ru";
export default function Layout() {
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).finally(() =>
      useStore.setState({ hydrated: true }),
    );
  }, []);
  const c = useTheme();
  const ready = useStore((s) => s.hydrated);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: c.bg,
        }}
      >
        <Label>{ru.loading}</Label>
      </View>
    );
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
          headerBackTitle: ru.back,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: ru.inbox }} />
        <Stack.Screen name="order/[id]" options={{ title: ru.details }} />
      </Stack>
    </>
  );
}
