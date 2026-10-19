import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
  Dialog,
  type DialogProps,
  type DialogTriggerProps,
  Heading,
} from "react-aria-components";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Popover, PopoverTrigger } from "@/core/popover/popover";

type GlanceTone = "default" | "info" | "success" | "warning" | "destructive";

const GlanceContext = React.createContext<{ tone: GlanceTone }>({ tone: "default" });

const glanceTriggerVariants = cva(
  "group/glance-trigger relative inline-flex shrink-0 items-center gap-2 rounded-lg border text-left text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      tone: {
        default:
          "border-border bg-background hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground dark:border-input dark:bg-input/30 [&>svg]:text-muted-foreground",
        info: "border-info/30 bg-info/4 hover:bg-info/10 aria-expanded:bg-info/10 dark:bg-info/15 dark:hover:bg-info/25 dark:aria-expanded:bg-info/25 [&>svg]:text-info",
        success:
          "border-success/30 bg-success/4 hover:bg-success/10 aria-expanded:bg-success/10 dark:bg-success/15 dark:hover:bg-success/25 dark:aria-expanded:bg-success/25 [&>svg]:text-success",
        warning:
          "border-warning/30 bg-warning/4 hover:bg-warning/10 aria-expanded:bg-warning/10 dark:bg-warning/15 dark:hover:bg-warning/25 dark:aria-expanded:bg-warning/25 [&>svg]:text-warning",
        destructive:
          "border-destructive/30 bg-destructive/4 hover:bg-destructive/10 aria-expanded:bg-destructive/10 dark:bg-destructive/15 dark:hover:bg-destructive/25 dark:aria-expanded:bg-destructive/25 [&>svg]:text-destructive",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-8 px-2.5 [&_[data-slot=glance-label]]:sr-only",
        icon: "size-10 justify-center",
        "icon-sm": "size-8 justify-center [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "default",
    },
  },
);

const toneTextClass: Record<GlanceTone, string> = {
  default: "text-muted-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

/**
 * Root: wires the trigger to the panel and shares the `tone` with both.
 * Wraps react-aria's `DialogTrigger`, so `isOpen`/`onOpenChange` control it.
 */
function Glance({
  tone = "default",
  ...props
}: DialogTriggerProps & {
  tone?: GlanceTone;
}) {
  const value = React.useMemo(() => ({ tone }), [tone]);
  return (
    <GlanceContext.Provider value={value}>
      <PopoverTrigger {...props} />
    </GlanceContext.Provider>
  );
}

function GlanceTrigger({
  className,
  size = "default",
  ...props
}: Omit<ButtonPrimitiveProps, "className"> &
  Pick<VariantProps<typeof glanceTriggerVariants>, "size"> & {
    className?: string;
  }) {
  const { tone } = React.useContext(GlanceContext);
  return (
    <ButtonPrimitive
      data-slot="glance-trigger"
      data-tone={tone}
      data-size={size}
      className={cn(glanceTriggerVariants({ tone, size }), className)}
      {...props}
    />
  );
}

/** Stacks a `GlanceLabel` over a `GlanceValue` inside the trigger. */
function GlanceText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="glance-text"
      className={cn("flex min-w-0 flex-col items-start leading-tight", className)}
      {...props}
    />
  );
}

/** The small caption on top: what the value is about. Visually hidden at `size="sm"`. */
function GlanceLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="glance-label"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

/** The quick information itself. */
function GlanceValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="glance-value"
      className={cn("max-w-[20ch] truncate font-medium", className)}
      {...props}
    />
  );
}

/**
 * A dot (no children) or a count pinned to the trigger's corner. Decorative:
 * put the meaning in the trigger's accessible name (e.g. `aria-label`).
 */
function GlanceIndicator({ className, children, ...props }: React.ComponentProps<"span">) {
  const hasContent = children !== undefined && children !== null && children !== false;
  return (
    <span
      data-slot="glance-indicator"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground ring-2 ring-background",
        hasContent ? "h-4 min-w-4 px-1 text-[0.625rem] leading-none tabular-nums" : "size-2.5",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * The panel opened by the trigger: a popover holding a dialog, so focus moves
 * in, Escape closes it and focus returns to the trigger. Children can be a
 * function of `{ close }` to close it from an action.
 */
function GlanceContent({
  className,
  placement = "bottom end",
  children,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<typeof Popover>, "children"> & {
  children?: DialogProps["children"];
  "aria-label"?: string;
}) {
  const { tone } = React.useContext(GlanceContext);
  return (
    <Popover
      data-slot="glance-content"
      data-tone={tone}
      placement={placement}
      className={cn("w-80 p-0", className)}
      {...props}
    >
      <Dialog aria-label={ariaLabel} className="flex min-h-0 flex-col gap-3 p-3 outline-none">
        {children}
      </Dialog>
    </Popover>
  );
}

function GlanceHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glance-header"
      className={cn("flex items-start gap-3 [&>[data-slot=glance-media]+div]:flex-1", className)}
      {...props}
    />
  );
}

/** An icon in a tile tinted with the root's `tone`. */
function GlanceMedia({ className, ...props }: React.ComponentProps<typeof IconTile>) {
  const { tone } = React.useContext(GlanceContext);
  return (
    <IconTile
      data-slot="glance-media"
      variant="soft"
      aria-hidden="true"
      className={cn(toneTextClass[tone], className)}
      {...props}
    />
  );
}

/** The panel's heading; names the dialog for assistive tech. */
function GlanceTitle({ className, ...props }: React.ComponentProps<typeof Heading>) {
  return (
    <Heading
      slot="title"
      data-slot="glance-title"
      className={cn("text-base leading-snug font-medium", className)}
      {...props}
    />
  );
}

function GlanceDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glance-description"
      className={cn("text-sm text-muted-foreground [&_p:not(:last-child)]:mb-2", className)}
      {...props}
    />
  );
}

/** Actions, set apart at the bottom of the panel. */
function GlanceFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glance-footer"
      className={cn(
        "-mx-3 -mb-3 flex items-center justify-end gap-2 border-t p-3 *:[[data-slot=button]]:flex-1",
        className,
      )}
      {...props}
    />
  );
}

export type { GlanceTone };
export {
  Glance,
  GlanceContent,
  GlanceDescription,
  GlanceFooter,
  GlanceHeader,
  GlanceIndicator,
  GlanceLabel,
  GlanceMedia,
  GlanceText,
  GlanceTitle,
  GlanceTrigger,
  GlanceValue,
  glanceTriggerVariants,
};
