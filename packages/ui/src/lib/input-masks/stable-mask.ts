import type { MaskitoOptions } from "@maskito/core";

import type { Brand } from "@/lib/types";

export type StableMaskitoOptions = Brand<MaskitoOptions, "StableMaskitoOptions">;

export function makeStableMaskitoOptions(options: MaskitoOptions): StableMaskitoOptions {
  return options as StableMaskitoOptions;
}
