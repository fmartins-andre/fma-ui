/**
 * date-fns-shaped API (addDays, format, isBefore, TZDate, ...) backed by
 * @internationalized/date — a supported, permanent compatibility layer, not
 * a temporary shim.
 *
 * Every function here takes and returns plain `Date` objects (or, for the
 * `@date-fns/tz`-shaped pieces, `TZDate`) with the same name/argument order
 * date-fns/`@date-fns/tz` use, so a component that does
 *
 *   import { addDays, format, isBefore } from 'date-fns'
 *   import { TZDate } from '@date-fns/tz'
 *
 * can switch to
 *
 *   import { addDays, format, isBefore, TZDate } from '@/lib/date-fns-compat'
 *
 * without touching call sites. Internally, every operation is delegated to
 * @internationalized/date's calendar engine (DST-safe arithmetic, real
 * calendar-length months/years), instead of date-fns' own millisecond-based
 * math. For new date logic, prefer @internationalized/date's own native
 * types directly. This layer exists for when a component's date-fns coupling is
 * deep/wide enough (a value whose date-fns-family identity, like `TZDate`'s
 * zone-carrying behavior, is threaded through many call sites) that a
 * from-scratch rewrite is high-cost relative to the benefit — importing from
 * here is a legitimate, permanent choice in that case, not a stopgap. Extend
 * this layer (add a missing function/token/class) when a real migration
 * needs it, rather than reinventing the same logic in a component-local
 * module. `toZoned`/`fromZoned` are also exported for the cases where a call
 * site *is* worth migrating directly onto @internationalized/date's own
 * `ZonedDateTime` API instead.
 */

export {
  add,
  addDays,
  addHours,
  addMilliseconds,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  sub,
  subDays,
  subHours,
  subMilliseconds,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
  subYears,
} from "./arithmetic";
export type { WeekOptions } from "./boundaries";
export {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "./boundaries";
export {
  compareAsc,
  compareDesc,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isValid,
  isWeekend,
  max,
  min,
} from "./comparison";
export type { AdapterOptions } from "./context";
export {
  getDefaultLocale,
  getDefaultTimeZone,
  setDefaultLocale,
  setDefaultTimeZone,
} from "./context";
export { fromZoned, toZoned } from "./convert";
export {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  differenceInDays,
  differenceInHours,
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears,
} from "./difference";
export type { FormatISOOptions } from "./format";
export { format, formatISO, parseISO } from "./format";
export { TZDate } from "./tz";
export { getWeek } from "./week";
