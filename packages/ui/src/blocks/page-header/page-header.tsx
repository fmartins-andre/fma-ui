"use client";

import { cn } from "cn";
import type * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/core/breadcrumb/breadcrumb";
import { Skeleton } from "@/core/skeleton/skeleton";

/**
 * The top of a page: breadcrumbs, title, description, actions and, for areas
 * with sub-pages, a `TabNav` in `PageHeaderNav`. Stacks on narrow screens.
 */
function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    />
  );
}

type PageHeaderBreadcrumb = { label: React.ReactNode; href?: string };

/** The trail to this page; the last item is the current page and isn't a link. */
function PageHeaderBreadcrumbs({
  items,
  className,
  "aria-label": ariaLabel = "Breadcrumb",
}: {
  items: PageHeaderBreadcrumb[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Breadcrumb aria-label={ariaLabel} className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: a breadcrumb trail is positional
            <BreadcrumbItem key={index}>
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Holds the heading on one side and the actions on the other. */
function PageHeaderContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-content"
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
      {...props}
    />
  );
}

/** Title, description and anything that sits beside the title (e.g. a status select). */
function PageHeaderHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-heading"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

/** The page's `<h1>`. `isLoading` shows a skeleton while the name loads. */
function PageHeaderTitle({
  className,
  isLoading = false,
  children,
  ...props
}: React.ComponentProps<"h1"> & { isLoading?: boolean }) {
  return (
    <h1
      data-slot="page-header-title"
      aria-busy={isLoading || undefined}
      className={cn("min-w-0 text-2xl leading-tight font-semibold tracking-tight", className)}
      {...props}
    >
      {isLoading ? <Skeleton className="h-8 w-48 max-w-full" /> : children}
    </h1>
  );
}

function PageHeaderDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Page actions; they wrap, and stretch to the full width on narrow screens. */
function PageHeaderActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 max-sm:*:[[data-slot=button]]:flex-1",
        className,
      )}
      {...props}
    />
  );
}

/** Navigation between the area's sub-pages, under the heading — usually a `TabNav`. */
function PageHeaderNav({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="page-header-nav" className={cn("min-w-0 pt-1", className)} {...props} />;
}

export type { PageHeaderBreadcrumb };
export {
  PageHeader,
  PageHeaderActions,
  PageHeaderBreadcrumbs,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderNav,
  PageHeaderTitle,
};
