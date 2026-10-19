"use client";

import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/core/alert-dialog/alert-dialog";
import { Button } from "@/core/button/button";
import type { DialogController } from "@/hooks/use-dialog-promise";

type OrFromData<T, D> = T | ((data: D | undefined) => T);

type ConfirmDialogProps<D> = {
  /** From `useDialogPromise<D>()`; `await controller.open(data)` to ask. */
  controller: DialogController<D, void>;
  title: OrFromData<React.ReactNode, D>;
  description?: OrFromData<React.ReactNode, D>;
  /** Extra content under the description. */
  children?: React.ReactNode;
  /** An icon shown beside the title. */
  media?: React.ReactNode;
  /** `destructive` paints the confirm button as a destructive action. */
  tone?: "default" | "destructive";
  confirmLabel?: React.ReactNode;
  /** `null` hides the cancel button (a notice with a single action). */
  cancelLabel?: React.ReactNode | null;
  pendingLabel?: React.ReactNode;
  /**
   * Runs on confirm with the dialog still open and the button pending; if it
   * throws, the dialog stays open and shows `errorMessage`.
   */
  onConfirm?: (data: D | undefined) => Promise<void> | void;
  errorMessage?: OrFromData<React.ReactNode, unknown>;
  size?: "default" | "sm";
  className?: string;
};

function resolve<T, D>(value: OrFromData<T, D> | undefined, data: D | undefined) {
  return typeof value === "function" ? (value as (data: D | undefined) => T)(data) : value;
}

/**
 * The ready-made yes/no on top of `useDialogPromise`: title, description,
 * cancel and confirm. Its promise resolves `confirmed`, `cancelled` or
 * `dismissed` (Escape).
 */
function ConfirmDialog<D = void>({
  controller,
  title,
  description,
  children,
  media,
  tone = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel = "Please wait…",
  onConfirm,
  errorMessage = "Something went wrong. Please try again.",
  size = "default",
  className,
}: ConfirmDialogProps<D>) {
  const { data, isPending, error, dialogProps, confirm, cancel } = controller;

  function handleConfirm() {
    void confirm(onConfirm ? async () => onConfirm(data) : undefined);
  }

  return (
    <AlertDialog {...dialogProps} size={size} className={className}>
      <AlertDialogHeader>
        {media && <AlertDialogMedia>{media}</AlertDialogMedia>}
        <AlertDialogTitle>{resolve(title, data)}</AlertDialogTitle>
        {description !== undefined && (
          <AlertDialogDescription>{resolve(description, data)}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      {children}
      {error !== undefined && (
        <p role="alert" data-slot="confirm-dialog-error" className="text-sm text-destructive">
          {typeof errorMessage === "function"
            ? (errorMessage as (error: unknown) => React.ReactNode)(error)
            : errorMessage}
        </p>
      )}
      <AlertDialogFooter>
        {cancelLabel !== null && (
          <AlertDialogCancel isDisabled={isPending} onPress={cancel}>
            {cancelLabel}
          </AlertDialogCancel>
        )}
        <Button
          variant={tone === "destructive" ? "destructive" : "default"}
          isPending={isPending}
          onPress={handleConfirm}
          className={cn(isPending && "cursor-progress")}
        >
          {isPending ? (
            <>
              <Loader2Icon aria-hidden="true" className="animate-spin" />
              {pendingLabel}
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </AlertDialogFooter>
    </AlertDialog>
  );
}

export type { ConfirmDialogProps };
export { ConfirmDialog };
