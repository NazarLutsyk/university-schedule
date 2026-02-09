/**
 * One-off fetch and parse test: print schedule for group 231 to stdout.
 * Usage: bun run fetch
 */

import { getSheetList, findNewest3kSheet, getSheetValues } from "./sheets";
import { findGroup231Columns, parseSchedule } from "./parse";
import { formatFullWeek } from "./format";

const DEFAULT_SPREADSHEET_ID = "1n3k33vhPE5hlYANR8hOTtw2zKrSjgZuJLlNGa_7mw8s";

async function main(): Promise<void> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;

  if (!apiKey) {
    console.error("Set GOOGLE_SHEETS_API_KEY to run fetch.");
    process.exit(1);
  }

  const sheets = await getSheetList(spreadsheetId, apiKey);
  console.log("Sheets:", sheets.length);
  const sheet = findNewest3kSheet(sheets);
  if (!sheet) {
    console.error("No '3к' sheet found.");
    process.exit(1);
  }
  console.log("Using sheet:", sheet.title);

  const rows = await getSheetValues(spreadsheetId, sheet.title, "A1:Z500", apiKey);
  const cols = findGroup231Columns(rows);
  if (!cols) {
    console.error("Group 231 columns not found.");
    process.exit(1);
  }
  console.log("Group 231 columns:", cols);

  const entries = parseSchedule(rows, cols);
  console.log("Entries:", entries.length);
  console.log("\n" + formatFullWeek(entries).replace(/<[^>]+>/g, ""));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
