# university-schedule

Fetches the Lviv university schedule from Google Sheets (tab `<COURSE>к` with the newest date, e.g. " 4к 17.08-22.08.26"), extracts the schedule for **група `<GROUP>` "Комп'ютерні науки"**, and sends it via Telegram. Course and group are set with the `COURSE` / `GROUP` env vars and default to `4` / `ЛБ2F301ДОН23`. Each lesson is enriched with the teacher’s **Zoom** (URL, ID, code) and **Google Meet** link from a separate resources spreadsheet (tab "ЛЕКЦІЇ та ПРАКТИЧНІ!"); schedule teacher names (e.g. "ст.викл. Вітвіновський В.В.") are matched to resources by last name (e.g. "Вітвіновський Володимир Володимирович").

- **Sunday 20:00** — full week schedule, then Monday’s schedule.
- **Mon–Sat 17:00** — schedule for the **next** day (e.g. Monday 17:00 sends Tuesday’s schedule).

## Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `GOOGLE_SHEETS_API_KEY` — Google Cloud project with Sheets API enabled, API key created.
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather).
   - `TELEGRAM_CHAT_ID` — your chat ID (e.g. from `getUpdates` after messaging the bot).

   For calendar sync also set `CALENDAR_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` — see [Google Calendar sync](#google-calendar-sync). Leave `CALENDAR_ID` empty to skip the calendar entirely and keep Telegram-only behaviour.

   Optional: `COURSE` (default `4`), `GROUP` (default `ЛБ2F301ДОН23`), `SPREADSHEET_ID` (schedule), `RESOURCES_SPREADSHEET_ID` (Zoom/Meet links; defaults to [Навчальні ресурси ЄУ](https://docs.google.com/spreadsheets/d/1eSHyaPKkPkJrVk7lcFLFWwlRIYrwcaU8m0oz-TsChNg/)).

3. **Run**

   Use two cron entries so the script runs at the right times:

   - **Sunday 20:00** (full week + Monday):
     ```bash
     0 20 * * 0 cd /path/to/university-schedule && bun run start
     ```
   - **Mon–Sat 17:00** (next day’s schedule):
     ```bash
     0 17 * * 1-6 cd /path/to/university-schedule && bun run start
     ```

   The script decides what to send from the current weekday (no need to pass time).

   - **One-off test (fetch only, no Telegram):**
     ```bash
     bun run fetch
     ```
   - **Manual send** (sends according to today: Sunday → full week + Monday; other days → tomorrow):
     ```bash
     bun run start
     ```

## Scripts

- `bun run start` — fetch schedule; if Sunday send full week then Monday, else send tomorrow’s schedule; send to Telegram.
- `bun run fetch` — fetch and print parsed schedule for the configured group (no Telegram).
- `bun run dev` — run `src/index.ts` with watch.

## Google Calendar sync

Each lesson becomes an event with the teacher's meeting link attached — Zoom for
lectures, Google Meet for practicals, taken from the `Ауд.` column (which says
`zoom`/`meet` per lesson) and falling back to the lesson type. Teachers missing
from the resources spreadsheet get an event with no link.

> **The calendar is wholly owned by this script.** Syncing a day deletes *every*
> event on that calendar for that day before reinserting from the sheet. Point
> `CALENDAR_ID` at a calendar you use for nothing else — never a primary one.

That delete-and-reinsert is the whole update strategy: no diffing, no stored
event IDs, and a cancelled lesson disappears because nothing recreates it.

### Setup

1. **Create a calendar** in Google Calendar (e.g. "University"). Copy its ID from
   *Settings and sharing → Integrate calendar → Calendar ID* into `CALENDAR_ID`.

2. **Set the alert.** On the same page, *Event notifications* → add e.g.
   "Notification, 15 minutes before". Events are created with
   `reminders.useDefault`, so they inherit whatever you set here — change the
   lead time in the UI any time, no code change. Leave it empty and you get no
   alerts.

   Reminders are per-user, so this cannot be set by the script; it has to be
   done in your own calendar settings.

3. **Create a service account** in Google Cloud (*IAM & Admin → Service
   Accounts*), no roles needed. Enable the **Google Calendar API** in the same
   project. Create a JSON key.

   Use a project on the account that owns the calendar. Managed/Workspace orgs
   often block service account key creation.

4. **Share the calendar** with the key's `client_email`
   (`...@....iam.gserviceaccount.com`), permission **"Make changes to events"**.

5. **Store the key.** For `.env`, minify it onto one line:

   ```bash
   python3 -c "import json,sys;print('GOOGLE_SERVICE_ACCOUNT_JSON='+json.dumps(json.load(open(sys.argv[1])),separators=(',',':')))" key.json >> .env
   ```

   For GitHub Actions, paste the raw file into a `GOOGLE_SERVICE_ACCOUNT_JSON`
   secret (multi-line is fine) and add `CALENDAR_ID` as a secret too.

Times are written as wall clock plus `TIME_ZONE` (default `Europe/Kyiv`), so
Google resolves DST itself.

## Tests

```bash
bun test
```
