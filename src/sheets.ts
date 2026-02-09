/**
 * Google Sheets access via googleapis: list sheets, find newest "3к" tab, get values.
 * Uses API key only (public sheet).
 */

import { google } from "googleapis";

export type SheetInfo = { sheetId: number; title: string };

/**
 * Get list of sheets (sheetId, title) for a spreadsheet.
 */
export async function getSheetList(
  spreadsheetId: string,
  apiKey: string,
): Promise<SheetInfo[]> {
  const sheets = google.sheets({ version: "v4", auth: apiKey });

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });

  const sheetList = res.data.sheets;

  if (!sheetList?.length) return [];

  return sheetList.map((s) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title ?? "",
  }));
}

const TITLE_3K_REGEX = /3к\s+(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/;

/**
 * From sheet titles, pick the one matching "3к DD.MM-DD.MM.YY" with the newest end date.
 */
export function findNewest3kSheet(titles: SheetInfo[]): SheetInfo | null {
  let best: SheetInfo | null = null;
  let bestEnd = 0;

  for (const s of titles) {
    const m = s.title.match(TITLE_3K_REGEX);

    const endD = m?.[3];
    const endM = m?.[4];
    const endY = m?.[5];

    if (endD === undefined || endM === undefined || endY === undefined)
      continue;

    const endDate = new Date(
      2000 + parseInt(endY, 10),
      parseInt(endM, 10) - 1,
      parseInt(endD, 10),
    ).getTime();

    if (endDate > bestEnd) {
      bestEnd = endDate;
      best = s;
    }
  }

  return best;
}

/**
 * Get sheet values as 2D array.
 * Sheet title is quoted for A1 notation if it contains spaces/special chars.
 */
export async function getSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  rangeSuffix: string,
  apiKey: string,
): Promise<string[][]> {
  const quoted = /[\s'"]/.test(sheetTitle)
    ? `'${sheetTitle.replace(/'/g, "''")}'`
    : sheetTitle;
  const range = `${quoted}!${rangeSuffix}`;

  const sheets = google.sheets({ version: "v4", auth: apiKey });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = res.data.values as string[][] | undefined;
  if (!values?.length) return [];
  return values;
}
