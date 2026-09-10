import { expect, test } from "bun:test";
import { parseSheetDate, parseTimeSlot } from "./date";

test("parseSheetDate reads the sheet's Ukrainian date cells", () => {
  expect(parseSheetDate("07 вересня 2026 р.")).toBe("2026-09-07");
  expect(parseSheetDate("1 січня 2027 р.")).toBe("2027-01-01");
  expect(parseSheetDate("дні")).toBeNull();
  expect(parseSheetDate("")).toBeNull();
});

test("parseTimeSlot pads single-digit hours", () => {
  expect(parseTimeSlot("9:15 - 10:30")).toEqual(["09:15:00", "10:30:00"]);
  expect(parseTimeSlot("19:25 - 20:40")).toEqual(["19:25:00", "20:40:00"]);
  expect(parseTimeSlot("час занять")).toBeNull();
});
