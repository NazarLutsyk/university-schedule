/**
 * One-off fetch and parse test: print schedule for the configured course/group to stdout.
 * Usage: bun run fetch
 */

import { getSheetList, findNewestCourseSheet, getSheetValues } from "./sheets";
import { findGroupColumns, parseSchedule } from "./parse";
import { formatFullWeek } from "./format";
import { COURSE, GROUP, SPREADSHEET_ID } from "./config";

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = SPREADSHEET_ID;

  if (!apiKey) {
    console.error("Set GOOGLE_SHEETS_API_KEY to run fetch.");
    process.exit(1);
  }

  const sheets = await getSheetList(spreadsheetId, apiKey);
  console.log("Sheets:", sheets.length);
  const sheet = findNewestCourseSheet(sheets, COURSE);
  if (!sheet) {
    console.error(`No '${COURSE}к' sheet found.`);
    process.exit(1);
  }
  console.log("Using sheet:", sheet.title);

  const rows = await getSheetValues(spreadsheetId, sheet.title, "A1:Z500", apiKey);
  const cols = findGroupColumns(rows, GROUP);
  if (!cols) {
    console.error(`Group ${GROUP} columns not found.`);
    process.exit(1);
  }
  console.log(`Group ${GROUP} columns:`, cols);

  const entries = parseSchedule(rows, cols);
  console.log("Entries:", entries.length);
  console.log("\n" + formatFullWeek(entries).replace(/<[^>]+>/g, ""));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
