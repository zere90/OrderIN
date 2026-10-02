export type Channel = "instagram" | "whatsapp";
export type OrderStatus =
  "draft" | "awaiting_payment" | "paid" | "completed" | "cancelled";
export interface Customer {
  id: string;
  name: string;
  initials: string;
}
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  emoji: string;
  keywords: string[];
}
export interface OrderItem {
  productId: string;
  qty: number;
}
export interface Analysis {
  type: "order" | "question" | "feedback";
  items: OrderItem[];
  date?: string;
  address?: string;
  confidence: number;
}
export interface Chat {
  id: string;
  customerId: string;
  channel: Channel;
  unread: boolean;
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
}
