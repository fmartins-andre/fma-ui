import type { MaskitoMask, MaskitoMaskExpression, MaskitoOptions } from "@maskito/core";
import { maskitoTransform, maskitoUpdateElement } from "@maskito/core";
import { maskitoEventHandler, maskitoWithPlaceholder } from "@maskito/kit";
import { useMemo } from "react";

import { cnpjMaskRemover } from "./cnpj-mask";
import { makeStableMaskitoOptions, type StableMaskitoOptions } from "./stable-mask";

const hasLetterRegex = /[a-z]/i;

const genericCpfMaskPattern: MaskitoMaskExpression = [
  /[a-z\d]/i,
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
  "-",
  /[a-z\d]/i,
  /[a-z\d]/i,
  /[a-z\d]/i,
];

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

export const cnpjOrCpfMaskRemover = cnpjMaskRemover;

const CPF_PLACEHOLDER = "___.___.___-___";
const CNPJ_PLACEHOLDER = "__.___.___/____-__";

const { removePlaceholder: removeCpfPlaceholder } = maskitoWithPlaceholder(CPF_PLACEHOLDER, true);

const { removePlaceholder: removeCnpjPlaceholder } = maskitoWithPlaceholder(CNPJ_PLACEHOLDER, true);

function resolveMaskDisplay(value: string): {
  placeholder: string;
  remover: (value: string) => string;
} {
  const cleanValue = cnpjMaskRemover(value);
  const isCnpj = cleanValue.length > 11 || hasLetterRegex.test(cleanValue);
  return isCnpj
    ? { placeholder: CNPJ_PLACEHOLDER, remover: removeCnpjPlaceholder }
    : { placeholder: CPF_PLACEHOLDER, remover: removeCpfPlaceholder };
}

function isCnpjValue(value: string): boolean {
  const cleanValue = cnpjMaskRemover(value);
  return cleanValue.length > 11 || hasLetterRegex.test(cleanValue);
}

function fillCnpjOrCpfPlaceholder(value: string): string {
  const cleanValue = cnpjMaskRemover(value);
  const useCnpj = isCnpjValue(value);
  const placeholder = useCnpj ? CNPJ_PLACEHOLDER : CPF_PLACEHOLDER;

  let result = "";
  let digitIndex = 0;
  for (const char of placeholder) {
    if (char === "_") {
      result += digitIndex < cleanValue.length ? cleanValue[digitIndex] : "_";
      digitIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

function firstPlaceholderPosition(value: string): number {
  const pos = value.indexOf("_");
  return pos === -1 ? value.length : pos;
}

function _createCnpjOrCpfMaskOptions(): MaskitoOptions {
  let cnpjOrCpfIsFocused = false;

  const cnpjOrCpfMaskPattern: MaskitoMask = ({ value }) => {
    const clean = cnpjMaskRemover(value);
    if (clean.length > 11 || hasLetterRegex.test(clean)) {
      return cnpjMaskPattern;
    } else {
      return genericCpfMaskPattern;
    }
  };

  return {
    mask: cnpjOrCpfMaskPattern,
    plugins: [
      maskitoEventHandler("focus", (element) => {
        cnpjOrCpfIsFocused = true;
        maskitoUpdateElement(element, fillCnpjOrCpfPlaceholder(element.value));
      }),
      maskitoEventHandler("blur", (element) => {
        cnpjOrCpfIsFocused = false;
        const { remover } = resolveMaskDisplay(element.value);
        maskitoUpdateElement(element, remover(element.value));
      }),
    ],
    preprocessors: [
      ({ elementState, data }) => {
        if (!cnpjOrCpfIsFocused) return { elementState, data };

        const oldValue = elementState.value;
        const newValue = fillCnpjOrCpfPlaceholder(oldValue);

        if (oldValue === newValue) return { elementState, data };

        const formatChanged = isCnpjValue(oldValue) !== isCnpjValue(newValue);

        return {
          elementState: {
            ...elementState,
            value: newValue,
            ...(formatChanged
              ? {
                  selection: [
                    firstPlaceholderPosition(newValue),
                    firstPlaceholderPosition(newValue),
                  ] as [number, number],
                }
              : {}),
          },
          data,
        };
      },
    ],
    postprocessors: [
      ({ selection, value }) => {
        return {
          selection,
          value: value.toUpperCase(),
        };
      },
      (elementState) => {
        if (!cnpjOrCpfIsFocused) return elementState;

        const oldValue = elementState.value;
        const newValue = fillCnpjOrCpfPlaceholder(oldValue);

        if (oldValue === newValue) return elementState;

        const formatChanged = isCnpjValue(oldValue) !== isCnpjValue(newValue);

        return {
          ...elementState,
          value: newValue,
          ...(formatChanged
            ? {
                selection: [
                  firstPlaceholderPosition(newValue),
                  firstPlaceholderPosition(newValue),
                ] as [number, number],
              }
            : {}),
        };
      },
    ],
  };
}

export const createCnpjOrCpfMaskOptions = _createCnpjOrCpfMaskOptions;

export function useCreateCnpjOrCpfMaskOptions(): StableMaskitoOptions {
  return useMemo(() => makeStableMaskitoOptions(createCnpjOrCpfMaskOptions()), []);
}

export function cnpjOrCpfMaskFormatter(input: string | null | undefined): string {
  if (!input?.length) return "";
  return maskitoTransform(input, createCnpjOrCpfMaskOptions());
}
