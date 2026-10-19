import { PropsWithChildren, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../theme";
import { Channel, OrderStatus, Product } from "../types";
import { v2 as ru } from "../i18n/ru";
import { Icon } from "./Icon";
export function Label({
  children,
  muted = false,
  size = 14,
  bold = false,
  display = false,
  color,
  lines,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  bold?: boolean;
  display?: boolean;
  color?: string;
  lines?: number;
  style?: StyleProp<import("react-native").TextStyle>;
}) {
  const t = useTheme();
  // Unbounded/Manrope lack several Kazakh letters (ә, ң, ғ, қ…). Mixing fonts inside
  // one word looks broken, so such strings use the platform font instead.
  const text = typeof children === "string"
    ? children
    : Array.isArray(children)
    ? children.filter((c) => typeof c === "string").join("")
    : "";
  const kazakh = (display ? /[әңғүұқөһӘҢҒҮҰҚӨҺ]/ : /[әңғұқӘҢҒҰҚ]/).test(text);
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          color: color ?? (muted ? t.muted : t.text),
          fontFamily: kazakh
            ? undefined
            : display
            ? size >= 26
              ? t.fonts.hero
              : t.fonts.display
            : bold
            ? t.fonts.bold
            : t.fonts.body,
          fontWeight: kazakh ? (display || bold ? "800" : "500") : undefined,
          fontSize: size,
          lineHeight: size * 1.5,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function SpringPress({
  children,
  onPress,
  disabled,
  label,
  style,
  selected,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: Platform.OS !== "web",
      speed: 40,
      bounciness: 4,
    }).start();
  return (
    <Animated.View
      style={[{ transform: [{ scale }], opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPressIn={() => animate(0.94)}
        onPressOut={() => animate(1)}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          onPress();
        }}
        style={{ flexGrow: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
export function Row({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}
    >
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: t.radii.card,
          padding: 18,
          gap: 12,
          borderWidth: 1.5,
          borderColor: t.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function AICard({ children }: PropsWithChildren) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={t.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 1.5, borderRadius: 20 }}
    >
      <View
        style={{
          backgroundColor: t.card,
          borderRadius: 18.5,
          padding: 18,
          gap: 12,
        }}
      >
        {children}
      </View>
    </LinearGradient>
  );
}
export function AILabel() {
  const t = useTheme();
  return (
    <LinearGradient
      colors={t.gradient}
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      }}
    >
      <Label bold size={10} color={t.white}>
        ✦ AI
      </Label>
    </LinearGradient>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  small = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: string;
  small?: boolean;
}) {
  const t = useTheme();
  const body = (
    <Row
      style={{
        justifyContent: "center",
        paddingHorizontal: small ? 12 : 16,
        paddingVertical: small ? 9 : 14,
        flexWrap: "wrap",
      }}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={secondary ? t.accent : t.onPrimary}
        />
      )}
      <Label
        bold
        size={small ? 12 : 14}
        color={secondary ? t.accent : t.onPrimary}
        style={{ textAlign: "center", flexShrink: 1 }}
      >
        {title}
      </Label>
    </Row>
  );
  return (
    <SpringPress onPress={onPress} disabled={disabled} label={title}>
      {secondary ? (
        <View style={{ borderRadius: 12, backgroundColor: t.tint }}>
          {body}
        </View>
      ) : (
        <LinearGradient
          colors={t.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          {body}
        </LinearGradient>
      )}
    </SpringPress>
  );
}
export function Chip({
  title,
  active = false,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <SpringPress label={title} selected={active} onPress={onPress}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: active ? t.primary : t.tint,
        }}
      >
        <Label size={12} bold color={active ? t.white : t.accent}>
          {title}
        </Label>
      </View>
    </SpringPress>
  );
}
export function SegmentedControl({
  items,
  value,
  onChange,
}: {
  items: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <Row
      style={{ backgroundColor: t.tint, padding: 3, borderRadius: 12, gap: 2 }}
    >
      {items.map((i) => (
        <SpringPress
          key={i.id}
          style={{ flex: 1 }}
          selected={value === i.id}
          onPress={() => onChange(i.id)}
        >
          <View
            style={{
              paddingVertical: 10,
              paddingHorizontal: 3,
              borderRadius: 9,
              backgroundColor: value === i.id ? t.card : t.transparent,
            }}
          >
            <Label
              bold
              size={11}
              color={value === i.id ? t.accent : t.muted}
              style={{ textAlign: "center" }}
            >
              {i.title}
            </Label>
          </View>
        </SpringPress>
      ))}
    </Row>
  );
}
export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={t.muted}
      style={[
        {
          minHeight: 44,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: t.border,
          backgroundColor: t.card,
          color: t.text,
          fontFamily: t.fonts.body,
          fontSize: 14,
        },
        props.style,
      ]}
    />
  );
}
export function ChannelBadge({ channel }: { channel: Channel }) {
  const t = useTheme();
  return (
    <Row>
      <Icon name={channel} size={14} color={t[channel]} />
      <Label size={11} muted>
        {ru[channel]}
      </Label>
    </Row>
  );
}
export function StatusPill({ status }: { status: OrderStatus }) {
  const t = useTheme();
  const color =
    status === "paid"
      ? t.success
      : status === "awaiting_payment"
        ? t.info
        : status === "draft"
          ? t.warning
          : t.muted;
  const bg =
    status === "paid"
      ? t.successBg
      : status === "awaiting_payment"
        ? t.infoBg
        : status === "draft"
          ? t.warningBg
          : t.tint;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Label size={10} bold color={color}>
        {ru.statusLabels[status]}
      </Label>
    </View>
  );
}
export function EmptyState({
  title = ru.empty,
  hint = ru.emptyHint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 32 }}>
      <Icon name="inventory_2" size={36} />
      <Label bold>{title}</Label>
      <Label muted size={12} style={{ textAlign: "center" }}>
        {hint}
      </Label>
    </Card>
  );
}
export function ProductThumb({
  product,
  size = 48,
  icon,
}: {
  product?: Product;
  size?: number;
  icon?: string;
}) {
  const t = useTheme();
  return product?.image ? (
    <Image
      source={{ uri: product.image }}
      style={{ width: size, height: size, borderRadius: 14 }}
    />
  ) : (
    <LinearGradient
      colors={t.thumbGradient}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon || product?.icon || t.skin.icon} size={size / 2} />
    </LinearGradient>
  );
}
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: t.overlay,
        }}
      >
        <Pressable
          accessibilityLabel={ru.close}
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            maxHeight: "85%",
            flexShrink: 1,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              flexShrink: 1,
              backgroundColor: t.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(20, insets.bottom),
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: t.border,
                alignSelf: "center",
                marginBottom: 16,
              }}
            />
            <Row style={{ marginBottom: 16 }}>
              <Label display size={15} style={{ flex: 1 }}>
                {title}
              </Label>
              <SpringPress onPress={onClose} label={ru.close}>
                <Icon name="close" />
              </SpringPress>
            </Row>
            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
export function FadeIn({ children }: PropsWithChildren) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [opacity]);
  return <Animated.View style={{ opacity, gap: 12 }}>{children}</Animated.View>;
}
