import { cn } from "cn";
import type * as React from "react";

type Props = Record<string, unknown>;

function mergeRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

/**
 * Merges the calendar's own props with the consumer's: later values win,
 * except `className` (joined with `cn`), `style` (shallow-merged), event
 * handlers (all called, in order) and `ref`s (all set).
 */
function mergeProps<T extends object>(...sources: Array<object | undefined>): T {
  const result: Props = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      const previous = result[key];
      if (value === undefined) continue;
      if (key === "className") {
        result[key] = cn(previous as string | undefined, value as string);
      } else if (key === "style") {
        result[key] = {
          ...(previous as object | undefined),
          ...(value as object),
        };
      } else if (
        /^on[A-Z]/.test(key) &&
        typeof previous === "function" &&
        typeof value === "function"
      ) {
        result[key] = (...args: unknown[]) => {
          previous(...args);
          value(...args);
        };
      } else if (key === "ref" && previous) {
        result[key] = mergeRefs(previous as React.Ref<unknown>, value as React.Ref<unknown>);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

export { mergeProps };
