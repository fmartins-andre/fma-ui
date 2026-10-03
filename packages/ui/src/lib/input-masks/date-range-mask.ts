import type { MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import type { MaskitoDateMode, MaskitoDateParams } from "@maskito/kit";
import { maskitoDateRange, maskitoStringifyDate, maskitoWithPlaceholder } from "@maskito/kit";
import { useMemo } from "react";
import { type DateMaskMode, dateMaskRemover, parseIsoDateParts } from "./date-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

// Structurally identical to react-day-picker's `DateRange` type, so values
// from either type are assignable to the other — kept local to avoid a
// react-day-picker dependency for standalone (non-calendar) mask usage.
export type DateRangeValue = {
  from: Date | undefined;
  to?: Date | undefined;
};

export function dateRangeMaskRemover(value: string | null | undefined): string {
  return value?.replace(/[^\d-]/g, "").replace(/--/g, "-") || "";
}

type DateRangeMaskOptionsProps = {
  mode?: MaskitoDateMode;
  dateSeparator?: string;
};

const defaultOptions: { mode: MaskitoDateMode; dateSeparator?: string } = {
  mode: "dd/mm/yyyy",
  dateSeparator: "/",
};

const RANGE_SEPARATOR = " – ";

// Only the 3 modes this design system's date pickers actually use get a
// correctly-shaped placeholder; any other MaskitoDateMode (e.g. the
// American "mm/dd/yyyy") falls back to the original fixed dd/mm/yyyy-shaped
// placeholder, preserving this function's pre-existing behavior for modes
// nothing here exercises.
const RANGE_SEGMENT_PLACEHOLDER: Partial<Record<MaskitoDateMode, string>> = {
  "dd/mm/yyyy": "__/__/____",
  "mm/yyyy": "__/____",
  yyyy: "____",
};
const DEFAULT_RANGE_SEGMENT_PLACEHOLDER = "__/__/____";

export const createDateRangeMaskOptions: (options?: DateRangeMaskOptionsProps) => MaskitoOptions = (
  options,
) => {
  const validOptions: { mode: MaskitoDateMode; dateSeparator?: string } = {
    ...defaultOptions,
    ...options,
  };
  const generatedOptions = maskitoDateRange(validOptions);

  const segmentPlaceholder =
    RANGE_SEGMENT_PLACEHOLDER[validOptions.mode] ?? DEFAULT_RANGE_SEGMENT_PLACEHOLDER;
  const fullPlaceholder = `${segmentPlaceholder}${RANGE_SEPARATOR}${segmentPlaceholder}`;
  const { plugins: drPlaceholderPlugins, ...drPlaceholderOptions } = maskitoWithPlaceholder(
    fullPlaceholder,
    true,
  );

  return {
    ...generatedOptions,
    plugins: [...drPlaceholderPlugins, ...(generatedOptions.plugins ?? [])],
    preprocessors: [
      ...drPlaceholderOptions.preprocessors,
      ...(generatedOptions.preprocessors ?? []),
    ],
    postprocessors: [
      ...(generatedOptions.postprocessors ?? []),
      ...drPlaceholderOptions.postprocessors,
    ],
  };
};

export function useCreateDateRangeMaskOptions(
  options?: DateRangeMaskOptionsProps,
): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createDateRangeMaskOptions(options)), [options]);
}

type DateRangeMaskFormatterInput = string | { from?: Date; to?: Date } | null | undefined;

export function dateRangeMaskFormatter(
  value: DateRangeMaskFormatterInput,
  options?: DateRangeMaskOptionsProps,
): string {
  if (!value) return "";

  if (typeof value === "string") {
    if (!value.length) return "";
    return maskitoTransform(value, createDateRangeMaskOptions(options));
  }

  const { from, to } = value;
  if (!from) return "";

  const stringifyOptions: MaskitoDateParams = {
    mode: options?.mode ?? defaultOptions.mode,
    separator: options?.dateSeparator ?? defaultOptions.dateSeparator ?? "/",
  };
  const fromStr = maskitoStringifyDate(from, stringifyOptions);
  if (!to) return fromStr;
  const toStr = maskitoStringifyDate(to, stringifyOptions);
  return `${fromStr}${RANGE_SEPARATOR}${toStr}`;
}

// Matches each "date segment" in a masked range value directly (rather than
// round-tripping through dateRangeMaskRemover's flattened digit string),
// then delegates each half to dateMaskRemover — same ISO conversion logic
// the single-date mask already uses, no duplication.
const SEGMENT_PATTERN_BY_MODE: Record<DateMaskMode, string> = {
  "dd/mm/yyyy": String.raw`\d{2}\/\d{2}\/\d{4}`,
  "mm/yyyy": String.raw`\d{2}\/\d{4}`,
  yyyy: String.raw`\d{4}`,
};

export function dateRangeMaskParser(
  value: string | null | undefined,
  mode: DateMaskMode = "dd/mm/yyyy",
): { from: string; to: string } {
  if (!value) return { from: "", to: "" };

  const segment = SEGMENT_PATTERN_BY_MODE[mode];

  const fullMatch = value.match(new RegExp(`^(${segment}).*?(${segment})$`));
  if (fullMatch) {
    const [, fromRaw, toRaw] = fullMatch;
    return {
      from: dateMaskRemover(fromRaw, mode),
      to: dateMaskRemover(toRaw, mode),
    };
  }

  // `dateRangeMaskFormatter` emits a bare single segment (no separator) for
  // a from-only range — e.g. the calendar's onSelect firing after the first
  // click of a new selection. Without this branch, that clean single-segment
  // value fails the two-segment match above and silently collapses to
  // `{from: "", to: ""}`, dropping the just-picked `from` on its next
  // render.
  const fromOnlyMatch = value.match(new RegExp(`^(${segment})$`));
  if (fromOnlyMatch) {
    return { from: dateMaskRemover(fromOnlyMatch[1], mode), to: "" };
  }

  return { from: "", to: "" };
}

export function parseIsoDateRangeParts(parts: {
  from: string;
  to: string;
}): DateRangeValue | undefined {
  const from = parseIsoDateParts(parts.from);
  if (!from) return undefined;
  const to = parseIsoDateParts(parts.to);
  return { from, to };
}
