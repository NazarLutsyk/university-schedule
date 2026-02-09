# university-schedule

Fetches the Lviv university schedule from Google Sheets (tab "3к" with the newest date), extracts the schedule for **група 231 он "Комп'ютерні науки"**, and sends it via Telegram. Each lesson is enriched with the teacher’s **Zoom** (URL, ID, code) and **Google Meet** link from a separate resources spreadsheet (tab "ЛЕКЦІЇ та ПРАКТИЧНІ!"); schedule teacher names (e.g. "ст.викл. Вітвіновський В.В.") are matched to resources by last name (e.g. "Вітвіновський Володимир Володимирович").

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

   Optional: `SPREADSHEET_ID` (schedule), `RESOURCES_SPREADSHEET_ID` (Zoom/Meet links; defaults to [Навчальні ресурси ЄУ](https://docs.google.com/spreadsheets/d/1hPzp1MSQYezILtq49GuxiqKUssKsDQ9Tx_tUI6NIPjk/)).

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
- `bun run fetch` — fetch and print parsed schedule for group 231 (no Telegram).
- `bun run dev` — run `src/index.ts` with watch.
