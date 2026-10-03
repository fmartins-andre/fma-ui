import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import { useMemo } from "react";
import { createPatternMaskOptions } from "./pattern-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const cnpjMaskPattern: MaskitoMaskExpression = [
  /[a-z\d]/i,
  /[a-z\d]/i,
  ".",
  /[a-z\d]/i,
  /[a-z\d]/i,
  /[a-z\d]/i,
  ".",
  /[a-z\d]/i,
  /[a-z\d]/i,
  /[a-z\d]/i,
  "/",
  /[a-z\d]/i,
  /[a-z\d]/i,
  /[a-z\d]/i,
  /[a-z\d]/i,
  "-",
  /\d/,
  /\d/,
];

const cnpjPlaceholder = "__.___.___/____-__";

export function cnpjMaskRemover(value: string | null | undefined): string {
  return value?.replace(/[^a-z\d]/gi, "").toUpperCase() || "";
}

export function createCnpjMaskOptions(): MaskitoOptions {
  return createPatternMaskOptions(cnpjMaskPattern, cnpjPlaceholder, [
    ({ selection, value }) => ({
      selection,
      value: value.toUpperCase(),
    }),
  ]);
}

export function cnpjMaskFormatter(value: string | null | undefined): string {
  if (!value?.length) return "";
  return maskitoTransform(value, createCnpjMaskOptions());
}

export function useCreateCnpjMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCnpjMaskOptions()), []);
}
