import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

/**
 * The root owns four variables so every part of the tile stays in proportion
 * and is overridable from `className`:
 *
 *   --icon-tile-size       tile width/height
 *   --icon-tile-icon-size  glyph size applied to child svgs
 *   --icon-tile-radius     corner radius (also drives the nested inner card)
 *   --icon-tile-inset      gap between the outer ring and the inner card
 *
 * `frame` and `soft` paint their inner card with an `::after` pseudo element
 * instead of a wrapper node: `isolate` makes the root a stacking context, so
 * the negative z-index pseudo paints above the root background but below the
 * icon.
 *
 * `soft` and `solid` derive their fills from `currentColor` (default
 * `text-primary`), so a single text color class retints the whole tile.
 */
const iconTileVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center align-middle",
    "size-(--icon-tile-size) rounded-(--icon-tile-radius)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-(--icon-tile-icon-size)",
  ],
  {
    variants: {
      variant: {
        /** Plain bordered surface. The quiet default for list rows and toolbars. */
        outline: "border border-border bg-background dark:bg-input/32",
        /** Raised muted fill with a background-colored ring. Reads as a physical chip. */
        elevated:
          "border-2 border-background bg-muted text-accent-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.14)] dark:border",
        /** Tinted ring around a bordered inner card, all from `currentColor`. */
        soft: [
          "isolate bg-current/10 p-(--icon-tile-inset) text-primary",
          "after:absolute after:inset-(--icon-tile-inset) after:-z-10",
          "after:rounded-[calc(var(--icon-tile-radius)-var(--icon-tile-inset))]",
          "after:border after:border-current/20 after:bg-current/5",
        ],
        /** Filled tone with a contrasting glyph. Retint with `bg-*` and a text color. */
        solid: "bg-primary text-primary-foreground",
        /** A muted ring around an inset card, matching `Card`. */
        frame: [
          "isolate border border-border bg-muted/50 p-(--icon-tile-inset)",
          "after:absolute after:inset-(--icon-tile-inset) after:-z-10",
          "after:rounded-[calc(var(--icon-tile-radius)-var(--icon-tile-inset))]",
          "after:border after:border-border after:bg-card after:shadow-xs",
        ],
      },
      size: {
        xs: "[--icon-tile-icon-size:--spacing(3.5)] [--icon-tile-inset:--spacing(0.5)] [--icon-tile-size:--spacing(6)]",
        sm: "[--icon-tile-icon-size:--spacing(4)] [--icon-tile-inset:--spacing(0.5)] [--icon-tile-size:--spacing(8)]",
        default:
          "[--icon-tile-icon-size:--spacing(4.5)] [--icon-tile-inset:--spacing(0.75)] [--icon-tile-size:--spacing(10)]",
        lg: "[--icon-tile-icon-size:--spacing(5.5)] [--icon-tile-inset:--spacing(0.75)] [--icon-tile-size:--spacing(12)]",
        xl: "[--icon-tile-icon-size:--spacing(7)] [--icon-tile-inset:--spacing(1)] [--icon-tile-size:--spacing(14)]",
      },
      radius: {
        // Clamped to a third of the tile, so small tiles keep their corner
        // ratio instead of turning into circles (which is what `full` is for).
        default: "[--icon-tile-radius:min(var(--radius-md),calc(var(--icon-tile-size)/3))]",
        full: "[--icon-tile-radius:calc(infinity*1px)]",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
      radius: "default",
    },
  },
);

type IconTileProps = React.ComponentProps<"span"> & VariantProps<typeof iconTileVariants>;

function IconTile({
  className,
  variant = "outline",
  size = "default",
  radius = "default",
  ...props
}: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      data-variant={variant}
      data-size={size}
      className={cn(iconTileVariants({ variant, size, radius }), className)}
      {...props}
    />
  );
}

export type { IconTileProps };
export { IconTile, iconTileVariants };
