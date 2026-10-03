import {
  CalendarDateTime,
  fromDate,
  getDayOfWeek,
  toZoned as intlToZoned,
  type ZonedDateTime,
} from "@internationalized/date";

// en-US's first day of the week is Sunday, so this always yields the fixed
// Sunday=0..Saturday=6 index JS Date#getDay() uses, regardless of the
// display locale a consumer configures elsewhere.
const FIXED_WEEK_LOCALE = "en-US";

function resolveEpochMs(dateArgs: Array<number | string>, timeZone: string): number {
  if (dateArgs.length === 0) return Date.now();
  if (dateArgs.length === 1) {
    const [value] = dateArgs;
    return typeof value === "string" ? Date.parse(value) : value;
  }
  const [year, month, day = 1, hours = 0, minutes = 0, seconds = 0, ms = 0] = dateArgs as number[];
  const wallClock = new CalendarDateTime(year, month + 1, day, hours, minutes, seconds, ms);
  return intlToZoned(wallClock, timeZone).toDate().getTime();
}

/**
 * Drop-in replacement for `@date-fns/tz`'s `TZDate`: a `Date` subclass whose
 * getters read wall-clock fields in `timeZone` instead of the process's own
 * zone, backed by `@internationalized/date` instead of `@date-fns/tz`'s own
 * Intl-parsing implementation. The constructor mirrors `Date`'s own overload
 * set with `timeZone` appended as the final argument — `new TZDate(tz)` (now),
 * `new TZDate(epochMs, tz)`, `new TZDate(year, month, day, ..., tz)` — so an
 * existing `new TZDate(...)` call site importing from `@date-fns/tz` needs
 * only its import path swapped to `@/lib/date-fns-compat`.
 */
class TZDate extends Date {
  readonly timeZone: string;
  // Not readonly: the set* overrides below mutate it in step with the
  // instance's own instant (see applyZonedSet) so getters stay consistent
  // after a native-style setDate/setHours/etc. call.
  zoned: ZonedDateTime;

  constructor(timeZone: string);
  constructor(value: number | string, timeZone: string);
  constructor(year: number, month: number, timeZone: string);
  constructor(year: number, month: number, day: number, timeZone: string);
  constructor(year: number, month: number, day: number, hours: number, timeZone: string);
  constructor(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    timeZone: string,
  );
  constructor(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    timeZone: string,
  );
  constructor(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    ms: number,
    timeZone: string,
  );
  constructor(...args: [...Array<number | string>, string]) {
    const timeZone = args[args.length - 1] as string;
    const dateArgs = args.slice(0, -1);
    super(resolveEpochMs(dateArgs, timeZone));
    this.timeZone = timeZone;
    this.zoned = fromDate(this, timeZone);
  }

  getFullYear(): number {
    return this.zoned.year;
  }
  getMonth(): number {
    return this.zoned.month - 1; // internationalized/date is 1-indexed; Date is 0-indexed
  }
  getDate(): number {
    return this.zoned.day;
  }
  getDay(): number {
    return getDayOfWeek(this.zoned, FIXED_WEEK_LOCALE);
  }
  getHours(): number {
    return this.zoned.hour;
  }
  getMinutes(): number {
    return this.zoned.minute;
  }
  getSeconds(): number {
    return this.zoned.second;
  }
  getMilliseconds(): number {
    return this.zoned.millisecond;
  }

  /**
   * Mutates the instance in place (matching native `Date` set* semantics,
   * including *overflow* — `setMonth(13)` rolls into next year, `setDate(0)`
   * rolls back to the last day of the previous month, `setHours(25)` rolls
   * into the next day). `@internationalized/date`'s own `.set()` instead
   * *constrains* (clamps) out-of-range fields, which is the wrong behavior
   * here: real date-fns's own `addMonths` deliberately exploits native
   * overflow (`endOfDesiredMonth.setMonth(month + 1, 0)` to land on "the day
   * before the 1st of next month" = the last day of the target month) to
   * implement ITS OWN clamping on top — so this class has to reproduce raw
   * ECMA overflow, not `@internationalized/date`'s clamping, or that trick
   * silently breaks.
   *
   * The fix mirrors ECMA-262's own `MakeDay`/`MakeDate` algorithm: normalize
   * year+month into a valid (year, month) pair first (months are carried
   * into years via plain integer math, not calendar-aware), land on day 1 of
   * that month (always valid, no clamping possible), then reach the
   * requested day via pure day-count *addition* — which `@internationalized/
   * date`'s `.add({ days })` does with correct carrying and no clamping,
   * since every integer day offset from a valid date is itself valid.
   */
  private applyDateOverflow(year: number, month0: number, day: number): number {
    const totalMonths = year * 12 + month0;
    const normYear = Math.floor(totalMonths / 12);
    const normMonth1 = (((totalMonths % 12) + 12) % 12) + 1;
    const firstOfMonth = this.zoned.set({
      year: normYear,
      month: normMonth1,
      day: 1,
    });
    const target = firstOfMonth.add({ days: day - 1 });
    this.zoned = target;
    const epochMs = target.toDate().getTime();
    this.setTime(epochMs);
    return epochMs;
  }

  /** Same overflow reasoning as {@link applyDateOverflow}, for the time fields. */
  private applyTimeOverflow(
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
  ): number {
    const midnight = this.zoned.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const target = midnight.add({ hours, minutes, seconds, milliseconds });
    this.zoned = target;
    const epochMs = target.toDate().getTime();
    this.setTime(epochMs);
    return epochMs;
  }

