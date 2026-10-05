"use client";

import * as React from "react";
import { Input } from "@/core/input/input";
import { type UseMaskOptions, useMask } from "@/hooks/use-mask";

type MaskedInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "defaultValue"> &
  UseMaskOptions;

function MaskedInput({
  mask,
  value,
  defaultValue,
  onValueChange,
  onChange,
  ref: forwardedRef,
  ...props
}: MaskedInputProps) {
  const { inputProps } = useMask({ mask, value, defaultValue, onValueChange });
  const { ref: maskRef, onChange: onMaskChange, ...maskProps } = inputProps;

  // Stable, so Maskito isn't detached and re-attached on every render.
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      maskRef(node);
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [maskRef, forwardedRef],
  );

  return (
    <Input
      data-slot="masked-input"
      {...maskProps}
      {...props}
      value={maskProps.value}
      ref={setRef}
      onChange={(event) => {
        onMaskChange(event);
        onChange?.(event);
      }}
    />
  );
}

export type { MaskedInputProps };
export { MaskedInput };
