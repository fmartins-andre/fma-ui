"use client";

import * as React from "react";

/**
 * How a dialog opened with `open()` ended: confirmed (with the value it
 * produced), cancelled by its cancel action, or dismissed (Escape, clicking
 * outside, or a new `open()`/unmount while it was still open).
 */
type DialogResult<V> =
  | { status: "confirmed"; value: V }
  | { status: "cancelled" }
  | { status: "dismissed" };

// biome-ignore lint/suspicious/noConfusingVoidType: `void` is the generics' "no value" default
type ConfirmArgs<V> = [V] extends [void]
  ? [value?: V | (() => Promise<V>)]
  : [value: V | (() => Promise<V>)];

type DialogController<D = void, V = void> = {
  isOpen: boolean;
  /** What the current (or last) `open()` passed; kept after closing for exit animations. */
  data: D | undefined;
  /** True while an async `confirm` runs; the dialog stays open meanwhile. */
  isPending: boolean;
  /** What an async `confirm` threw; the dialog stays open so the user can retry. */
  error: unknown;
  /** Spread on `AlertDialog`, `Dialog`, `Sheet`… (`isOpen` / `onOpenChange`). */
  dialogProps: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void };
  /** Opens the dialog and resolves when it ends. Never rejects. */
  // biome-ignore lint/suspicious/noConfusingVoidType: `void` is the generics' "no value" default
  open: [D] extends [void]
    ? (data?: D) => Promise<DialogResult<V>>
    : (data: D) => Promise<DialogResult<V>>;
  /**
   * Ends with `confirmed`. Given a function, runs it first: the dialog stays
   * open with `isPending` until it resolves (its result is the value), and
   * stays open with `error` set if it throws.
   */
  confirm: (...args: ConfirmArgs<V>) => Promise<void>;
  /** Ends with `cancelled`. */
  cancel: () => void;
};

/**
 * State and promise for a dialog you render yourself: `open()` it from an
 * event handler, `await` the `DialogResult`, and let the dialog call
 * `confirm(value)` / `cancel()`. The dialog stays plain JSX — title, content,
 * validation and buttons are yours — so it can live in its own component that
 * receives the controller.
 */
function useDialogPromise<D = void, V = void>(): DialogController<D, V> {
  const [isOpen, setIsOpen] = React.useState(false);
  const [data, setData] = React.useState<D | undefined>(undefined);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<unknown>(undefined);
  const resolverRef = React.useRef<((result: DialogResult<V>) => void) | null>(null);
  const pendingRef = React.useRef(false);

  const settle = React.useCallback((result: DialogResult<V>) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    pendingRef.current = false;
    setIsPending(false);
    setIsOpen(false);
    resolve?.(result);
  }, []);

  // An unmounted dialog can't answer anymore.
  React.useEffect(() => () => resolverRef.current?.({ status: "dismissed" }), []);

  const open = React.useCallback((nextData?: D) => {
    resolverRef.current?.({ status: "dismissed" });
    pendingRef.current = false;
    setIsPending(false);
    setError(undefined);
    setData(nextData);
    setIsOpen(true);
    return new Promise<DialogResult<V>>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirm = React.useCallback(
    async (...args: ConfirmArgs<V>) => {
      if (!resolverRef.current || pendingRef.current) return;
      const [valueOrTask] = args;
      if (typeof valueOrTask !== "function") {
        settle({ status: "confirmed", value: valueOrTask as V });
        return;
      }
      pendingRef.current = true;
      setIsPending(true);
      setError(undefined);
      try {
        const value = await (valueOrTask as () => Promise<V>)();
        settle({ status: "confirmed", value });
      } catch (caught) {
        pendingRef.current = false;
        setIsPending(false);
        setError(caught);
      }
    },
    [settle],
  );

  const cancel = React.useCallback(() => {
    if (!resolverRef.current || pendingRef.current) return;
    settle({ status: "cancelled" });
  }, [settle]);

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      // Closing requests (Escape, outside click, a `slot="close"` button) end
      // the dialog as dismissed — unless it already ended or is still working.
      if (next || !resolverRef.current || pendingRef.current) return;
      settle({ status: "dismissed" });
    },
    [settle],
  );

  return {
    isOpen,
    data,
    isPending,
    error,
    dialogProps: { isOpen, onOpenChange },
    open: open as DialogController<D, V>["open"],
    confirm,
    cancel,
  };
}

export type { DialogController, DialogResult };
export { useDialogPromise };
