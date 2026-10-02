import { PropsWithChildren } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
} from "react-native";
import { useTheme } from "../theme";
import { Channel, OrderStatus } from "../types";
import { ru } from "../i18n/ru";
export function Label({
  children,
  muted = false,
  size = 15,
  bold = false,
  color,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  bold?: boolean;
  color?: string;
}) {
  const c = useTheme();
  return (
    <Text
      style={{
        color: color ?? (muted ? c.muted : c.text),
        fontSize: size,
        fontWeight: bold ? "700" : "400",
        lineHeight: size * 1.4,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      {children}
    </View>
  );
}
export function Screen({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Row({ children }: PropsWithChildren) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? c.tint : c.primary,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 12,
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        alignItems: "center",
      })}
    >
      <Text
        style={{
          fontWeight: "700",
          color: secondary ? c.primary : c.bg,
          fontSize: 14,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: active ? c.primary : c.card,
        borderWidth: 1,
        borderColor: active ? c.primary : c.border,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: active ? c.bg : c.muted,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function ChannelBadge({ channel }: { channel: Channel }) {
  const c = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: channel === "whatsapp" ? c.primary : c.warning,
      }}
    >
      {channel === "whatsapp" ? "◉ WhatsApp" : "◎ Instagram"}
    </Text>
  );
}
export function StatusPill({ status }: { status: OrderStatus }) {
  const c = useTheme();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: c.tint,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: status === "awaiting_payment" ? c.warning : c.primary,
        }}
      >
        {ru[status]}
      </Text>
    </View>
  );
}
export function EmptyState() {
  return (
    <Card>
      <Label bold>{ru.empty}</Label>
      <Label muted>{ru.emptyHint}</Label>
    </Card>
  );
}
export function Field(props: TextInputProps) {
  const c = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={c.muted}
      style={[
        {
          minHeight: 46,
          padding: 12,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 10,
          color: c.text,
          backgroundColor: c.bg,
          fontSize: 15,
        },
        props.style,
      ]}
    />
  );
}
export const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 12 },
});
