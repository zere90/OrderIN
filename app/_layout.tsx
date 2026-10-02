import { useEffect } from "react";
import { Stack, useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../src/theme";
import { useAppFonts } from "../src/theme/fonts";
import { useStore } from "../src/store";
import { ToastProvider } from "../src/components/Toast";
void SplashScreen.preventAutoHideAsync().catch(() => {});
function AppStack() {
  const t = useTheme();
  const ready = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.onboarded);
  const [fonts, error] = useAppFonts();
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).finally(() =>
      useStore.setState({ hydrated: true }),
    );
  }, []);
  useEffect(() => {
    if (ready && (fonts || error)) void SplashScreen.hideAsync();
  }, [ready, fonts, error]);
  if (!ready || (!fonts && !error))
    return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  return (
    <ToastProvider>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="tryon/[productId]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="skins" />
        <Stack.Screen name="import" />
        <Stack.Screen name="shopping/[id]" />
      </Stack>
    </ToastProvider>
  );
}
export default function Layout() {
  const { businessId } = useGlobalSearchParams<{ businessId?: string }>();
  const type = useStore((s) =>
    businessId ? s.businesses[businessId]?.type : undefined,
  );
  return (
    <SafeAreaProvider>
      <ThemeProvider skinId={type}>
        <AppStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
