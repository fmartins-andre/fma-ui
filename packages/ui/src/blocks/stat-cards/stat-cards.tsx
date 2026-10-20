"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  ToggleButton as ToggleButtonPrimitive,
  type ToggleButtonProps as ToggleButtonPrimitiveProps,
} from "react-aria-components";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Skeleton } from "@/core/skeleton/skeleton";

type StatLabels = {
  /** Read by screen readers while a value loads. */
  loading: string;
  /** Read by screen readers in place of the "—" of an unavailable value. */
  unavailable: string;
};

type StatI18n = { labels?: Partial<StatLabels> };

const defaultStatLabels: StatLabels = {
  loading: "Loading",
  unavailable: "Not available",
};

const StatLabelsContext = React.createContext<StatLabels>(defaultStatLabels);

function useMergedLabels(i18n?: StatI18n) {
  const overrides = i18n?.labels;
  return React.useMemo(() => ({ ...defaultStatLabels, ...overrides }), [overrides]);
}

/**
 * The tone tints the icon with the status color and the value with its
 * `*-foreground`, which keeps text contrast on the card surface.
 */
const statVariants = cva(
  "group/stat grid min-w-0 grid-cols-[minmax(0,1fr)_auto] content-start items-start gap-x-3 gap-y-1 text-left",
  {
    variants: {
      tone: {
        default: "[--stat-icon:var(--primary)] [--stat-value:var(--foreground)]",
        success: "[--stat-icon:var(--success)] [--stat-value:var(--success-foreground)]",
        warning: "[--stat-icon:var(--warning)] [--stat-value:var(--warning-foreground)]",
        info: "[--stat-icon:var(--info)] [--stat-value:var(--info-foreground)]",
        destructive:
          "[--stat-icon:var(--destructive)] [--stat-value:var(--destructive-foreground)]",
        muted: "[--stat-icon:var(--muted-foreground)] [--stat-value:var(--muted-foreground)]",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

type StatVariantProps = VariantProps<typeof statVariants> & {
  /** `lg` enlarges the value, for a card that highlights a single figure. */
  size?: "default" | "lg";
};

function statAttributes({ tone, size }: StatVariantProps) {
  return { "data-tone": tone ?? "default", "data-size": size ?? "default" };
}

/** A label, a value and, optionally, an icon and a description. No surface of its own. */
function Stat({ className, tone, size, ...props }: React.ComponentProps<"div"> & StatVariantProps) {
  return (
    <div
      data-slot="stat"
      {...statAttributes({ tone, size })}
      className={cn(statVariants({ tone }), className)}
      {...props}
    />
  );
}

function StatLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-label"
      className={cn("col-start-1 text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * The figure, formatted by the app. `isLoading` shows a skeleton and
 * `isUnavailable` a "—" (e.g. a metric that isn't offered yet); both are
 * announced through `i18n.labels`.
 */
function StatValue({
  className,
  isLoading,
  isUnavailable,
  children,
  ...props
}: React.ComponentProps<"div"> & { isLoading?: boolean; isUnavailable?: boolean }) {
  const labels = React.useContext(StatLabelsContext);
  let content = children;
  if (isLoading) {
    content = (
      <>
        <Skeleton aria-hidden="true" className="h-[1lh] w-16 max-w-full" />
        <span className="sr-only">{labels.loading}</span>
      </>
    );
  } else if (isUnavailable) {
    content = (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{labels.unavailable}</span>
      </>
    );
  }
  return (
    <div
      data-slot="stat-value"
      aria-busy={isLoading || undefined}
      className={cn(
        "col-start-1 font-heading text-2xl leading-tight font-semibold text-(--stat-value) tabular-nums group-data-[size=lg]/stat:text-3xl",
        isUnavailable && !isLoading && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
}

function StatDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-description"
      className={cn("col-span-full text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

/** The icon, in a `soft` `IconTile` tinted by the stat's tone. */
function StatIcon({ className, ...props }: React.ComponentProps<typeof IconTile>) {
  return (
    <IconTile
      data-slot="stat-icon"
      aria-hidden="true"
      variant="soft"
      size="sm"
      className={cn("col-start-2 row-span-2 row-start-1 text-(--stat-icon)", className)}
      {...props}
    />
  );
}

/**
 * Lays stats or stat cards out in as many columns as fit (each at least
 * `13rem`), so it works in a page or inside a card without breakpoints. Its
 * `i18n` reaches every value inside.
 */
function StatGrid({
  className,
  i18n,
  ...props
}: React.ComponentProps<"div"> & { i18n?: StatI18n }) {
  const labels = useMergedLabels(i18n);
  return (
    <StatLabelsContext.Provider value={labels}>
      <div data-slot="stat-grid" className={cn(statGridClassName, className)} {...props} />
    </StatLabelsContext.Provider>
  );
}

const statGridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] items-stretch gap-4";

const statCardClassName =
  "rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10";

/** States shared by the pressable cards: hover, press, keyboard focus, disabled. */
const interactiveCardClassName = [
  "cursor-default outline-none transition-[background-color,box-shadow]",
  "data-hovered:bg-accent/50 data-pressed:bg-accent",
  "data-focus-visible:ring-3 data-focus-visible:ring-ring/50",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
];

/** A static stat on a card surface: the totals above a list or a dashboard. */
function StatCard({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"div"> & StatVariantProps) {
  return (
    <div
      data-slot="stat-card"
      {...statAttributes({ tone, size })}
      className={cn(statVariants({ tone }), statCardClassName, className)}
      {...props}
    />
  );
}

/**
 * A stat card that does something when pressed: open a dialog or popover
 * (as the child of a `DialogTrigger`), run a callback, etc.
 */
function StatCardButton({
  className,
  tone,
  size,
  ...props
}: Omit<ButtonPrimitiveProps, "className"> & { className?: string } & StatVariantProps) {
  return (
    <ButtonPrimitive
      data-slot="stat-card"
      {...statAttributes({ tone, size })}
      className={cn(statVariants({ tone }), statCardClassName, interactiveCardClassName, className)}
      {...props}
    />
  );
}

/** A stat card that navigates, e.g. to the list already filtered by it. */
function StatCardLink({
  className,
  tone,
  size,
  ...props
}: Omit<LinkPrimitiveProps, "className"> & { className?: string } & StatVariantProps) {
  return (
    <LinkPrimitive
      data-slot="stat-card"
      {...statAttributes({ tone, size })}
      className={cn(statVariants({ tone }), statCardClassName, interactiveCardClassName, className)}
      {...props}
    />
  );
}

/**
 * Stat cards that filter a list. A react-aria `ToggleButtonGroup`:
 * `selectionMode="single"` behaves like radios (one total at a time; add
 * `disallowEmptySelection` to keep one picked), `"multiple"` like checkboxes.
 * Controlled with `selectedKeys`/`onSelectionChange`, so the selection maps
 * to a search param. Laid out like `StatGrid`.
 */
function StatCardGroup({
  className,
  i18n,
  children,
  ...props
}: Omit<ToggleButtonGroupProps, "className" | "children"> & {
  className?: string;
  i18n?: StatI18n;
  children?: React.ReactNode;
}) {
  const labels = useMergedLabels(i18n);
  return (
    <ToggleButtonGroup
      data-slot="stat-card-group"
      className={cn(statGridClassName, className)}
      {...props}
    >
      <StatLabelsContext.Provider value={labels}>{children}</StatLabelsContext.Provider>
    </ToggleButtonGroup>
  );
}

/**
 * One selectable card of a `StatCardGroup`, identified by `id`. Selected, it
 * gets the `accent` surface and a primary ring, thicker than the resting one,
 * so the state doesn't rely on color alone.
 */
function StatCardToggle({
  className,
  tone,
  size,
  ...props
}: Omit<ToggleButtonPrimitiveProps, "className"> & { className?: string } & StatVariantProps) {
  return (
    <ToggleButtonPrimitive
      data-slot="stat-card"
      {...statAttributes({ tone, size })}
      className={cn(
        statVariants({ tone }),
        statCardClassName,
        interactiveCardClassName,
        "data-selected:bg-accent data-selected:ring-2 data-selected:ring-primary",
        "data-selected:data-focus-visible:ring-3 data-selected:data-focus-visible:ring-primary",
        className,
      )}
      {...props}
    />
  );
}

export type { StatI18n, StatLabels };
export {
  Stat,
  StatCard,
  StatCardButton,
  StatCardGroup,
  StatCardLink,
  StatCardToggle,
  StatDescription,
  StatGrid,
  StatIcon,
  StatLabel,
  StatValue,
  statVariants,
};
