import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Label, SpringPress } from "./ui";
import { v2 as ru } from "../i18n/ru";
const Context = createContext<(text: string, undo?: () => void) => void>(
  () => {},
);
export const useToast = () => useContext(Context);
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<{
    text: string;
    undo?: () => void;
    key: number;
  }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const show = useCallback(
    (text: string, undo?: () => void) =>
      setToast({ text, undo, key: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(undefined),
      toast.undo ? 6000 : 3200,
    );
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <Context.Provider value={show}>
      {children}
      {toast && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: 88 + insets.bottom,
            left: 20,
            right: 20,
            alignItems: "center",
          }}
        >
          <View
            accessibilityLiveRegion="polite"
            style={{
              backgroundColor: t.toast,
              padding: 14,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              ...t.shadow,
            }}
          >
            <Label size={13} color={t.white} style={{ flexShrink: 1 }}>
              {toast.text}
            </Label>
            {toast.undo && (
              <SpringPress
                onPress={() => {
                  toast.undo?.();
                  setToast(undefined);
                }}
              >
                <Label bold color={t.second}>
                  {ru.undo}
                </Label>
              </SpringPress>
            )}
          </View>
        </View>
      )}
    </Context.Provider>
  );
}
