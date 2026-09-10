/**
 * Convert schedule sheet cells into wall-clock strings for Google Calendar.
 * Dates look like "07 вересня 2026 р.", time slots like "9:15 - 10:30".
 * We emit local wall time and let Calendar apply the time zone (handles DST for us).
 */

/** Genitive month names as they appear in the sheet's date column. */
const UA_MONTHS = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

/** "07 вересня 2026 р." -> "2026-09-07". Null when the cell is not a date. */
export function parseSheetDate(cell: string): string | null {
  const m = (cell ?? "").match(/(\d{1,2})\s+([А-Яа-яІіЇїЄєҐґ']+)\s+(\d{4})/);
  const day = m?.[1];
  const monthName = m?.[2];
  const year = m?.[3];
  if (!day || !monthName || !year) return null;

  const month = UA_MONTHS.indexOf(monthName.toLowerCase());
  if (month < 0) return null;

  return `${year}-${String(month + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** "9:15 - 10:30" -> ["09:15:00", "10:30:00"]. Null when the cell is not a slot. */
export function parseTimeSlot(time: string): [string, string] | null {
  const m = (time ?? "").match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  const sh = m?.[1];
  const sm = m?.[2];
  const eh = m?.[3];
  const em = m?.[4];
  if (!sh || !sm || !eh || !em) return null;

  return [`${sh.padStart(2, "0")}:${sm}:00`, `${eh.padStart(2, "0")}:${em}:00`];
}
