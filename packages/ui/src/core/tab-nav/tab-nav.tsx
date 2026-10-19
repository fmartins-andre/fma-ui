"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import { Link, type LinkProps } from "react-aria-components";

type TabNavVariant = "default" | "line";

const TabNavContext = React.createContext<{ variant: TabNavVariant; currentHref?: string }>({
  variant: "default",
});

const tabNavListVariants = cva("inline-flex w-max items-center text-muted-foreground", {
  variants: {
    variant: {
      default: "h-8 rounded-lg bg-muted p-[3px]",
      line: "h-9 gap-1",
    },
  },
  defaultVariants: { variant: "default" },
});

/**
 * Route navigation that looks like tabs: a `<nav>` of links where the current
 * page carries `aria-current="page"`. Unlike `Tabs`, there are no panels — each
 * item is a page. Overflowing items scroll sideways, keeping the current one
 * in view. Wrap the app in react-aria's `RouterProvider` for client routing.
 */
function TabNav({
  className,
  listClassName,
  variant = "default",
  currentHref,
  children,
  ...props
}: React.ComponentProps<"nav"> &
  VariantProps<typeof tabNavListVariants> & {
    /** The current path; an item whose `href` equals it is the current page. */
    currentHref?: string;
    listClassName?: string;
  }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resolvedVariant = variant ?? "default";
  const value = React.useMemo(
    () => ({ variant: resolvedVariant, currentHref }),
    [resolvedVariant, currentHref],
  );

  // Bring the current item into view inside the strip, without scrolling the
  // page; again whenever the strip resizes (e.g. once web fonts load).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the current page changes
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const reveal = () => {
      const current = scroller.querySelector<HTMLElement>("[aria-current=page]");
      if (!current) return;
      const view = scroller.getBoundingClientRect();
      const box = current.getBoundingClientRect();
      if (box.left < view.left) scroller.scrollLeft -= view.left - box.left;
      else if (box.right > view.right) scroller.scrollLeft += box.right - view.right;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    for (const element of [scroller, scroller.firstElementChild]) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [currentHref]);

  return (
    <TabNavContext.Provider value={value}>
      <nav
        data-slot="tab-nav"
        data-variant={resolvedVariant}
        className={cn("group/tab-nav min-w-0", className)}
        {...props}
      >
        <div
          ref={scrollRef}
          className="relative max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul
            data-slot="tab-nav-list"
            className={cn(tabNavListVariants({ variant: resolvedVariant }), listClassName)}
          >
            {children}
          </ul>
        </div>
      </nav>
    </TabNavContext.Provider>
  );
}

/**
 * One page. It's current when `isCurrent` is set, or when its `href` matches
 * the `TabNav`'s `currentHref` (exactly, or as a prefix with `matchPrefix`).
 */
function TabNavItem({
  className,
  href,
  isCurrent,
  matchPrefix = false,
  ...props
}: Omit<LinkProps, "className"> & {
  className?: string;
  isCurrent?: boolean;
  /** Also current on sub-paths of `href`. */
  matchPrefix?: boolean;
}) {
  const { currentHref } = React.useContext(TabNavContext);
  const current =
    isCurrent ??
    (!!href &&
      !!currentHref &&
      (currentHref === href || (matchPrefix && currentHref.startsWith(`${href}/`))));

  return (
    <li data-slot="tab-nav-item" className="flex h-full">
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "relative inline-flex h-full items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          // default: the current page is a raised segment
          "group-data-[variant=default]/tab-nav:aria-[current=page]:bg-background group-data-[variant=default]/tab-nav:aria-[current=page]:shadow-sm dark:group-data-[variant=default]/tab-nav:aria-[current=page]:border-input dark:group-data-[variant=default]/tab-nav:aria-[current=page]:bg-input",
          // line: the current page is underlined
          "after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity group-data-[variant=line]/tab-nav:aria-[current=page]:after:opacity-100",
          "aria-[current=page]:text-foreground",
          className,
        )}
        {...props}
      />
    </li>
  );
}

/** A divider between groups of items. */
function TabNavSeparator({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      data-slot="tab-nav-separator"
      className={cn("mx-1 h-4 w-px shrink-0 bg-border", className)}
      {...props}
    />
  );
}

export { TabNav, TabNavItem, TabNavSeparator, tabNavListVariants };
