import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import { useMemo } from "react";
import { createPatternMaskOptions } from "./pattern-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const cpfMaskPattern: MaskitoMaskExpression = [
  /\d/,
  /\d/,
  /\d/,
  ".",
  /\d/,
  /\d/,
  /\d/,
  ".",
  /\d/,
  /\d/,
  /\d/,
  "-",
  /\d/,
  /\d/,
];

const cpfPlaceholder = "___.___.___-__";

export function cpfMaskRemover(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") || "";
}

export function createCpfMaskOptions(): MaskitoOptions {
  return createPatternMaskOptions(cpfMaskPattern, cpfPlaceholder);
}

export function cpfMaskFormatter(input: string | null | undefined): string {
  if (!input?.length) return "";
  return maskitoTransform(input, createCpfMaskOptions());
}

export function useCreateCpfMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCpfMaskOptions()), []);
}
