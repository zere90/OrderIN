import { Order } from "../types";
export interface PaymentService {
  createKaspiLink(order: Order): Promise<string>;
  simulatePayment(
    orderId: string,
  ): Promise<{ orderId: string; paidAt: string }>;
}
export const paymentService: PaymentService = {
  async createKaspiLink(order) {
    return `https://pay.example/kaspi/${encodeURIComponent(order.id)}`;
  },
  async simulatePayment(orderId) {
    return { orderId, paidAt: new Date().toISOString() };
  },
};
