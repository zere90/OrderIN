import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
const names: Record<
  string,
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  auto_awesome: "auto-awesome",
  inventory_2: "inventory-2",
  chat_bubble: "chat-bubble",
  receipt_long: "receipt-long",
  home: "home",
  coffee: "coffee",
  checkroom: "checkroom",
  storefront: "storefront",
  spa: "spa",
  style: "style",
  cake: "cake",
  bakery_dining: "bakery-dining",
  water_drop: "water-drop",
  local_drink: "local-drink",
  local_cafe: "local-cafe",
  egg: "egg",
  face: "face",
  shopping_bag: "shopping-bag",
  shopping_cart: "shopping-cart",
  add_shopping_cart: "add-shopping-cart",
  photo_camera: "photo-camera",
  upload_file: "upload-file",
  table_view: "table-view",
  edit: "edit",
  add: "add",
  remove: "remove",
  close: "close",
  check: "check",
  check_circle: "check-circle",
  arrow_back: "arrow-back",
  chevron_right: "chevron-right",
  warning: "warning",
  search: "search",
  schedule: "schedule",
  location_on: "location-on",
  send: "send",
  share: "share",
  trending_up: "trending-up",
  straighten: "straighten",
  payments: "payments",
  manage_accounts: "manage-accounts",
  add_business: "add-business",
  campaign: "campaign",
  local_offer: "local-offer",
  undo: "undo",
  person: "person",
  verified: "verified",
  sync: "sync",
  info: "info-outline",
};
export function Icon({
  name,
  size = 24,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const t = useTheme();
  return name === "whatsapp" || name === "instagram" ? (
    <MaterialCommunityIcons name={name} size={size} color={color || t.accent} />
  ) : (
    <MaterialIcons
      name={names[name] || "auto-awesome"}
      size={size}
      color={color || t.accent}
    />
  );
}
