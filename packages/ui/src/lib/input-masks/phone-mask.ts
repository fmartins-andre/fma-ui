import type { MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform, maskitoUpdateElement } from "@maskito/core";
import { maskitoEventHandler, maskitoWithPlaceholder } from "@maskito/kit";
import { useMemo } from "react";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const FIXED_PHONE_PLACEHOLDER = "(__) ____-____";
const MOBILE_PHONE_PLACEHOLDER = "(__) _____-____";

const { removePlaceholder: removeFixedPlaceholder } = maskitoWithPlaceholder(
  FIXED_PHONE_PLACEHOLDER,
  true,
);

const { removePlaceholder: removeMobilePlaceholder } = maskitoWithPlaceholder(
  MOBILE_PHONE_PLACEHOLDER,
  true,
);

function resolvePhoneDisplay(value: string): {
  placeholder: string;
  remover: (value: string) => string;
} {
  const numericValue = phoneMaskRemover(value);
  const isMobile = numericValue.charAt(2) === "9";
  return isMobile
    ? {
        placeholder: MOBILE_PHONE_PLACEHOLDER,
        remover: removeMobilePlaceholder,
      }
    : { placeholder: FIXED_PHONE_PLACEHOLDER, remover: removeFixedPlaceholder };
}

function isPhoneMobile(value: string): boolean {
  const numericValue = phoneMaskRemover(value);
  return numericValue.charAt(2) === "9";
}

function fillPhonePlaceholder(value: string): string {
  const numericValue = phoneMaskRemover(value);
  const isMobile = isPhoneMobile(value) || numericValue.length >= 11;
  const placeholder = isMobile ? MOBILE_PHONE_PLACEHOLDER : FIXED_PHONE_PLACEHOLDER;

  let result = "";
  let digitIndex = 0;
  for (const char of placeholder) {
    if (char === "_") {
      result += digitIndex < numericValue.length ? numericValue[digitIndex] : "_";
      digitIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

const fixePhoneMaskPattern: MaskitoMaskExpression = [
  "(",
  /\d/,
  /\d/,
  ")",
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  "-",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

const mobilePhoneMaskPattern: MaskitoMaskExpression = [
  "(",
  /\d/,
  /\d/,
  ")",
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  "-",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

export function phoneMaskRemover(value: string) {
  return value.replace(/\D/g, "");
}

function _createPhoneMaskOptions(): MaskitoOptions {
  let phoneIsFocused = false;

  return {
    mask: ({ value }) => {
      const numericValue = phoneMaskRemover(value);
      const isMobile = numericValue.charAt(2) === "9";
      return isMobile ? mobilePhoneMaskPattern : fixePhoneMaskPattern;
    },
    plugins: [
      maskitoEventHandler("focus", (element) => {
        phoneIsFocused = true;
        maskitoUpdateElement(element, fillPhonePlaceholder(element.value));
      }),
      maskitoEventHandler("blur", (element) => {
        phoneIsFocused = false;
        const { remover } = resolvePhoneDisplay(element.value);
        maskitoUpdateElement(element, remover(element.value));
      }),
    ],
    preprocessors: [
      ({ elementState, data }) => {
        if (!phoneIsFocused) return { elementState, data };

        return {
          elementState: {
            ...elementState,
            value: fillPhonePlaceholder(elementState.value),
          },
          data,
        };
      },
    ],
    postprocessors: [
      (elementState) => {
        if (!phoneIsFocused) return elementState;

        return {
          ...elementState,
          value: fillPhonePlaceholder(elementState.value),
        };
      },
    ],
  };
}

export const createPhoneMaskOptions = _createPhoneMaskOptions;

export function phoneMaskFormatter(input: string) {
  if (!input?.length) return "";
  return maskitoTransform(input, createPhoneMaskOptions());
}

export function useCreatePhoneMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createPhoneMaskOptions()), []);
}
