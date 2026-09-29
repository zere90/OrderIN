import { useFonts } from "expo-font";
import {
  Unbounded_700Bold,
  Unbounded_800ExtraBold,
} from "@expo-google-fonts/unbounded";
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
export const useAppFonts = () =>
  useFonts({
    Unbounded_700Bold,
    Unbounded_800ExtraBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
