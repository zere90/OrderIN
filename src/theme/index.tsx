import { createContext, useContext, PropsWithChildren } from "react";
import { useColorScheme } from "react-native";
import { useStore } from "../store";
import { BusinessType } from "../types";
import { skinMap, skins } from "./skins";
import { tokens, neutral, semantic } from "./tokens";
const PreviewContext = createContext<BusinessType | undefined>(undefined);
export function ThemeProvider({
  children,
  skinId,
}: {
  children: React.ReactNode;
  skinId?: BusinessType;
}) {
  return (
    <PreviewContext.Provider value={skinId}>{children}</PreviewContext.Provider>
  );
}
export function useTheme() {
  const preview = useContext(PreviewContext);
  const system = useColorScheme();
  const mode = useStore((s) => s.mode);
  const type = useStore(
    (s) => s.businesses[s.currentBusinessId]?.type || "kofe",
  );
  const dark = mode === "dark" || (mode === "system" && system === "dark");
  const skin = skinMap[preview || type];
  const palette = dark ? neutral.dark : neutral.light;
  return {
    ...tokens,
    ...semantic,
    ...palette,
    skin,
    skins,
    dark,
    bg: dark ? "#111013" : skin.bg,
    accent: dark ? skin.second : skin.accent,
    primary: skin.accent,
    second: skin.second,
    tint: dark ? "#2B2530" : skin.tint,
    gradient: [skin.accent, skin.second] as [string, string],
    thumbGradient: [skin.accent + "33", skin.second + "55"] as [string, string],
    onPrimary: semantic.white,
    warningBg: dark ? "#3C301D" : semantic.warningBg,
    warningText: dark ? "#FCD98A" : semantic.warningText,
    successBg: dark ? "#19392D" : semantic.successBg,
    infoBg: dark ? "#1D2D49" : semantic.infoBg,
  };
}
