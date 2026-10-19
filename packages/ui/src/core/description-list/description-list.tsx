import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

const descriptionListVariants = cva("group/description-list text-sm", {
  variants: {
    layout: {
      // Label left, value right: summaries, totals, plan details.
      inline: "flex flex-col gap-2",
      // Label over value, in a grid: record details.
      stacked: "grid gap-x-6 gap-y-4",
    },
    divided: {
      true: "gap-0 divide-y *:py-2 *:first:pt-0 *:last:pb-0",
      false: "",
    },
  },
  defaultVariants: {
    layout: "inline",
    divided: false,
  },
});

/**
 * Term/value pairs on a semantic `<dl>`. `layout="inline"` puts each value at
 * the end of its row; `layout="stacked"` puts it under its term, in a grid
 * whose columns you set with `className` (e.g. `sm:grid-cols-2`).
 */
function DescriptionList({
  className,
  layout = "inline",
  divided = false,
  ...props
}: React.ComponentProps<"dl"> & VariantProps<typeof descriptionListVariants>) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(descriptionListVariants({ layout, divided }), className)}
      {...props}
    />
  );
}

/** One term/value pair (a `<div>` inside the `<dl>`, as HTML allows). */
function DescriptionItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="description-item"
      className={cn(
        "min-w-0",
        "group-data-[layout=inline]/description-list:flex group-data-[layout=inline]/description-list:items-baseline group-data-[layout=inline]/description-list:justify-between group-data-[layout=inline]/description-list:gap-4",
        "group-data-[layout=stacked]/description-list:flex group-data-[layout=stacked]/description-list:flex-col group-data-[layout=stacked]/description-list:gap-1",
        className,
      )}
      {...props}
    />
  );
}

/** The label. An icon child sits before the text. */
function DescriptionTerm({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="description-term"
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-muted-foreground [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        "group-data-[layout=stacked]/description-list:text-xs",
        className,
      )}
      {...props}
    />
  );
}

/** The value. Long values wrap; `truncate` in `className` keeps one line. */
function DescriptionDetails({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="description-details"
      className={cn(
        "min-w-0 font-medium break-words text-foreground",
        "group-data-[layout=inline]/description-list:text-right group-data-[layout=inline]/description-list:tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  descriptionListVariants,
};
