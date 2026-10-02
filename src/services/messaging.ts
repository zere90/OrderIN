import { Business, Chat, Message } from "../types";
export interface MessagingService {
  getChats(business: Business): Promise<Chat[]>;
  sendMessage(
    chatId: string,
    text: string,
    role?: Message["role"],
  ): Promise<Message>;
}
export const messagingService: MessagingService = {
  async getChats(business) {
    return business.chats;
  },
  async sendMessage(chatId, text, role = "seller") {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chatId,
      text,
      role,
      createdAt: new Date().toISOString(),
    };
  },
};
