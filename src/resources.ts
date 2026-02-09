/**
 * Load teacher Zoom/Meet links from the "Лекції та практичні!" resources sheet.
 * Structure: col 0 = full name, 1 = Zoom URL, 2 = Zoom ID, 3 = Zoom code, 4 = Google Meet.
 */

import { getSheetValues } from "./sheets";

export type TeacherResources = {
  zoomUrl: string;
  zoomId: string;
  zoomCode: string;
  meetUrl: string;
};

const RESOURCES_SHEET_NAME = "ЛЕКЦІЇ та ПРАКТИЧНІ!";
const RESOURCES_RANGE = "A:E";

/** Skip header and room rows; only rows where A looks like "LastName FirstName Patronymic". */
function isTeacherName(cell: string): boolean {
  const t = cell.trim();
  if (!t || /^\d/.test(t) || t.includes("аудиторія")) return false;
  return t.includes(" ");
}

function normalizeLastName(fullName: string): string {
  const firstWord = fullName.trim().split(/\s+/)[0];
  return (firstWord ?? "").toLowerCase();
}

function trimUrl(s: string): string {
  const t = (s ?? "").trim().replace(/\\+$/, "");
  return t === "-" ? "" : t;
}

/**
 * Fetch resources spreadsheet and build a map: normalized last name -> TeacherResources.
 * Uses same API key as schedule (public sheet).
 */
export async function loadTeacherResources(
  spreadsheetId: string,
  apiKey: string,
): Promise<Map<string, TeacherResources>> {
  const rows = await getSheetValues(
    spreadsheetId,
    RESOURCES_SHEET_NAME,
    RESOURCES_RANGE,
    apiKey,
  );
  const map = new Map<string, TeacherResources>();
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name = (row[0] ?? "").trim();
    if (!isTeacherName(name)) continue;
    const zoomUrl = trimUrl(row[1] ?? "");
    const zoomId = trimUrl(row[2] ?? "");
    const zoomCode = trimUrl(row[3] ?? "");
    const meetUrl = trimUrl(row[4] ?? "");
    if (!zoomUrl && !zoomId && !zoomCode && !meetUrl) continue;
    const key = normalizeLastName(name);
    if (key) map.set(key, { zoomUrl, zoomId, zoomCode, meetUrl });
  }
  return map;
}
