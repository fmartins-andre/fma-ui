"use client";

import { cn } from "cn";
import { BellIcon, CheckCheckIcon, CheckIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Link, useLocale } from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { Button, LinkButton } from "@/core/button/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/core/empty/empty";
import {
  Glance,
  GlanceContent,
  GlanceFooter,
  GlanceHeader,
  GlanceIndicator,
  GlanceTitle,
  GlanceTrigger,
} from "@/core/glance/glance";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";

type NotificationData = {
  id: string;
  title: React.ReactNode;
  message?: React.ReactNode;
  date?: Date | null;
  isRead?: boolean;
  /** Where the notification leads; makes the title a link. */
  href?: string;
  /** Replaces the unread dot with an icon (e.g. an `IconTile`). */
  icon?: React.ReactNode;
};

type NotificationLabels = {
  /** The panel and page list name. */
  title: string;
  /** The bell's accessible name. */
  trigger: (unread: number) => string;
  unread: string;
  read: string;
  markAsRead: string;
  markAllAsRead: string;
  delete: string;
  empty: string;
  emptyDescription: string;
  loading: string;
  viewAll: string;
  formatDate: (date: Date, locale: string) => string;
};

type NotificationI18n = { labels?: Partial<NotificationLabels> };

const defaultNotificationLabels: NotificationLabels = {
  title: "Notifications",
  trigger: (unread) =>
    unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread",
  unread: "Unread",
  read: "Read",
  markAsRead: "Mark as read",
  markAllAsRead: "Mark all as read",
  delete: "Delete",
  empty: "No notifications",
  emptyDescription: "You're all caught up.",
  loading: "Loading notifications…",
  viewAll: "View all notifications",
  formatDate: (date, locale) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date),
};

function useNotificationLabels(i18n?: NotificationI18n): NotificationLabels {
  const overrides = i18n?.labels;
  return React.useMemo(() => ({ ...defaultNotificationLabels, ...overrides }), [overrides]);
}

type NotificationHandlers = {
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Called when the title link is followed (e.g. to mark it as read). */
  onOpen?: (notification: NotificationData) => void;
};

