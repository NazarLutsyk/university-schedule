/**
 * Schedule filtering: full week vs single day.
 */

import type { ScheduleEntry } from "./parse";

/**
 * Full week: return all entries (no filter).
 */
export function getFullWeek(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries;
}

/** Ukrainian day names in order Sunday=0 .. Saturday=6 for mapping from JS getDay(). */
const UA_DAY_NAMES: string[] = [
  "Неділя",
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
];

/**
 * Get the Ukrainian day name for a JS Date (0=Sunday, 1=Monday, ...).
 */
export function getTodayDayName(date: Date): string {
  return UA_DAY_NAMES[date.getDay()] ?? "Неділя";
}

/**
 * Get the Ukrainian day name for the day after the given Date.
 */
export function getTomorrowDayName(date: Date): string {
  const nextDay = (date.getDay() + 1) % 7;
  return UA_DAY_NAMES[nextDay] ?? "Неділя";
}

/**
 * Filter entries to the given day (Ukrainian day name, e.g. "Понеділок").
 */
export function getDaySchedule(
  entries: ScheduleEntry[],
  dayName: string
): ScheduleEntry[] {
  return entries.filter((e) => e.day === dayName);
}
