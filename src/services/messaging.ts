import { Chat, Message } from "../types";
import { seed } from "../data/mock";
export interface MessagingService {
  getChats(): Promise<Chat[]>;
  sendMessage(
    chatId: string,
    text: string,
    role?: Message["role"],
  ): Promise<Message>;
}
export const messagingService: MessagingService = {
  async getChats() {
    return seed().chats;
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
