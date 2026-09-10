/**
 * Sync the schedule into a dedicated Google Calendar.
 *
 * The calendar is managed entirely by this script: syncing a day wipes every
 * event in it for that day and reinserts from the sheet. That is only safe
 * because CALENDAR_ID points at a calendar used for nothing else — never point
 * it at a primary calendar.
 *
 * Alerts come from the calendar's own default notifications (set once in the
 * Google Calendar UI), so events are created with `reminders.useDefault`.
 */

import { google } from "googleapis";
import type { ScheduleEntry } from "./parse";
import type { TeacherResources } from "./resources";
import { parseSheetDate, parseTimeSlot } from "./date";
import { getDaySchedule } from "./schedule";
import { CALENDAR_ID, TIME_ZONE } from "./config";

function getCalendar() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const creds = JSON.parse(raw) as { client_email: string; private_key: string };
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

/** UTC offset ("+03:00") in TIME_ZONE on the given date; midday avoids DST edges. */
function utcOffset(dateIso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    timeZoneName: "longOffset",
  }).formatToParts(new Date(`${dateIso}T12:00:00Z`));
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  return name.replace("GMT", "") || "+00:00";
}

function httpsUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

/**
 * Pick the meeting link for a lesson. The sheet's room column already says
 * "zoom" or "meet" per lesson; fall back to lesson type (л = lecture = Zoom).
 */
function meetingLink(e: ScheduleEntry, res: TeacherResources | undefined): string {
  if (!res) return "";
  const wantsZoom = /zoom/i.test(e.room)
    ? true
    : /meet/i.test(e.room)
      ? false
      : e.type.startsWith("л");
  const preferred = wantsZoom ? res.zoomUrl : res.meetUrl;
  const fallback = wantsZoom ? res.meetUrl : res.zoomUrl;
  const url = preferred || fallback;
  return url ? httpsUrl(url) : "";
}

function toEvent(
  e: ScheduleEntry,
  dateIso: string,
  res: TeacherResources | undefined,
) {
  const slot = parseTimeSlot(e.time);
  if (!slot) return null;
  const [start, end] = slot;

  const lines = e.subject.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const title = lines[0] ?? e.subject;
  const teacher = lines.slice(1).join(", ");

  const link = meetingLink(e, res);
  const description = [
    teacher,
    e.room && e.room !== "—" ? `Аудиторія: ${e.room}` : "",
    link,
    res?.zoomId ? `Zoom ID: ${res.zoomId}` : "",
    res?.zoomCode ? `Код: ${res.zoomCode}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: e.type && e.type !== "—" ? `${title} (${e.type})` : title,
    description,
    location: link,
    start: { dateTime: `${dateIso}T${start}`, timeZone: TIME_ZONE },
    end: { dateTime: `${dateIso}T${end}`, timeZone: TIME_ZONE },
    reminders: { useDefault: true },
  };
}

/** Wipe every event on the calendar for one day, then insert the sheet's lessons. */
async function syncDay(
  dateIso: string,
  entries: ScheduleEntry[],
  resourcesMap: Map<string, TeacherResources> | null,
): Promise<{ deleted: number; created: number }> {
  const calendar = getCalendar();
  const offset = utcOffset(dateIso);

  const existing = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: `${dateIso}T00:00:00${offset}`,
    timeMax: `${dateIso}T23:59:59${offset}`,
    singleEvents: true,
    maxResults: 100,
  });

  let deleted = 0;
  for (const ev of existing.data.items ?? []) {
    if (!ev.id) continue;
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: ev.id });
    deleted++;
  }

  let created = 0;
  for (const e of entries) {
    const res = e.teacherLastName
      ? resourcesMap?.get(e.teacherLastName.toLowerCase())
      : undefined;
    const body = toEvent(e, dateIso, res);
    if (!body) continue;
    await calendar.events.insert({ calendarId: CALENDAR_ID, requestBody: body });
    created++;
  }

  return { deleted, created };
}

/**
 * Sync the named days (e.g. ["Понеділок"]) into the calendar.
 * No-op when CALENDAR_ID is unset, so Telegram-only setups keep working.
 */
export async function syncDays(
  dayNames: string[],
  entries: ScheduleEntry[],
  dayDates: Map<string, string>,
  resourcesMap: Map<string, TeacherResources> | null,
): Promise<void> {
  if (!CALENDAR_ID) {
    console.log("CALENDAR_ID not set, skipping calendar sync.");
    return;
  }

  for (const dayName of dayNames) {
    const dateIso = parseSheetDate(dayDates.get(dayName) ?? "");
    if (!dateIso) {
      console.warn(`No date cell for ${dayName}, skipping calendar sync.`);
      continue;
    }
    const { deleted, created } = await syncDay(
      dateIso,
      getDaySchedule(entries, dayName),
      resourcesMap,
    );
    console.log(`Calendar ${dayName} ${dateIso}: -${deleted} +${created}`);
  }
}
