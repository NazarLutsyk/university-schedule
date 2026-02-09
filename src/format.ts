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

/**
 * Format entries for "full week": grouped by day.
 */
export function formatFullWeek(
  entries: ScheduleEntry[],
  resourcesMap: Map<string, TeacherResources> | null = null,
): string {
  if (entries.length === 0) {
    return "Розклад порожній.";
  }
  const lines: string[] = ["<b>Розклад на тиждень (група 231)</b>"];
  let lastDay = "";
  for (const e of entries) {
    if (e.day !== lastDay) {
      lastDay = e.day;
      lines.push(`\n<b>${escapeHtml(e.day)}</b> ${escapeHtml(e.date)}`);
    }
    lines.push(formatEntry(e, resourcesMap));
  }
  return lines.join("\n\n").trim();
}

/**
 * Format entries for a single day (e.g. "Понеділок").
 * Used for both "today" and "tomorrow" when sending one day's schedule.
 */
export function formatDaySchedule(
  entries: ScheduleEntry[],
  dayName: string,
  resourcesMap: Map<string, TeacherResources> | null = null,
): string {
  if (entries.length === 0) {
    return `На ${escapeHtml(dayName)} пар немає.`;
  }

  const date = entries[0]?.date ?? "";
  const lines: string[] = [
    `<b>Розклад на ${escapeHtml(dayName)}</b> ${escapeHtml(date)}\n`,
  ];

  for (const e of entries) {
    lines.push(formatEntry(e, resourcesMap));
  }

  return lines.join("\n\n").trim();
}
