"use client";

import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";

function LoadingStatus({ label, className }: { label: React.ReactNode; className?: string }) {
  return (
    <div
      role="status"
      data-slot="loading-overlay-status"
      className={cn("flex items-center gap-2 text-sm font-medium text-foreground", className)}
    >
      <Loader2Icon aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
      {label}
    </div>
  );
}

type LoadingOverlayProps = React.ComponentProps<"div"> & {
  isLoading: boolean;
  /** Shown next to the spinner and announced to screen readers. */
  label?: React.ReactNode;
  /** Classes for the wrapper around `children`. */
  contentClassName?: string;
};

/**
 * Covers its children while `isLoading`: they stay visible under a veil but
 * are `inert` (no pointer, keyboard or screen-reader access) and the region
 * is `aria-busy`. For the whole page, use `LoadingScreen`.
 */
function LoadingOverlay({
  isLoading,
  label = "Loading…",
  className,
  contentClassName,
  children,
  ...props
}: LoadingOverlayProps) {
  return (
    <div
      data-slot="loading-overlay"
      data-loading={isLoading || undefined}
      aria-busy={isLoading || undefined}
      className={cn("relative", className)}
      {...props}
    >
      <div inert={isLoading} className={contentClassName}>
        {children}
      </div>
      {isLoading && (
        <div
          data-slot="loading-overlay-veil"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/70 duration-150 animate-in fade-in-0 supports-backdrop-filter:backdrop-blur-[1px]"
        >
          <LoadingStatus label={label} />
        </div>
      )}
    </div>
  );
}

/**
 * Blocks the whole app during an operation that must finish first (saving a
 * status change, completing a purchase). A non-dismissable modal: focus is
 * held, the page behind is hidden from assistive tech and scroll is locked.
 */
function LoadingScreen({
  isLoading,
  label = "Loading…",
  className,
}: {
  isLoading: boolean;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <ModalOverlay
      isOpen={isLoading}
      isDismissable={false}
      isKeyboardDismissDisabled
      data-slot="loading-screen"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/70 duration-150 data-entering:animate-in data-entering:fade-in-0 data-exiting:animate-out data-exiting:fade-out-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
    >
      <Modal className="outline-none">
        <Dialog
          aria-label={typeof label === "string" ? label : "Loading"}
          className="rounded-xl bg-popover px-5 py-4 shadow-md ring-1 ring-foreground/10 outline-none"
        >
          <LoadingStatus label={label} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

export type { LoadingOverlayProps };
export { LoadingOverlay, LoadingScreen };
