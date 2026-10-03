import type { MaskitoOptions } from "@maskito/core";
import type { MaskitoTimeParams } from "@maskito/kit";
import {
  maskitoParseTime,
  maskitoStringifyTime,
  maskitoTime,
  maskitoWithPlaceholder,
} from "@maskito/kit";
import { useMemo } from "react";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

export function timeMaskRemover(value: string | null | undefined): string {
  return value?.replace(/[^\d:]/g, "") || "";
}

type TimeMaskOptionsProps = Partial<Pick<MaskitoTimeParams, "mode">>;

const defaultOptions: MaskitoTimeParams = {
  mode: "HH:MM",
};

const TIME_PLACEHOLDER = "__:__";

const { plugins: timePlaceholderPlugins, ...timePlaceholderOptions } = maskitoWithPlaceholder(
  TIME_PLACEHOLDER,
  true,
);

export const createTimeMaskOptions: (options?: TimeMaskOptionsProps) => MaskitoOptions = (
  options,
) => {
  const validOptions = { ...defaultOptions, ...options };
  const generatedOptions = maskitoTime(validOptions);

  return {
    ...generatedOptions,
    plugins: [...timePlaceholderPlugins, ...(generatedOptions.plugins ?? [])],
    preprocessors: [
      ...timePlaceholderOptions.preprocessors,
      ...(generatedOptions.preprocessors ?? []),
    ],
    postprocessors: [
      ...(generatedOptions.postprocessors ?? []),
      ...timePlaceholderOptions.postprocessors,
    ],
  };
};

export function timeMaskFormatter(
  value: string | number | null | undefined,
  options?: TimeMaskOptionsProps,
): string {
  const validOptions = { ...defaultOptions, ...options };

  if (typeof value === "number") {
    return maskitoStringifyTime(value, validOptions);
  }

  if (value?.length) {
    const num = maskitoParseTime(value, validOptions);
    return maskitoStringifyTime(num, validOptions);
  }

  return "";
}

export function useCreateTimeMaskOptions(options?: TimeMaskOptionsProps): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createTimeMaskOptions(options)), [options]);
}
