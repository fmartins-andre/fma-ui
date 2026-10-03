import { getLocalTimeZone } from "@internationalized/date";

/**
 * The adapter needs a locale and an IANA time zone to do calendar-aware
 * arithmetic. date-fns never asked for either of these (it always used the
 * environment's implicit locale/offset), so we keep sane defaults and let
 * consumers override them once, globally, instead of on every call — this
 * is what lets existing `addDays(date, 1)`-style call sites keep working
 * unchanged.
 */

let defaultTimeZone: string | null = null;
let defaultLocale: string | null = null;

/** Returns the time zone used by every adapter function unless overridden. */
export function getDefaultTimeZone(): string {
  return defaultTimeZone ?? getLocalTimeZone();
}

/**
 * Sets the time zone used by every adapter function unless a call passes
 * its own `timeZone` option. Defaults to the runtime's local time zone.
 */
export function setDefaultTimeZone(timeZone: string | null): void {
  defaultTimeZone = timeZone;
}

/** Returns the locale used for locale-sensitive functions (formatting, week start, weekend). */
export function getDefaultLocale(): string {
  return (
    defaultLocale ??
    (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : "en-US")
  );
}

/** Sets the locale used for locale-sensitive functions unless a call overrides it. */
export function setDefaultLocale(locale: string | null): void {
  defaultLocale = locale;
}

/** Common options accepted by most adapter functions, mirroring date-fns's `options` bag. */
export interface AdapterOptions {
  /** IANA time zone identifier, e.g. `'America/Sao_Paulo'`. Defaults to {@link getDefaultTimeZone}. */
  timeZone?: string;
  /** BCP 47 locale identifier, e.g. `'pt-BR'`. Defaults to {@link getDefaultLocale}. */
  locale?: string;
}
