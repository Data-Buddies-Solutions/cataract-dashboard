export const EASTERN_TIME_ZONE = "America/New_York";

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

function getPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const zoned = getPartsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second
  );
  return asUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function getEasternDayRange(date: Date = new Date()) {
  const p = getPartsInTimeZone(date, EASTERN_TIME_ZONE);
  const start = zonedTimeToUtc(p.year, p.month, p.day, 0, 0, 0, EASTERN_TIME_ZONE);
  const end = zonedTimeToUtc(p.year, p.month, p.day + 1, 0, 0, 0, EASTERN_TIME_ZONE);
  return { start, end };
}

export function formatDateET(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    ...options,
  }).format(toDate(input));
}

export function formatDateTimeET(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const hasExplicitFields =
    options.weekday !== undefined ||
    options.era !== undefined ||
    options.year !== undefined ||
    options.month !== undefined ||
    options.day !== undefined ||
    options.hour !== undefined ||
    options.minute !== undefined ||
    options.second !== undefined ||
    options.timeZoneName !== undefined;

  const fallbackStyles: Intl.DateTimeFormatOptions = hasExplicitFields
    ? {}
    : { dateStyle: "medium", timeStyle: "short" };

  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    ...fallbackStyles,
    ...options,
  }).format(toDate(input));
}
