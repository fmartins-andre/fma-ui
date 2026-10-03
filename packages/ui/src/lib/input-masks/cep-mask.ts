import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import { useMemo } from "react";
import { createPatternMaskOptions } from "./pattern-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const cepMaskPattern: MaskitoMaskExpression = [/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/];

const cepPlaceholder = "_____-___";

export function cepMaskRemover(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") || "";
}

export function createCepMaskOptions(): MaskitoOptions {
  return createPatternMaskOptions(cepMaskPattern, cepPlaceholder);
}

export function cepMaskFormatter(value: string | null | undefined): string {
  if (!value?.length) return "";
  return maskitoTransform(value, createCepMaskOptions());
}

export function useCreateCepMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCepMaskOptions()), []);
}
