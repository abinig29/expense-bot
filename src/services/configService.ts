import { BotSettings } from "../types";

export class ConfigService {
  private static instance: ConfigService;
  private settings: BotSettings;

  private constructor() {
    this.settings = {
      sendConfirmations: process.env.SEND_CONFIRMATIONS !== "false", // Default to true
      allowedChatIds: process.env.ALLOWED_CHAT_IDS
        ? process.env.ALLOWED_CHAT_IDS.split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))
        : [],
      allowedTopicIds: process.env.ALLOWED_TOPIC_IDS
        ? process.env.ALLOWED_TOPIC_IDS.split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))
        : [],
    };
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getSettings(): BotSettings {
    return { ...this.settings };
  }

  public isConfirmationEnabled(): boolean {
    return this.settings.sendConfirmations;
  }

  public isChatAllowed(chatId: number): boolean {
    if (this.settings.allowedChatIds.length === 0) {
      return true; // Allow all chats if none specified
    }
    return this.settings.allowedChatIds.includes(chatId);
  }

  public isTopicAllowed(topicId?: number): boolean {
    if (!topicId) return true; // Allow if no topic specified
    if (this.settings.allowedTopicIds.length === 0) {
      return true; // Allow all topics if none specified
    }
    return this.settings.allowedTopicIds.includes(topicId);
  }

  public updateSettings(newSettings: Partial<BotSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}
