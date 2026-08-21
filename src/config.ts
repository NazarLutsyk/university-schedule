/**
 * Configuration: course/group to track and spreadsheet IDs.
 * All values overridable via env vars.
 */

/** Course year, used as the sheet tab prefix (e.g. "4" -> tabs like " 4к 17.08-22.08.26"). */
export const COURSE = process.env.COURSE ?? "4";

/** Group code as it appears in the sheet header (e.g. "ЛБ2F302ДОН23" in `група ЛБ2F302ДОН23 "Комп'ютерні науки"`). */
export const GROUP = process.env.GROUP ?? "ЛБ2F302ДОН23";

export const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID ?? "1n3k33vhPE5hlYANR8hOTtw2zKrSjgZuJLlNGa_7mw8s";

export const RESOURCES_SPREADSHEET_ID =
  process.env.RESOURCES_SPREADSHEET_ID ??
  "1eSHyaPKkPkJrVk7lcFLFWwlRIYrwcaU8m0oz-TsChNg";
