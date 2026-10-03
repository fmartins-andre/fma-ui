import {
  parseAbsolute,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
  type ZonedDateTime,
} from "@internationalized/date";

import type { AdapterOptions } from "./context";
import { getDefaultLocale, getDefaultTimeZone } from "./context";
import { assertValid, toZoned } from "./convert";

// ---------------------------------------------------------------------------
// parseISO
// ---------------------------------------------------------------------------

const HAS_BRACKET_TZ = /\[[^\]]+\]\s*$/;
const HAS_OFFSET_OR_Z = /(Z|[+-]\d{2}:?\d{2})\s*(\[[^\]]+\])?$/;
const HAS_TIME = /T|\s\d{2}:\d{2}/;

/**
 * Mirrors date-fns's `parseISO`: parses an ISO 8601 string into a native
 * `Date`. A bare date/time with no offset is interpreted as wall-clock time
 * in `options.timeZone` (default: the adapter's default time zone) — the
 * same "local time" behaviour date-fns' `parseISO` has by default.
 */
export function parseISO(argument: string, options?: AdapterOptions): Date {
  const value = argument.trim();
  const timeZone = options?.timeZone ?? getDefaultTimeZone();

  try {
    if (HAS_BRACKET_TZ.test(value)) {
      return parseZonedDateTime(value).toDate();
    }
    if (HAS_OFFSET_OR_Z.test(value)) {
      return parseAbsolute(value, timeZone).toDate();
    }
    if (HAS_TIME.test(value)) {
      return parseDateTime(value.replace(" ", "T")).toDate(timeZone);
    }
    return parseDate(value).toDate(timeZone);
  } catch {
    return new Date(NaN);
  }
}

// ---------------------------------------------------------------------------
// formatISO
// ---------------------------------------------------------------------------

function pad(n: number, width = 2): string {
  return String(Math.abs(n)).padStart(width, "0");
}

function offsetToString(offsetMs: number): string {
  const sign = offsetMs < 0 ? "-" : "+";
  const totalMinutes = Math.round(Math.abs(offsetMs) / 60000);
  return `${sign}${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

export interface FormatISOOptions extends AdapterOptions {
  representation?: "complete" | "date" | "time";
}

/** Mirrors date-fns's `formatISO`: `2019-09-18T19:00:52+01:00` by default. */
export function formatISO(date: Date, options?: FormatISOOptions): string {
  assertValid(date);
  const zoned = toZoned(date, options?.timeZone);
  const datePart = `${pad(zoned.year, 4)}-${pad(zoned.month)}-${pad(zoned.day)}`;
  const timePart = `${pad(zoned.hour)}:${pad(zoned.minute)}:${pad(zoned.second)}${offsetToString(zoned.offset)}`;
  switch (options?.representation) {
    case "date":
      return datePart;
    case "time":
      return timePart;
    default:
      return `${datePart}T${timePart}`;
  }
}

// ---------------------------------------------------------------------------
// format (date-fns-style format tokens)
// ---------------------------------------------------------------------------

/** A UTC-anchored plain Date carrying only the Y/M/D of a ZonedDateTime, used solely to borrow Intl's locale name tables. */
function fieldsAnchor(zoned: ZonedDateTime): Date {
  return new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour));
}

function localeName(
  zoned: ZonedDateTime,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(fieldsAnchor(zoned));
}

function ordinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function hour12(hour: number): number {
  const h = hour % 12;
  return h === 0 ? 12 : h;
}

/**
 * Supported date-fns format tokens. This is a deliberately curated subset —
 * the tokens used in the overwhelming majority of real codebases — rather
 * than a full reimplementation of date-fns's ~40 tokens. Anything not
 * listed throws instead of silently formatting wrong; the message points
 * at `Intl.DateTimeFormat`, which is what `@internationalized/date`'s own
 * maintainers recommend for formatting.
 */
function buildTokenMap(zoned: ZonedDateTime, locale: string): Record<string, () => string> {
  return {
    yyyy: () => pad(zoned.year, 4),
    yy: () => pad(zoned.year % 100),
    y: () => String(zoned.year),
    MMMM: () => localeName(zoned, locale, { month: "long" }),
    MMM: () => localeName(zoned, locale, { month: "short" }),
    MM: () => pad(zoned.month),
    M: () => String(zoned.month),
    dd: () => pad(zoned.day),
    d: () => String(zoned.day),
    do: () => `${zoned.day}${ordinalSuffix(zoned.day)}`,
    EEEE: () => localeName(zoned, locale, { weekday: "long" }),
    EEE: () => localeName(zoned, locale, { weekday: "short" }),
    EEEEE: () => localeName(zoned, locale, { weekday: "narrow" }),
    HH: () => pad(zoned.hour),
    H: () => String(zoned.hour),
    hh: () => pad(hour12(zoned.hour)),
    h: () => String(hour12(zoned.hour)),
    mm: () => pad(zoned.minute),
    m: () => String(zoned.minute),
    ss: () => pad(zoned.second),
    s: () => String(zoned.second),
    SSS: () => pad(zoned.millisecond, 3),
    a: () =>
      localeName(zoned, locale, { hour: "numeric", hour12: true }).replace(/[\d:\s]/g, "") ||
      (zoned.hour < 12 ? "AM" : "PM"),
    X: () => offsetToString(zoned.offset).replace(":00", "").replace(":", ""),
    XX: () => offsetToString(zoned.offset).replace(":", ""),
    XXX: () => offsetToString(zoned.offset),
    // date-fns's localized-date family (no time component); the lowercase
    // "p" time family isn't implemented (no caller needs it yet — add it the
    // same way if one shows up).
    PPPP: () => localeName(zoned, locale, { dateStyle: "full" }),
    PPP: () => localeName(zoned, locale, { dateStyle: "long" }),
    PP: () => localeName(zoned, locale, { dateStyle: "medium" }),
    P: () => localeName(zoned, locale, { dateStyle: "short" }),
  };
}

// Splits a format string into quoted literals ('...' / '' for a literal quote) and letter runs, date-fns style.
const TOKEN_REGEXP = /(''|'(?:[^']|'')*'|[a-zA-Z]+|[^a-zA-Z']+)/g;

/**
 * Mirrors date-fns's `format(date, formatStr, options?)` for the token
 * subset listed in {@link buildTokenMap}. Existing calls such as
 * `format(date, 'dd/MM/yyyy')` keep working unchanged.
 */
export function format(date: Date, formatStr: string, options?: AdapterOptions): string {
  assertValid(date);
  const zoned = toZoned(date, options?.timeZone);
  const locale = options?.locale ?? getDefaultLocale();
  const tokenMap = buildTokenMap(zoned, locale);
  const parts = formatStr.match(TOKEN_REGEXP) ?? [];

  return parts
    .map((part) => {
      if (part.startsWith("'")) {
        if (part === "''") return "'";
        return part.slice(1, -1).replace(/''/g, "'");
      }
      if (!/^[a-zA-Z]+$/.test(part)) return part;
      const resolver = tokenMap[part];
      if (!resolver) {
        throw new RangeError(
          `format: unsupported token "${part}". This adapter covers the common date-fns tokens; ` +
            "for anything else, format the ZonedDateTime fields yourself or use Intl.DateTimeFormat directly.",
        );
      }
      return resolver();
    })
    .join("");
}
