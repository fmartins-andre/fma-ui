import { cn } from "cn";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/core/button/button";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";

type CopyStatus = "idle" | "copied" | "failed";

type UseCopyToClipboardOptions = {
  /** How long the copied/failed state lasts, in ms. `0` keeps it until the next copy. */
  timeout?: number;
  onCopy?: (value: string) => void;
  onCopyError?: (error: unknown) => void;
};

/**
 * Copies text and tracks the outcome for a moment. For triggers other than
 * `CopyButton`, such as a menu item; the timer is cleared on unmount.
 */
function useCopyToClipboard({
  timeout = 2000,
  onCopy,
  onCopyError,
}: UseCopyToClipboardOptions = {}) {
  // `count` restarts the timer on every copy, even when the status repeats.
  const [state, setState] = React.useState<{ status: CopyStatus; count: number }>({
    status: "idle",
    count: 0,
  });

  React.useEffect(() => {
    if (state.status === "idle" || timeout === 0) return;
    const id = window.setTimeout(
      () => setState((current) => ({ ...current, status: "idle" })),
      timeout,
    );
    return () => window.clearTimeout(id);
  }, [state, timeout]);

  const copy = React.useCallback(
    async (value: string) => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
        await navigator.clipboard.writeText(value);
        setState((current) => ({ status: "copied", count: current.count + 1 }));
        onCopy?.(value);
        return true;
      } catch (error) {
        /* Rejection is routine: a denied permission, or a document without
           focus. It is reported, never thrown as an unhandled rejection. */
        setState((current) => ({ status: "failed", count: current.count + 1 }));
        onCopyError?.(error);
        return false;
      }
    },
    [onCopy, onCopyError],
  );

  const reset = React.useCallback(
    () => setState((current) => ({ ...current, status: "idle" })),
    [],
  );

  return { status: state.status, count: state.count, copy, reset };
}

type CopyButtonLabels = {
  /** The button's accessible name; name what is copied ("Copy access key"). */
  copy: string;
  copied: string;
  failed: string;
};

const defaultCopyButtonLabels: CopyButtonLabels = {
  copy: "Copy",
  copied: "Copied",
  failed: "Couldn't copy",
};

type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, "value" | "onCopy" | "children"> &
  UseCopyToClipboardOptions & {
    /** The text copied, or a function read at press time. Empty text copies nothing. */
    value: string | (() => string);
    labels?: Partial<CopyButtonLabels>;
    /** Shows the label, then the outcome, in a tooltip. */
    tooltip?: boolean;
    /** Replaces the icon, e.g. for a text button. */
    children?: React.ReactNode;
  };

/**
 * Copies a value too long to type. The icon turns into a check (or a cross)
 * for a moment, and the outcome is announced in a separate live region: a
 * name change on the focused button is something screen readers rarely read.
 */
function CopyButton({
  value,
  timeout,
  onCopy,
  onCopyError,
  labels: labelsProp,
  tooltip = false,
  variant = "ghost",
  size = "icon-sm",
  className,
  children,
  onPress,
  ...props
}: CopyButtonProps) {
  const labels = { ...defaultCopyButtonLabels, ...labelsProp };
  const { status, count, copy } = useCopyToClipboard({ timeout, onCopy, onCopyError });
  const outcome = status === "copied" ? labels.copied : status === "failed" ? labels.failed : "";

  const button = (
    <Button
      data-slot="copy-button"
      data-copied={status === "copied" || undefined}
      data-copy-failed={status === "failed" || undefined}
      variant={variant}
      size={size}
      aria-label={children ? undefined : labels.copy}
      className={cn(className)}
      onPress={(event) => {
        onPress?.(event);
        const text = typeof value === "function" ? value() : value;
        if (text) void copy(text);
      }}
      {...props}
    >
      {children ??
        (status === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : status === "failed" ? (
          <XIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        ))}
    </Button>
  );

  return (
    <>
      {tooltip ? (
        <TooltipTrigger>
          {button}
          <Tooltip>{outcome || labels.copy}</Tooltip>
        </TooltipTrigger>
      ) : (
        button
      )}
      <span role="status" className="sr-only">
        {/* A repeated outcome alternates a trailing space so it is read again. */}
        {outcome && (count % 2 ? outcome : `${outcome} `)}
      </span>
    </>
  );
}

export {
  CopyButton,
  type CopyButtonLabels,
  type CopyButtonProps,
  type CopyStatus,
  defaultCopyButtonLabels,
  type UseCopyToClipboardOptions,
  useCopyToClipboard,
};
