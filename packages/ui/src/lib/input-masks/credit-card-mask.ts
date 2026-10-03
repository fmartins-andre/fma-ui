import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform } from "@maskito/core";
import { useMemo } from "react";
import { createPatternMaskOptions } from "./pattern-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const creditCardMaskPattern: MaskitoMaskExpression = [
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

const creditCardPlaceholder = "____ ____ ____ ____";

export function creditCardMaskRemover(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") || "";
}

export function createCreditCardMaskOptions(): MaskitoOptions {
  return createPatternMaskOptions(creditCardMaskPattern, creditCardPlaceholder);
}

export function creditCardMaskFormatter(value: string | null | undefined): string {
  if (!value?.length) return "";
  return maskitoTransform(value, createCreditCardMaskOptions());
}

export function useCreateCreditCardMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCreditCardMaskOptions()), []);
}