/** An icon button with its label in a tooltip, tied to the notification's title. */
function NotificationAction({
  label,
  describedBy,
  onPress,
  children,
}: {
  label: string;
  describedBy: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TooltipTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        aria-describedby={describedBy}
        onPress={onPress}
      >
        {children}
      </Button>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

/**
 * One notification: unread dot (or icon), title (a link when it has `href`),
 * message, date and the read/delete actions. `variant="card"` is the roomier
 * page layout, with a status badge and the full message.
 */
function NotificationItem({
  notification,
  variant = "compact",
  i18n,
  onMarkAsRead,
  onDelete,
  onOpen,
  className,
}: NotificationHandlers & {
  notification: NotificationData;
  variant?: "compact" | "card";
  i18n?: NotificationI18n;
  className?: string;
}) {
  const labels = useNotificationLabels(i18n);
  const { locale } = useLocale();
  const titleId = React.useId();
  const { id, title, message, date, isRead = false, href, icon } = notification;
  const isCard = variant === "card";

  return (
    <li
      data-slot="notification-item"
      data-variant={variant}
      data-read={isRead || undefined}
      className={cn(
        "flex min-w-0 items-start gap-3",
        isCard ? "rounded-xl border bg-card p-4 text-card-foreground" : "rounded-lg p-2",
        className,
      )}
    >
      {icon ? (
        <span data-slot="notification-media" aria-hidden="true" className="relative shrink-0">
          {icon}
          {!isRead && (
            <span
              data-slot="notification-dot"
              className={cn(
                "absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2",
                isCard ? "ring-card" : "ring-popover",
              )}
            />
          )}
        </span>
      ) : (
        <span
          data-slot="notification-dot"
          aria-hidden="true"
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", !isRead && "bg-primary")}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          className={cn(
            "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1",
            isCard && "justify-between",
          )}
        >
          <span
            id={titleId}
            data-slot="notification-title"
            className={cn(
              "min-w-0 leading-snug",
              isCard ? "text-base" : "text-sm",
              isRead ? "text-muted-foreground" : "font-medium",
            )}
          >
            {href ? (
              <Link
                href={href}
                onPress={() => onOpen?.(notification)}
                className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </span>
          {isCard ? (
            <Badge variant={isRead ? "muted-dot" : "primary-dot"}>
              {isRead ? labels.read : labels.unread}
            </Badge>
          ) : (
            !isRead && <span className="sr-only">{labels.unread}</span>
          )}
        </div>
        {message && (
          <div
            data-slot="notification-message"
            className={cn("text-sm text-muted-foreground", !isCard && "line-clamp-2")}
          >
            {message}
          </div>
        )}
        {date && (
          <time dateTime={date.toISOString()} className="text-xs text-muted-foreground">
            {labels.formatDate(date, locale)}
          </time>
        )}
      </div>
      {(onMarkAsRead || onDelete) && (
        <div data-slot="notification-actions" className="-my-1 flex shrink-0 items-center">
          {onMarkAsRead && !isRead && (
            <NotificationAction
              label={labels.markAsRead}
              describedBy={titleId}
              onPress={() => onMarkAsRead(id)}
            >
              <CheckIcon />
            </NotificationAction>
          )}
          {onDelete && (
            <NotificationAction
              label={labels.delete}
              describedBy={titleId}
              onPress={() => onDelete(id)}
            >
              <Trash2Icon />
            </NotificationAction>
          )}
        </div>
      )}
    </li>
  );
}

function NotificationsEmpty({
  labels,
  className,
}: {
  labels: NotificationLabels;
  className?: string;
}) {
  return (
    <Empty data-slot="notification-empty" className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckCheckIcon />
        </EmptyMedia>
        <EmptyTitle>{labels.empty}</EmptyTitle>
        <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NotificationsLoading({
  labels,
  count,
  variant,
}: {
  labels: NotificationLabels;
  count: number;
  variant: "compact" | "card";
}) {
  return (
    <div
      role="status"
      data-slot="notification-loading"
      className={cn("flex flex-col", variant === "card" ? "gap-3" : "gap-1")}
    >
      <span className="sr-only">{labels.loading}</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          key={index}
          aria-hidden="true"
          className={cn(
            "flex gap-3",
            variant === "card" ? "rounded-xl border p-4" : "rounded-lg p-2",
          )}
        >
          <Skeleton className="mt-1 size-2 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

type NotificationMenuProps = NotificationHandlers & {
  notifications: NotificationData[];
  /** Defaults to the unread items in `notifications`; pass the server's total if it pages. */
  unreadCount?: number;
  isLoading?: boolean;
  /** Shows "Mark all as read" in the panel header while there are unread items. */
  onMarkAllAsRead?: () => void;
  /** The page with every notification; shows the "View all" link in the footer. */
  viewAllHref?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  i18n?: NotificationI18n;
  className?: string;
};

/**
 * The header bell: an icon `GlanceTrigger` with the unread count, opening a
 * panel with the recent notifications, their actions, "Mark all as read" and
 * a link to the full page.
 */
function NotificationMenu({
  notifications,
  unreadCount,
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onOpen,
  viewAllHref,
  isOpen,
  onOpenChange,
  i18n,
  className,
}: NotificationMenuProps) {
  const labels = useNotificationLabels(i18n);
  const unread = unreadCount ?? notifications.filter((item) => !item.isRead).length;

  return (
    <Glance isOpen={isOpen} onOpenChange={onOpenChange}>
      <GlanceTrigger
        size="icon"
        aria-label={labels.trigger(unread)}
        data-slot="notification-trigger"
        className={className}
      >
        <BellIcon />
        {unread > 0 && <GlanceIndicator>{unread > 99 ? "99+" : unread}</GlanceIndicator>}
      </GlanceTrigger>
      <GlanceContent data-slot="notification-menu" className="w-[min(24rem,calc(100vw-2rem))]">
        {({ close }) => (
          <>
            <GlanceHeader className="items-center justify-between">
              <GlanceTitle>{labels.title}</GlanceTitle>
              {onMarkAllAsRead && unread > 0 && (
                <Button variant="ghost" size="xs" onPress={onMarkAllAsRead}>
                  <CheckCheckIcon data-icon="inline-start" />
                  {labels.markAllAsRead}
                </Button>
              )}
            </GlanceHeader>
            <div className="-mx-1 max-h-[min(28rem,60vh)] min-h-0 overflow-y-auto px-1">
              {isLoading ? (
                <NotificationsLoading labels={labels} count={3} variant="compact" />
              ) : notifications.length === 0 ? (
                <NotificationsEmpty labels={labels} className="p-4" />
              ) : (
                <ul aria-label={labels.title} className="flex flex-col gap-1">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      i18n={i18n}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                      onOpen={(item) => {
                        onOpen?.(item);
                        close();
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
            {viewAllHref && (
              <GlanceFooter>
                <LinkButton href={viewAllHref} variant="outline" onPress={close}>
                  {labels.viewAll}
                </LinkButton>
              </GlanceFooter>
            )}
          </>
        )}
      </GlanceContent>
    </Glance>
  );
}

type NotificationListProps = NotificationHandlers & {
  notifications: NotificationData[];
  isLoading?: boolean;
  /** How many placeholders to show while loading. */
  loadingCount?: number;
  i18n?: NotificationI18n;
  className?: string;
};

/** Every notification as cards, for a dedicated page; pair it with `Pagination`. */
function NotificationList({
  notifications,
  isLoading = false,
  loadingCount = 3,
  onMarkAsRead,
  onDelete,
  onOpen,
  i18n,
  className,
}: NotificationListProps) {
  const labels = useNotificationLabels(i18n);

  if (isLoading) {
    return <NotificationsLoading labels={labels} count={loadingCount} variant="card" />;
  }
  if (notifications.length === 0) {
    return <NotificationsEmpty labels={labels} className={cn("border", className)} />;
  }
  return (
    <ul
      aria-label={labels.title}
      data-slot="notification-list"
      className={cn("flex flex-col gap-3", className)}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          variant="card"
          notification={notification}
          i18n={i18n}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );
}

export type {
  NotificationData,
  NotificationI18n,
  NotificationLabels,
  NotificationListProps,
  NotificationMenuProps,
};
export { defaultNotificationLabels, NotificationItem, NotificationList, NotificationMenu };
