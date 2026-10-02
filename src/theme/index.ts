import { useColorScheme } from "react-native";
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const typography = { title: 28, heading: 20, body: 15, caption: 12 };
const light = {
  bg: "#F5F7F6",
  card: "#FFFFFF",
  text: "#172E2B",
  muted: "#74847F",
  border: "#E3EAE7",
  primary: "#0F766E",
  tint: "#E5F3EF",
  gold: "#F5B301",
  warning: "#96670A",
  danger: "#BE4848",
  bubble: "#DDEFE8",
};
const dark = {
  bg: "#0D1C1A",
  card: "#172C28",
  text: "#EFF7F3",
  muted: "#9CB4AA",
  border: "#2A403A",
  primary: "#50BFB1",
  tint: "#203F36",
  gold: "#F5B301",
  warning: "#F1C76B",
  danger: "#FF8E8E",
  bubble: "#20483E",
};
export const useTheme = () => (useColorScheme() === "dark" ? dark : light);
