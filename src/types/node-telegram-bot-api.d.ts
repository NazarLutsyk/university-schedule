declare module "node-telegram-bot-api" {
  export interface SendMessageOptions {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    disable_web_page_preview?: boolean;
  }

  export default class TelegramBot {
    constructor(token: string, options?: { polling: boolean });
    sendMessage(
      chatId: string,
      text: string,
      options?: SendMessageOptions,
    ): Promise<import("http").IncomingMessage>;
  }
}
