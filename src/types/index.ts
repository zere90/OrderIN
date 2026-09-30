export type BusinessType = "kofe" | "aru" | "dala" | "nur" | "tumar" | "bake";
export type Channel = "instagram" | "whatsapp";
export type OrderStatus =
  "draft" | "awaiting_payment" | "paid" | "completed" | "cancelled";
export interface Customer {
  id: string;
  name: string;
  initials: string;
}
export interface OrderItem {
  productId: string;
  qty: number;
}
export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  icon: string;
  unit: string;
  keywords: string[];
  category: "product" | "ingredient" | "material" | "service";
  size?: string;
  color?: string;
  image?: string;
  expiresAt?: string;
  intervalDays?: number;
  components?: OrderItem[];
  status?: "preorder";
  deposit?: number;
}
export interface Analysis {
  type: "order" | "question" | "feedback" | "other";
  language?: "kk" | "ru" | "en" | "mixed";
  missing?: string[];
  time?: string;
  demo?: boolean;
  aiCached?: boolean;
  items: OrderItem[];
  date?: string;
  address?: string;
  confidence: number;
}
export interface Chat {
  id: string;
  customerId: string;
  channel: Channel;
  unread: number;
  requestedProductId?: string;
  requestedSize?: string;
}
export interface Message {
  id: string;
  chatId: string;
  role: "customer" | "seller" | "bot";
  text: string;
  createdAt: string;
  analysis?: Analysis;
}
export interface Order {
  id: string;
  chatId: string;
  messageId: string;
  items: OrderItem[];
  date?: string;
  address?: string;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  paymentUrl?: string;
  total?: number;
  deposit?: number;
}
export type StockSource = "manual" | "invoice" | "excel" | "sale" | "ai";
export interface StockChange {
  id: string;
  productId: string;
  name: string;
  delta: number;
  priceBefore?: number;
  priceAfter?: number;
  source: StockSource;
  createdAt: string;
}
export interface ChecklistItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  done: boolean;
}
export interface ShoppingList {
  id: string;
  title: string;
  items: ChecklistItem[];
  createdAt: string;
}
export interface Business {
  id: string;
  type: BusinessType;
  name: string;
  customers: Customer[];
  chats: Chat[];
  messages: Message[];
  orders: Order[];
  products: Product[];
  history: StockChange[];
  hiddenOpportunities: string[];
  createdOpportunities: string[];
  lists: ShoppingList[];
  answers: Record<string, string>;
  connections: Record<string, boolean>;
  slots: string[];
}
export type OpportunityKind =
  | "combo"
  | "outfit"
  | "last_size"
  | "basket"
  | "expiry"
  | "slots"
  | "package"
  | "preorder"
  | "demand"
  | "occasion"
  | "shopping";
export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  icon: string;
  reason: string;
  calculation: string;
  price: number;
  expectedRevenue: number;
  recipientIds: string[];
  items: OrderItem[];
  draft: string;
  checklist?: ChecklistItem[];
}
export interface ImportRow {
  name: string;
  qty: number;
  price: number;
  confidence: number;
  productId?: string;
  size?: string;
  color?: string;
}
export type ImportMode = "add" | "replace";
