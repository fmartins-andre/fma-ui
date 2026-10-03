import type { MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import type { MaskitoDateTimeParams } from "@maskito/kit";
import {
  maskitoDateTime,
  maskitoParseDateTime,
  maskitoStringifyDateTime,
  maskitoWithPlaceholder,
} from "@maskito/kit";
import { useMemo } from "react";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

export function dateTimeMaskRemover(value: string | null | undefined): string {
  if (!value?.length) return "";

  const trimmed = value.trim();

  // maskitoParseDateTime requires both date and time parts;
  // preprend default time if missing
  const needsTimePad = !trimmed.includes(",");
  const normalized = needsTimePad ? `${trimmed}, 00:00` : trimmed;

  const parsed = maskitoParseDateTime(normalized, defaultOptions);

  if (!parsed) return "";

  return parsed.toISOString();
}

type DateTimeMaskOptionsProps = Partial<
  Pick<MaskitoDateTimeParams, "dateMode" | "timeMode" | "dateSeparator">
>;

const defaultOptions: MaskitoDateTimeParams = {
  dateMode: "dd/mm/yyyy",
  timeMode: "HH:MM",
  dateSeparator: "/",
};

const DATE_TIME_PLACEHOLDER = "__/__/____, __:__";

const { plugins: dtPlaceholderPlugins, ...dtPlaceholderOptions } = maskitoWithPlaceholder(
  DATE_TIME_PLACEHOLDER,
  true,
);

export const createDateTimeMaskOptions: (options?: DateTimeMaskOptionsProps) => MaskitoOptions = (
  options,
) => {
  const validOptions = { ...defaultOptions, ...options };
  const generatedOptions = maskitoDateTime(validOptions);

  return {
    ...generatedOptions,
    plugins: [...dtPlaceholderPlugins, ...(generatedOptions.plugins ?? [])],
    preprocessors: [
      ...dtPlaceholderOptions.preprocessors,
      ...(generatedOptions.preprocessors ?? []),
    ],
    postprocessors: [
      ...(generatedOptions.postprocessors ?? []),
      ...dtPlaceholderOptions.postprocessors,
    ],
  };
};

export function useCreateDateTimeMaskOptions(
  options?: DateTimeMaskOptionsProps,
): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createDateTimeMaskOptions(options)), [options]);
}

export function dateTimeMaskFormatter(
  value: string | Date | null | undefined,
  options?: DateTimeMaskOptionsProps,
): string {
  const validOptions = { ...defaultOptions, ...options };

  if (value instanceof Date) {
    return maskitoStringifyDateTime(value, validOptions);
  }

  if (!value?.length) return "";

  return maskitoTransform(value, createDateTimeMaskOptions(validOptions));
}
