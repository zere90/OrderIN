import { BusinessType } from "../types";
export interface Skin {
  id: BusinessType;
  name: string;
  businessType: string;
  accent: string;
  second: string;
  tint: string;
  bg: string;
  stockLabel: string;
  aiFeature: string;
  icon: string;
  initials: string;
}
export const skins: Skin[] = [
  {
    id: "kofe",
    name: "Kofe Tau",
    businessType: "Кофейня",
    accent: "#4A2C1D",
    second: "#E39A55",
    tint: "#F6ECE2",
    bg: "#FBF7F2",
    stockLabel: "Меню и ингредиенты",
    aiFeature: "Выгодные комбо",
    icon: "coffee",
    initials: "KT",
  },
  {
    id: "aru",
    name: "Aru Style",
    businessType: "Одежда",
    accent: "#1E1B22",
    second: "#F0A6BE",
    tint: "#F7EEF1",
    bg: "#FBF8F9",
    stockLabel: "Товары, размеры, цвета",
    aiFeature: "Собери образ",
    icon: "checkroom",
    initials: "AS",
  },
  {
    id: "dala",
    name: "Dala Market",
    businessType: "Магазин",
    accent: "#4E7D5E",
    second: "#BCD9A8",
    tint: "#EDF5EA",
    bg: "#F9FBF7",
    stockLabel: "Товары и поставки",
    aiFeature: "Обычная корзина",
    icon: "storefront",
    initials: "DM",
  },
  {
    id: "nur",
    name: "Nur Beauty",
    businessType: "Студия красоты",
    accent: "#6D5A96",
    second: "#F2C1AA",
    tint: "#F1EEF8",
    bg: "#FAF9FC",
    stockLabel: "Услуги и материалы",
    aiFeature: "Заполнить окна",
    icon: "spa",
    initials: "NB",
  },
  {
    id: "tumar",
    name: "Tumar",
    businessType: "Маленький бренд",
    accent: "#46639A",
    second: "#B5CDEE",
    tint: "#EDF2FA",
    bg: "#F8FAFD",
    stockLabel: "Коллекции и варианты",
    aiFeature: "Лист ожидания и предзаказ",
    icon: "style",
    initials: "TU",
  },
  {
    id: "bake",
    name: "Bake by Aziza",
    businessType: "Выпечка",
    accent: "#B9313A",
    second: "#FFC978",
    tint: "#FCEEEA",
    bg: "#FDF8F5",
    stockLabel: "Изделия и продукты",
    aiFeature: "Повторный праздник",
    icon: "cake",
    initials: "BA",
  },
];
export const skinMap = Object.fromEntries(
  skins.map((s) => [s.id, s]),
) as Record<BusinessType, Skin>;
