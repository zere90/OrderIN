import { PropsWithChildren } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Header } from "./Header";
export function Screen({
  children,
  title,
  subtitle,
  back = false,
  header = true,
  footer,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  back?: boolean;
  header?: boolean;
  footer?: React.ReactNode;
}>) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={
        back || !header
          ? ["top", "left", "right", "bottom"]
          : ["top", "left", "right"]
      }
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      {header && <Header title={title} subtitle={subtitle} back={back} />}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 12,
            paddingBottom: 24,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer && (
          <View style={{ padding: 16, backgroundColor: t.bg }}>{footer}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
