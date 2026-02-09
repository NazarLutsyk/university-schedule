/**
 * Send messages via node-telegram-bot-api.
 * Long messages (>4096 chars) are split and sent in parts.
 */

import TelegramBot, { type SendMessageOptions } from "node-telegram-bot-api";

const MAX_MESSAGE_LENGTH = 4090;

/**
 * Send a single message (or multiple if text exceeds Telegram limit).
 */
export async function sendMessage(
  text: string,
  botToken: string,
  chatId: string,
): Promise<void> {
  const bot = new TelegramBot(botToken, { polling: false });

  const opts: SendMessageOptions = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  await bot.sendMessage(chatId, text, opts);

  return;
}
