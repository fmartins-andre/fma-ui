"use client";

import { cn } from "cn";
import { CircleAlertIcon, InboxIcon, InfoIcon, RefreshCwIcon } from "lucide-react";
import * as React from "react";
import { useLocale } from "react-aria-components";
import { Button } from "@/core/button/button";
import { Card, CardHeader, CardTitle } from "@/core/card/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/core/empty/empty";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Popover, PopoverTrigger } from "@/core/popover/popover";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Spinner } from "@/core/spinner/spinner";

type PanelCardLabels = {
  /** The help button's accessible name. */
  help: string;
  /** The "last updated" line, given the formatted date. */
  updatedAt: (formatted: string) => string;
  formatDate: (date: Date, locale: string) => string;
  /** Announced while the card refetches with its content still on screen. */
  refreshing: string;
  loading: string;
  empty: string;
  emptyDescription: string;
  error: string;
  errorDescription: string;
  retry: string;
};

type PanelCardI18n = { labels?: Partial<PanelCardLabels> };

const defaultPanelCardLabels: PanelCardLabels = {
  help: "More information",
  updatedAt: (formatted) => `Updated ${formatted}`,
  formatDate: (date, locale) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(date),
  refreshing: "Updating",
  loading: "Loading",
  empty: "No data",
  emptyDescription: "There's nothing to show for this period yet.",
  error: "Couldn't load the data",
  errorDescription: "Check your connection and try again.",
  retry: "Try again",
};

const PanelCardContext = React.createContext<PanelCardLabels>(defaultPanelCardLabels);

const usePanelCardLabels = () => React.useContext(PanelCardContext);

/**
 * A `Card` for a panel: a dashboard chart or table, or one resource and its
 * status (a certificate, the current plan). Its `i18n` reaches the header and
 * body inside.
 */
function PanelCard({
  i18n,
  className,
  ...props
}: React.ComponentProps<typeof Card> & { i18n?: PanelCardI18n }) {
  const overrides = i18n?.labels;
  const labels = React.useMemo(() => ({ ...defaultPanelCardLabels, ...overrides }), [overrides]);
  return (
    <PanelCardContext.Provider value={labels}>
      <Card data-slot="panel-card" className={cn("min-w-0", className)} {...props} />
    </PanelCardContext.Provider>
  );
}

/**
 * The standard header: icon, title (a heading, `headingLevel` 2 by default)
 * with an optional help button and `status` (a `Badge`), description, the
 * "last updated" line and a toolbar slot that wraps below the title on narrow
 * cards. `help` opens in a
 * popover, so it works with touch and keyboard. `isRefreshing` spins next to
 * the date while the content stays on screen.
 */
function PanelCardHeader({
  title,
  icon,
  description,
  help,
  status,
  updatedAt,
  isRefreshing,
  toolbar,
  headingLevel = 2,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  help?: React.ReactNode;
  /** The resource's status, next to the title: a `Badge`. */
  status?: React.ReactNode;
  updatedAt?: Date | number;
  isRefreshing?: boolean;
  toolbar?: React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}) {
  const labels = usePanelCardLabels();
  const { locale } = useLocale();
  const date = updatedAt === undefined ? undefined : new Date(updatedAt);
  return (
    <CardHeader
      data-slot="panel-card-header"
      className={cn("flex flex-wrap items-start justify-between gap-3", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        {icon && (
          <IconTile aria-hidden="true" variant="soft" size="sm">
            {icon}
          </IconTile>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-h-8 flex-wrap items-center gap-x-1 gap-y-0.5">
            <CardTitle role="heading" aria-level={headingLevel}>
              {title}
            </CardTitle>
            {help && (
              <PopoverTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={labels.help}
                  className="text-muted-foreground"
                >
                  <InfoIcon />
                </Button>
                <Popover placement="bottom start" className="text-sm">
                  {help}
                </Popover>
              </PopoverTrigger>
            )}
            {status && (
              <span data-slot="panel-card-status" className="ml-1 inline-flex">
                {status}
              </span>
            )}
          </div>
          {description && (
            <div data-slot="panel-card-description" className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
          {(date || isRefreshing) && (
            <div
              data-slot="panel-card-updated-at"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {date && (
                <time dateTime={date.toISOString()}>
                  {labels.updatedAt(labels.formatDate(date, locale))}
                </time>
              )}
              {isRefreshing && <Spinner aria-label={labels.refreshing} className="size-3" />}
            </div>
          )}
        </div>
      </div>
      {toolbar && (
        <div
          data-slot="panel-card-toolbar"
          className="flex flex-wrap items-center justify-end gap-2"
        >
          {toolbar}
        </div>
      )}
    </CardHeader>
  );
}

/**
 * The content area, which swaps itself for the first state that applies:
 * `isLoading` (a skeleton — the first load only; refetches use the header's
 * `isRefreshing`), `isError` (a message, with "Try again" when `onRetry` is
 * given), `isEmpty`, or the children. `emptyState`/`errorState` replace the
 * built-in messages. Give it a `min-h-*` to keep the card's height steady.
 */
function PanelCardBody({
  isLoading,
  isEmpty,
  isError,
  onRetry,
  emptyState,
  errorState,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
}) {
  const labels = usePanelCardLabels();
  let content = children;
  if (isLoading) {
    content = (
      <>
        <Skeleton aria-hidden="true" className="min-h-40 flex-1" />
        <span className="sr-only">{labels.loading}</span>
      </>
    );
  } else if (isError) {
    content = errorState ?? (
      <Empty role="alert" className="p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <CircleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>{labels.error}</EmptyTitle>
          <EmptyDescription>{labels.errorDescription}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button variant="outline" size="sm" onPress={onRetry}>
              <RefreshCwIcon data-icon="inline-start" />
              {labels.retry}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  } else if (isEmpty) {
    content = emptyState ?? (
      <Empty className="p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>{labels.empty}</EmptyTitle>
          <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div
      data-slot="panel-card-body"
      aria-busy={isLoading || undefined}
      className={cn("flex min-w-0 flex-1 flex-col px-(--card-spacing)", className)}
      {...props}
    >
      {content}
    </div>
  );
}

export type { PanelCardI18n, PanelCardLabels };
export { PanelCard, PanelCardBody, PanelCardHeader };