  setFullYear(year: number, month?: number, date?: number): number {
    return this.applyDateOverflow(
      year,
      month !== undefined ? month : this.getMonth(),
      date !== undefined ? date : this.getDate(),
    );
  }
  setMonth(month: number, date?: number): number {
    return this.applyDateOverflow(
      this.getFullYear(),
      month,
      date !== undefined ? date : this.getDate(),
    );
  }
  setDate(date: number): number {
    return this.applyDateOverflow(this.getFullYear(), this.getMonth(), date);
  }
  setHours(hours: number, min?: number, sec?: number, ms?: number): number {
    return this.applyTimeOverflow(
      hours,
      min !== undefined ? min : this.getMinutes(),
      sec !== undefined ? sec : this.getSeconds(),
      ms !== undefined ? ms : this.getMilliseconds(),
    );
  }
  setMinutes(min: number, sec?: number, ms?: number): number {
    return this.applyTimeOverflow(
      this.getHours(),
      min,
      sec !== undefined ? sec : this.getSeconds(),
      ms !== undefined ? ms : this.getMilliseconds(),
    );
  }
  setSeconds(sec: number, ms?: number): number {
    return this.applyTimeOverflow(
      this.getHours(),
      this.getMinutes(),
      sec,
      ms !== undefined ? ms : this.getMilliseconds(),
    );
  }
  setMilliseconds(ms: number): number {
    return this.applyTimeOverflow(this.getHours(), this.getMinutes(), this.getSeconds(), ms);
  }

  /** Re-expresses the same instant in a different zone (matches @date-fns/tz's TZDate#withTimeZone). */
  withTimeZone(timeZone: string): TZDate {
    return new TZDate(this.getTime(), timeZone);
  }

  /**
   * Minutes to *add* to local time to get UTC — native `Date`'s own sign
   * convention (positive for zones behind UTC, e.g. `America/Sao_Paulo`
   * returns `180`). Unoverridden, this would return the *process's* offset
   * instead of `this.timeZone`'s.
   */
  getTimezoneOffset(): number {
    return -(this.zoned.offset / 60_000);
  }

  /**
   * `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` need no
   * zoned-field math at all: native `Date.prototype`'s own implementation
   * already reads `this.getTime()` (correct, inherited, unoverridden) — it
   * only needs `timeZone` in its options to render in the right zone
   * instead of the process's. An explicit `options.timeZone` from the
   * caller still wins.
   */
  toLocaleString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return Date.prototype.toLocaleString.call(this, locales, {
      ...options,
      timeZone: options?.timeZone || this.timeZone,
    });
  }
  toLocaleDateString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return Date.prototype.toLocaleDateString.call(this, locales, {
      ...options,
      timeZone: options?.timeZone || this.timeZone,
    });
  }
  toLocaleTimeString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return Date.prototype.toLocaleTimeString.call(this, locales, {
      ...options,
      timeZone: options?.timeZone || this.timeZone,
    });
  }

  /** ISO 8601 with this instance's own zone offset (not "Z") — matches real @date-fns/tz's TZDate#toISOString. */
  toISOString(): string {
    const z = this.zoned;
    const pad = (n: number, width = 2) => String(n).padStart(width, "0");
    const offsetMin = -this.getTimezoneOffset();
    const sign = offsetMin < 0 ? "-" : "+";
    const abs = Math.abs(offsetMin);
    return (
      `${pad(z.year, 4)}-${pad(z.month)}-${pad(z.day)}` +
      `T${pad(z.hour)}:${pad(z.minute)}:${pad(z.second)}.${String(z.millisecond).padStart(3, "0")}` +
      `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    );
  }

  /** "Tue Aug 13 2024" in this instance's own zone — locale-invariant, matching native Date's own toDateString format. */
  toDateString(): string {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: this.timeZone,
    })
      .format(this)
      .replaceAll(",", "");
  }

  /** "07:50:19 GMT+0800" in this instance's own zone — a simplified form of native Date's toTimeString (omits the parenthesized zone name). */
  toTimeString(): string {
    const z = this.zoned;
    const pad = (n: number, width = 2) => String(n).padStart(width, "0");
    const offsetMin = -this.getTimezoneOffset();
    const sign = offsetMin < 0 ? "-" : "+";
    const abs = Math.abs(offsetMin);
    return `${pad(z.hour)}:${pad(z.minute)}:${pad(z.second)} GMT${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
  }

  toString(): string {
    return `${this.toDateString()} ${this.toTimeString()}`;
  }

  /**
   * Real date-fns's own `constructFrom` (see `date-fns/constructFrom.js`)
   * looks for this exact well-known symbol before falling back to
   * `new date.constructor(value)` — which would break here since our
   * constructor's last argument must be a `timeZone` string, not just an
   * epoch value. `Symbol.for` returns the same global symbol regardless of
   * which package requests it, so implementing this needs no dependency on
   * `date-fns` itself: any date-fns-ecosystem function (real date-fns
   * included, e.g. if a test imports it for parity checks) that receives our
   * `TZDate` as its reference date reconstructs another `TZDate` in the same
   * zone instead of silently misconstructing a bad value.
   */
  [Symbol.for("constructDateFrom")](value: number | Date): TZDate {
    return new TZDate(value instanceof Date ? value.getTime() : value, this.timeZone);
  }
}

export { TZDate };
