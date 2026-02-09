/**
 * Parse schedule sheet: find group 231 columns and extract entries.
 */

export type ScheduleEntry = {
  day: string;
  date: string;
  time: string;
  subject: string;
  type: string;
  room: string;
  /** Last name extracted from subject for teacher resources lookup (e.g. "Вітвіновський"). */
  teacherLastName?: string;
};

const DAY_NAMES = new Set([
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
]);

const HEADER_SCAN_ROWS = 15;

/** Time column must look like a slot (e.g. "09:00 - 10:00" or "15:30-16:30"), not header text like "час занять". */
const TIME_SLOT_REGEX = /\d{1,2}:\d{2}/;

/**
 * Find column indices for group 231 "Комп'ютерні науки".
 * Scans header cells for a cell containing both "231" and "Комп'ютерні науки".
 */
export function findGroup231Columns(rows: string[][]): {
  subjectCol: number;
  typeCol: number;
  roomCol: number;
} | null {
  for (let r = 0; r < Math.min(rows.length, HEADER_SCAN_ROWS); r++) {
    const row = rows[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] ?? "").trim();

      if (cell.includes("231") && cell.includes("Комп'ютерні науки")) {
        return {
          subjectCol: c,
          typeCol: c + 1,
          roomCol: c + 2,
        };
      }
    }
  }
  return null;
}

function getCell(row: string[], col: number): string {
  const v = row[col];
  return (v ?? "").trim();
}

/** Teacher title prefixes in schedule (e.g. "доц.", "ст.викл."). */
const TEACHER_PREFIXES =
  /^(доц\.|проф\.|ст\.викл\.|к\.е\.н\.|к\.н\.|викл\.)\s*/i;

/**
 * Extract teacher last name from schedule subject text.
 * Subject often has format "Subject name\nдоц. LastName I.I." or "проф. Full Name".
 */
export function extractTeacherLastName(subject: string): string | undefined {
  const lines = (subject ?? "")
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const teacherLine = lines.find(
    (line) =>
      line.match(TEACHER_PREFIXES) ||
      /^[А-ЯІЇЄҐ][а-яіїєґ']+\s+[А-ЯІЇЄҐ]\.[А-ЯІЇЄҐ]\.?$/i.test(line),
  );
  const line = teacherLine ?? lines[lines.length - 1];
  if (!line) return undefined;
  const withoutTitle = line.replace(TEACHER_PREFIXES, "").trim();
  const firstWord = withoutTitle.split(/\s+/)[0];
  if (!firstWord || firstWord.length < 2) return undefined;
  return firstWord;
}

/**
 * Parse all schedule entries for group 231 from sheet rows.
 * Data rows have: col0 = day (or empty), col1 = date (or empty), col2 = time; then triplets per group.
 * We carry day/date forward and use time from col2 when present.
 */
export function parseSchedule(
  rows: string[][],
  cols: { subjectCol: number; typeCol: number; roomCol: number },
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  let currentDay = "";
  let currentDate = "";

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const day = getCell(row, 0);
    const date = getCell(row, 1);
    const time = getCell(row, 2);
    const subject = getCell(row, cols.subjectCol);
    const type = getCell(row, cols.typeCol);
    const room = getCell(row, cols.roomCol);

    if (DAY_NAMES.has(day)) {
      currentDay = day;
      currentDate = date;
    }
    if (time && TIME_SLOT_REGEX.test(time)) {
      if (subject || type || room) {
        const teacherLastName = subject
          ? extractTeacherLastName(subject)
          : undefined;
        entries.push({
          day: currentDay,
          date: currentDate,
          time,
          subject: subject || "—",
          type: type || "—",
          room: room || "—",
          teacherLastName,
        });
      }
    }
  }

  return entries;
}
