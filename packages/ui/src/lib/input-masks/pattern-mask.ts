import type { MaskitoMaskExpression, MaskitoOptions, MaskitoPostprocessor } from "@maskito/core";
import { maskitoWithPlaceholder } from "@maskito/kit";

/**
 * Shared factory for fixed-pattern masks (CPF, CNPJ, CEP, credit card, …):
 * combines a mask expression with a typed placeholder and optional extra
 * postprocessors. Internal helper — each mask module keeps its own public
 * `create*MaskOptions` / `use*` / remover / formatter API.
 */
export function createPatternMaskOptions(
  pattern: MaskitoMaskExpression,
  placeholder: string,
  extraPostprocessors: MaskitoPostprocessor[] = [],
): MaskitoOptions {
  const { plugins, ...placeholderRest } = maskitoWithPlaceholder(placeholder, true);

  return {
    mask: pattern,
    plugins: [...plugins],
    preprocessors: [...placeholderRest.preprocessors],
    postprocessors: [...placeholderRest.postprocessors, ...extraPostprocessors],
  };
}
