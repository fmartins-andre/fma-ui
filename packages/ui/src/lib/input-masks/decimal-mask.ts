import type { MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import type { MaskitoNumberParams } from "@maskito/kit";
import { maskitoNumber, maskitoStringifyNumber } from "@maskito/kit";
import { useMemo } from "react";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

export function decimalMaskRemover(value: string | null | undefined): string {
  return value?.replace(/[^\d,]/g, "").replace(",", ".") || "";
}

type DecimalMaskOptionsProps = Partial<
  Pick<
    MaskitoNumberParams,
    "min" | "max" | "minimumFractionDigits" | "maximumFractionDigits" | "prefix" | "postfix"
  >
>;

const defaultOptions: MaskitoNumberParams = {
  decimalSeparator: ",",
  thousandSeparator: ".",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export const createDecimalMaskOptions: (options?: DecimalMaskOptionsProps) => MaskitoOptions = (
  options,
) => {
  const validOptions = { ...defaultOptions, ...options };

  return maskitoNumber(validOptions);
};

export function useCreateDecimalMaskOptions(
  options?: DecimalMaskOptionsProps,
): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createDecimalMaskOptions(options)), [options]);
}

export function decimalMaskFormatter(
  value: string | number | null | undefined,
  options?: DecimalMaskOptionsProps,
): string {
  const validOptions = { ...defaultOptions, ...options };

  switch (typeof value) {
    case "string":
      return maskitoTransform(value, createDecimalMaskOptions(validOptions));

    case "number":
    case "bigint":
      return maskitoStringifyNumber(value, validOptions);

    default:
      return "";
  }
}
