import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform, maskitoUpdateElement } from "@maskito/core";
import { maskitoCaretGuard, maskitoEventHandler } from "@maskito/kit";
import { useMemo } from "react";
import { getCreditCardNumberLayout } from "@/lib/credit-card-validation";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const PLACEHOLDER_CHAR = "_";

export function creditCardMaskRemover(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") || "";
}

/** The value without the placeholder tail (the `_` and spaces after the last digit). */
function removeCreditCardPlaceholder(value: string): string {
  return value.replace(/[_\s]+$/, "");
}

/** `groups` as text, each digit drawn with `char`: `____ ____ ____ ____`. */
function layoutText(groups: number[], char: string): string {
  return groups.map((size) => char.repeat(size)).join(" ");
}

/** The digits typed so far, followed by the placeholder of the issuer's layout. */
function fillCreditCardPlaceholder(value: string): string {
  const clean = removeCreditCardPlaceholder(value);
  const placeholder = layoutText(getCreditCardNumberLayout(clean).groups, PLACEHOLDER_CHAR);
  return clean + placeholder.slice(clean.length);
}

/**
 * The pattern for the issuer of the digits typed so far: groups 4-4-4-4 (up to
 * 4-4-4-7 for 19-digit numbers), Amex 4-6-5, Diners 4-6-4. The number may grow
 * to the issuer's longest length (19 while the issuer is unknown).
 */
function creditCardMaskPattern(value: string): MaskitoMaskExpression {
  const { maxGroups } = getCreditCardNumberLayout(value);
  return [...layoutText(maxGroups, "#")].map((char) => (char === "#" ? /\d/ : char));
}

/**
 * Card number mask that follows the issuer (`getCreditCardNumberLayout`).
 * While focused, `_` marks the digits still missing for the length shown.
 */
export function createCreditCardMaskOptions(): MaskitoOptions {
  let isFocused = false;

  return {
    mask: ({ value }) => creditCardMaskPattern(value),
    plugins: [
      maskitoCaretGuard((value) => [0, removeCreditCardPlaceholder(value).length]),
      maskitoEventHandler(
        "focus",
        (element) => {
          isFocused = true;
          maskitoUpdateElement(element, fillCreditCardPlaceholder(element.value));
        },
        { capture: true },
      ),
      maskitoEventHandler(
        "blur",
        (element) => {
          isFocused = false;
          maskitoUpdateElement(element, removeCreditCardPlaceholder(element.value));
        },
        { capture: true },
      ),
    ],
    preprocessors: [
      ({ elementState, data }) => {
        const value = removeCreditCardPlaceholder(elementState.value);
        const [from, to] = elementState.selection;
        return {
          elementState: {
            value,
            selection: [Math.min(from, value.length), Math.min(to, value.length)],
          },
          data,
        };
      },
    ],
    postprocessors: [
      (elementState) =>
        isFocused
          ? { ...elementState, value: fillCreditCardPlaceholder(elementState.value) }
          : elementState,
    ],
  };
}

export function creditCardMaskFormatter(value: string | null | undefined): string {
  if (!value?.length) return "";
  return maskitoTransform(value, createCreditCardMaskOptions());
}

export function useCreateCreditCardMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCreditCardMaskOptions()), []);
}
