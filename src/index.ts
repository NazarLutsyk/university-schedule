/**
 * University schedule monitor: fetch schedule for the configured course/group, send via Telegram.
 * - Sunday 20:00: full week + Monday's schedule.
 * - Mon–Sat 17:00: schedule for the next day.
 */

import { getSheetList, findNewestCourseSheet, getSheetValues } from "./sheets";
import { findGroupColumns, parseSchedule, parseDayDates } from "./parse";
import {
  getFullWeek,
  getDaySchedule,
  getTomorrowDayName,
  WEEKDAY_ORDER,
} from "./schedule";
import { formatFullWeek, formatDaySchedule } from "./format";
import { sendMessage } from "./telegram";
import { loadTeacherResources } from "./resources";
import { syncDays } from "./calendar";
import {
  COURSE,
  GROUP,
  SPREADSHEET_ID,
  RESOURCES_SPREADSHEET_ID,
} from "./config";

const PONEDILOK = "Понеділок";

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const spreadsheetId = SPREADSHEET_ID;
  const resourcesSpreadsheetId = RESOURCES_SPREADSHEET_ID;

  if (!apiKey) {
    console.error("Missing GOOGLE_SHEETS_API_KEY");
    process.exit(1);
  }
  if (!botToken || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    process.exit(1);
  }

  const sheets = await getSheetList(spreadsheetId, apiKey);
  const sheet = findNewestCourseSheet(sheets, COURSE);

  if (!sheet) {
    console.error(`No sheet matching '${COURSE}к DD.MM-DD.MM.YY' found.`);
    await sendMessage(
      `Розклад не знайдено (немає аркуша ${COURSE}к з датою).`,
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
  const cols = findGroupColumns(rows, GROUP);

  if (!cols) {
    console.error(
      `Group ${GROUP} 'Комп'ютерні науки' column not found in sheet.`,
    );
    await sendMessage(
      `Розклад не знайдено (група ${GROUP} не знайдена).`,
      botToken,
      chatId,
    );
    process.exit(1);
  }

  const allEntries = parseSchedule(rows, cols);
  const dayDates = parseDayDates(rows);
  
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

    await syncDays(WEEKDAY_ORDER, allEntries, dayDates, resourcesMap);
  } else {
    const tomorrowName = getTomorrowDayName(now);
    if (tomorrowName === "Субота" || tomorrowName === "Неділя") {
      console.log("No daily notification for Saturday or Sunday (holidays).");
      return;
    }
    const dayEntries = getDaySchedule(allEntries, tomorrowName);
    await sendMessage(
      formatDaySchedule(dayEntries, tomorrowName, resourcesMap),
      botToken,
      chatId,
    );
    console.log(`Sent schedule for ${tomorrowName} to Telegram.`);

    await syncDays([tomorrowName], allEntries, dayDates, resourcesMap);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
