/**
 * Format schedule entries as readable text for Telegram.
 */

import type { ScheduleEntry } from "./parse";
import type { TeacherResources } from "./resources";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatResources(res: TeacherResources): string {
  const parts: string[] = [];
  if (res.zoomUrl) {
    const zoomLine =
      res.zoomId || res.zoomCode
        ? ` (Код: ${escapeHtml(res.zoomCode || "—")})`
        : "";
    parts.push(`<a href="${escapeHtml(res.zoomUrl)}">Zoom</a> ${zoomLine}`);
  } else if (res.zoomId || res.zoomCode) {
    parts.push(
      `Zoom ID: ${escapeHtml(res.zoomId || "—")}, код: ${escapeHtml(res.zoomCode || "—")}`,
    );
  }
  if (res.meetUrl) {
    const url = res.meetUrl.startsWith("http")
      ? res.meetUrl
      : `https://${res.meetUrl.replace(/^https?:\/\//, "")}`;
    parts.push(`<a href="${escapeHtml(url)}">Meet</a>`);
  }
  return parts.join("\n");
}

function formatEntry(
  e: ScheduleEntry,
  resourcesMap: Map<string, TeacherResources> | null,
): string {
  const lines = [
    `<b>${escapeHtml(e.time)}</b>`,
    `<b>${escapeHtml(e.subject)}</b>`,
    `${e.type} · ${escapeHtml(e.room)}`,
  ];
  if (resourcesMap && e.teacherLastName) {
    const res = resourcesMap.get(e.teacherLastName.toLowerCase());
    if (res) {
      const links = formatResources(res);
      if (links) lines.push(links);
    }
  }
  return lines.join("\n");
}

/** Weekday order for full-week schedule (Monday through Friday only; Saturday is not shown). */
const WEEKDAY_ORDER = [
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
];

/**
 * Format entries for "full week": all weekdays in order, with "Пар немає" for days that have no entries.
 */
export function formatFullWeek(
  entries: ScheduleEntry[],
  resourcesMap: Map<string, TeacherResources> | null = null,
): string {
  const lines: string[] = ["<b>Розклад на тиждень (група 231)</b>"];
  const byDay = new Map<string, ScheduleEntry[]>();
  for (const e of entries) {
    const list = byDay.get(e.day) ?? [];
    list.push(e);
    byDay.set(e.day, list);
  }
  for (const dayName of WEEKDAY_ORDER) {
    const dayEntries = byDay.get(dayName) ?? [];
    const date = dayEntries[0]?.date ?? "";
    const dateStr = date ? ` ${escapeHtml(date)}` : "";
    lines.push(`\n<b>${escapeHtml(dayName)}</b>${dateStr}`);
    if (dayEntries.length === 0) {
      lines.push("Пар немає.");
    } else {
      for (const e of dayEntries) {
        lines.push(formatEntry(e, resourcesMap));
      }
    }
  }
  return lines.join("\n\n").trim();
}

/**
 * Format entries for a single day (e.g. "Понеділок").
 * When empty, returns "Пар немає" so we still send something.
 */
export function formatDaySchedule(
  entries: ScheduleEntry[],
  dayName: string,
  resourcesMap: Map<string, TeacherResources> | null = null,
): string {
  if (entries.length === 0) {
    return `<b>${escapeHtml(dayName)}</b>\nПар немає.`;
  }

  const date = entries[0]?.date ?? "";
  const lines: string[] = [
    `<b>${escapeHtml(dayName)}</b> ${escapeHtml(date)}\n`,
  ];

  for (const e of entries) {
    lines.push(formatEntry(e, resourcesMap));
  }

  return lines.join("\n\n").trim();
}
