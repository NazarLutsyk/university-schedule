/**
 * University schedule monitor: fetch schedule for group 231, send via Telegram.
 * - Sunday 20:00: full week + Monday's schedule.
 * - Mon–Sat 17:00: schedule for the next day.
 */

import { getSheetList, findNewest3kSheet, getSheetValues } from "./sheets";
import { findGroup231Columns, parseSchedule } from "./parse";
import { getFullWeek, getDaySchedule, getTomorrowDayName } from "./schedule";
import { formatFullWeek, formatDaySchedule } from "./format";
import { sendMessage } from "./telegram";
import { loadTeacherResources } from "./resources";

const DEFAULT_SPREADSHEET_ID = "1n3k33vhPE5hlYANR8hOTtw2zKrSjgZuJLlNGa_7mw8s";
const DEFAULT_RESOURCES_SPREADSHEET_ID =
  "1hPzp1MSQYezILtq49GuxiqKUssKsDQ9Tx_tUI6NIPjk";

const PONEDILOK = "Понеділок";

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const spreadsheetId = process.env.SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;
  const resourcesSpreadsheetId =
    process.env.RESOURCES_SPREADSHEET_ID ?? DEFAULT_RESOURCES_SPREADSHEET_ID;

  if (!apiKey) {
    console.error("Missing GOOGLE_SHEETS_API_KEY");
    process.exit(1);
  }
  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    process.exit(1);
  }

  const sheets = await getSheetList(spreadsheetId, apiKey);
  const sheet = findNewest3kSheet(sheets);

  if (!sheet) {
    console.error("No sheet matching '3к DD.MM-DD.MM.YY' found.");
    await sendMessage(
      "Розклад не знайдено (немає аркуша 3к з датою).",
      botToken,
      chatId,
    );
    process.exit(1);
  }

  const rows = await getSheetValues(
    spreadsheetId,
    sheet.title,
    "A1:Z500",
    apiKey,
  );
  const cols = findGroup231Columns(rows);

  if (!cols) {
    console.error("Group 231 'Комп'ютерні науки' column not found in sheet.");
    await sendMessage(
      "Розклад не знайдено (група 231 не знайдена).",
      botToken,
      chatId,
    );
    process.exit(1);
  }

  const allEntries = parseSchedule(rows, cols);
  
  let resourcesMap: Awaited<ReturnType<typeof loadTeacherResources>> | null =
    null;
  try {
    resourcesMap = await loadTeacherResources(resourcesSpreadsheetId, apiKey);
  } catch (err) {
    console.warn(
      "Could not load teacher resources, omitting Zoom/Meet links:",
      err,
    );
  }

  const now = new Date();
  const isSunday = now.getDay() === 0;

  if (isSunday) {
    const week = getFullWeek(allEntries);
    await sendMessage(formatFullWeek(week, resourcesMap), botToken, chatId);
    const mondayEntries = getDaySchedule(allEntries, PONEDILOK);
    await sendMessage(
      formatDaySchedule(mondayEntries, PONEDILOK, resourcesMap),
      botToken,
      chatId,
    );
    console.log("Sent full week + Monday schedule to Telegram.");
  } else {
    const tomorrowName = getTomorrowDayName(now);
    const dayEntries = getDaySchedule(allEntries, tomorrowName);
    await sendMessage(
      formatDaySchedule(dayEntries, tomorrowName, resourcesMap),
      botToken,
      chatId,
    );
    console.log(`Sent schedule for ${tomorrowName} to Telegram.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
