// Title: Event Calendar Nav
// Description: Composable navigation - Today, prev/next, period title, view switcher dropdown, and a free toolbar slot.

"use client";

import { fromDate, toCalendarDate } from "@internationalized/date";
import { cn } from "cn";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type * as React from "react";
import { type ReactNode, useState } from "react";
import { Dialog, DialogTrigger, I18nProvider, type Key } from "react-aria-components";
import { Button } from "@/core/button/button";
import { Calendar } from "@/core/calendar/calendar";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import { Popover } from "@/core/popover/popover";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";
import { format } from "@/lib/date-fns-compat/index";
import {
  useEventCalendarNavigation,
  useEventCalendarSettings,
  useEventCalendarView,
  useEventCalendarViewConfig,
} from "./event-calendar";
import { toZoned } from "./event-calendar-lib";
import { mergeProps } from "./event-calendar-merge-props";
import type { CalendarView } from "./event-calendar-types";

/** Configured nav button variant/size (viewConfig.navButtonVariant/Size)
 *  plus the shared classNames.navButton hook, merged on every nav button. */
function useNavButtonProps(): {
  variant: "ghost" | "outline" | "secondary" | "default";
  size: "sm" | "default";
  iconSize: "icon-sm" | "icon";
  className: string | undefined;
} {
  const viewConfig = useEventCalendarViewConfig();
  return {
    variant: viewConfig.navButtonVariant,
    size: viewConfig.navButtonSize,
    iconSize: viewConfig.navButtonSize === "sm" ? "icon-sm" : "icon",
    className: viewConfig.classNames?.navButton,
  };
}

/** Resolved nav tooltip policy (viewConfig.navTooltips + classNames.navTooltip). */
function useNavTooltipConfig(): {
  disabled: boolean;
  side: "top" | "bottom" | "left" | "right";
  delay: number;
  closeDelay: number;
  timeout: number;
  className: string | undefined;
} {
  const viewConfig = useEventCalendarViewConfig();
  const config = viewConfig.navTooltips === false ? undefined : viewConfig.navTooltips;
  return {
    disabled: viewConfig.navTooltips === false,
    // the nav sits at the top of the calendar, so tooltips open upward by
    // default (away from the grid); collision flipping still drops them below
    // when there is no room above
    side: config?.side ?? "top",
    delay: config?.delay ?? 600,
    closeDelay: config?.closeDelay ?? 0,
    timeout: config?.timeout ?? 300,
    className: viewConfig.classNames?.navTooltip,
  };
}

type NavButtonProps = Omit<React.ComponentProps<typeof Button>, "children"> & {
  children?: ReactNode;
  /**
   * Tooltip policy (the part that usually goes wrong on clickable elements):
   * tooltips appear ONLY on hover or keyboard focus-visible - a pointer click
   * never re-triggers them. Buttons that open overlays (the view switcher)
   * use a hover-only tooltip that is force-closed while the overlay is up and
   * ignores focus, so nothing flashes when focus returns after selection.
   * Icon-only buttons default to their accessible label; Today defaults to
   * the actual current date (info the label doesn't carry). Pass null to
   * disable one, or any node to override; viewConfig.navTooltips=false turns
   * them all off (its object form tunes side/delay/closeDelay/timeout).
   */
  tooltip?: ReactNode | null;
};

/** Hover/focus-visible tooltip wrapper; renders the bare button when disabled
 *  (per-button content=null or viewConfig.navTooltips=false). react-aria
 *  tooltips never open on press or on focus returning from an overlay. */
function NavTooltip({
  content,
  children,
}: {
  content: ReactNode | null;
  children: React.ReactElement;
}) {
  const tooltips = useNavTooltipConfig();
  if (tooltips.disabled || content === null || content === undefined) return children;
  return (
    <TooltipTrigger delay={tooltips.delay} closeDelay={tooltips.closeDelay}>
      {children}
      <Tooltip placement={tooltips.side} className={tooltips.className}>
        {content}
      </Tooltip>
    </TooltipTrigger>
  );
}

function EventCalendarNavToday({ className, children, tooltip, ...props }: NavButtonProps) {
  const { today, isToday } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  // display-zone "today", like every other today derivation in the calendar
  // (a system-zone new Date() can name a different day than Today opens)
  const defaultTooltip = format(
    toZoned(new Date(), settings.timeZone),
    settings.i18n.formats.dayTitle,
    { locale: settings.locale },
  );
  return (
    <NavTooltip content={tooltip === undefined ? defaultTooltip : tooltip}>
      <Button
        variant={nav.variant}
        size={nav.size}
        data-slot="event-calendar-nav-today"
        data-active={isToday || undefined}
        className={cn(nav.className, className)}
        onPress={today}
        {...props}
      >
        {children ?? settings.i18n.labels.today}
      </Button>
    </NavTooltip>
  );
}

function EventCalendarNavPrev({ className, children, tooltip, ...props }: NavButtonProps) {
  const { prev } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  return (
    <NavTooltip content={tooltip === undefined ? settings.i18n.labels.previous : tooltip}>
      <Button
        variant={nav.variant}
        size={nav.iconSize}
        data-slot="event-calendar-nav-prev"
        aria-label={settings.i18n.labels.previous}
        className={cn(nav.className, className)}
        onPress={prev}
        {...props}
      >
        {children ?? <ChevronLeftIcon className="size-4" aria-hidden="true" />}
      </Button>
    </NavTooltip>
  );
}

function EventCalendarNavNext({ className, children, tooltip, ...props }: NavButtonProps) {
  const { next } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const nav = useNavButtonProps();
  return (
    <NavTooltip content={tooltip === undefined ? settings.i18n.labels.next : tooltip}>
      <Button
        variant={nav.variant}
        size={nav.iconSize}
        data-slot="event-calendar-nav-next"
        aria-label={settings.i18n.labels.next}
        className={cn(nav.className, className)}
        onPress={next}
        {...props}
      >
        {children ?? <ChevronRightIcon className="size-4" aria-hidden="true" />}
      </Button>
    </NavTooltip>
  );
}

interface EventCalendarTitleProps extends React.ComponentProps<"div"> {
  format?: (ctx: { title: string }) => ReactNode;
}

function EventCalendarTitle({ className, format: formatTitle, ...props }: EventCalendarTitleProps) {
  const { title } = useEventCalendarNavigation();
  const viewConfig = useEventCalendarViewConfig();
  const defaultProps = {
    "data-slot": "event-calendar-title",
    "aria-live": "polite" as const,
    className: cn(
      "min-w-0 truncate text-sm font-semibold",
      viewConfig.classNames?.title,
      className,
    ),
    children: formatTitle?.({ title }) ?? title,
  };
  return <div {...mergeProps<React.ComponentProps<"div">>(defaultProps, props)} />;
}

interface EventCalendarViewSwitcherProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  children?: ReactNode;
  /** Hover/focus-visible hint; defaults to the "Select view" label. Pass
   *  null to disable. */
  tooltip?: ReactNode | null;
}

function EventCalendarViewSwitcher({
  className,
  children,
  tooltip,
  ...props
}: EventCalendarViewSwitcherProps) {
  const { view, dayCount, availableViews, setView } = useEventCalendarView();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const nav = useNavButtonProps();
  const labels = settings.i18n.labels;
  // Controlled open: selecting a view swaps the whole content subtree in the
  // same press, so closing must not depend on the menu's internal handler.
  const [open, setOpen] = useState(false);

  const viewLabel = (v: CalendarView) =>
    v === "days" ? settings.i18n.viewNames.days(dayCount) : settings.i18n.viewNames[v];
  const activeKey = view === "days" ? `days-${dayCount}` : view;

  const onAction = (key: Key) => {
    setOpen(false);
    const id = String(key);
    if (id.startsWith("days-")) setView("days", { dayCount: Number(id.slice(5)) });
    else setView(id as CalendarView);
  };

  return (
    <DropdownMenuTrigger isOpen={open} onOpenChange={setOpen}>
      <NavTooltip content={tooltip === undefined ? labels.selectView : tooltip}>
        <Button
          variant={nav.variant}
          size={nav.size}
          data-slot="event-calendar-view-switcher"
          aria-label={labels.selectView}
          className={cn("gap-1", nav.className, className)}
          {...props}
        >
          {children ?? (
            <>
              {viewLabel(view)}
              <ChevronDownIcon className="size-4 opacity-60" aria-hidden="true" />
            </>
          )}
        </Button>
      </NavTooltip>
      <DropdownMenu
        selectionMode="single"
        selectedKeys={[activeKey]}
        onAction={onAction}
        className={cn("min-w-44", viewConfig.classNames?.viewSwitcherContent)}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel
            className={cn(
              "font-normal text-muted-foreground",
              viewConfig.classNames?.viewSwitcherLabel,
            )}
          >
            {labels.selectView}
          </DropdownMenuLabel>
          {availableViews.flatMap((v) =>
            v === "days"
              ? viewConfig.dayCountPresets.map((count) => (
                  <DropdownMenuItem
                    key={`days-${count}`}
                    id={`days-${count}`}
                    textValue={settings.i18n.viewNames.days(count)}
                  >
                    {settings.i18n.viewNames.days(count)}
                    {/* hint derived from the preset itself, not i18n's default */}
                    {viewConfig.enableShortcuts && (
                      <EventCalendarViewShortcut>{count}</EventCalendarViewShortcut>
                    )}
                  </DropdownMenuItem>
                ))
              : [
                  <DropdownMenuItem key={v} id={v} textValue={viewLabel(v)}>
                    {viewLabel(v)}
                    {viewConfig.enableShortcuts && (
                      <EventCalendarViewShortcut>
                        {labels.viewShortcuts[v]}
                      </EventCalendarViewShortcut>
                    )}
                  </DropdownMenuItem>,
                ],
          )}
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}

/** Outline key badge; theme-token only, so it adapts to every style. */
function EventCalendarViewShortcut({ children }: { children: ReactNode }) {
  const viewConfig = useEventCalendarViewConfig();
  return (
    <kbd
      data-slot="event-calendar-view-shortcut"
      className={cn(
        "text-muted-foreground ms-auto inline-flex size-5 shrink-0 items-center justify-center rounded-sm border font-sans text-xs",
        viewConfig.classNames?.viewShortcut,
      )}
    >
      {children}
    </kbd>
  );
}

interface EventCalendarDatePickerProps
  extends Omit<React.ComponentProps<typeof Button>, "children"> {
  children?: ReactNode;
  /** Hover/focus-visible hint; defaults to null - no tooltip, because the
   *  button opens an overlay (see the NavButtonProps tooltip policy). */
  tooltip?: ReactNode | null;
}

/**
 * Optional go-to-date picker: the registry's react-aria `Calendar` in a
 * popover. Not part of the default nav - compose it yourself (or any external
 * picker driving useEventCalendarNavigation().goTo). Picking a date re-anchors
 * navigation; the visible range isn't highlighted in week/N-days/agenda views.
 */
function EventCalendarDatePicker({
  className,
  children,
  tooltip = null,
  ...props
}: EventCalendarDatePickerProps) {
  const { date, goTo } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const viewConfig = useEventCalendarViewConfig();
  const nav = useNavButtonProps();
  const [open, setOpen] = useState(false);

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <NavTooltip content={tooltip}>
        <Button
          variant={nav.variant}
          size={nav.iconSize}
          data-slot="event-calendar-date-picker"
          aria-label={settings.i18n.labels.goToDate}
          className={cn(nav.className, className)}
          {...props}
        >
          {children ?? <CalendarIcon className="size-4" aria-hidden="true" />}
        </Button>
      </NavTooltip>
      <Popover
        placement="bottom start"
        className={cn("w-auto p-0!", viewConfig.classNames?.datePickerContent)}
      >
        <Dialog aria-label={settings.i18n.labels.goToDate} className="outline-none">
          <I18nProvider locale={settings.locale}>
            <Calendar
              aria-label={settings.i18n.labels.goToDate}
              value={toCalendarDate(fromDate(date, settings.timeZone))}
              onChange={(picked) => {
                goTo(picked.toDate(settings.timeZone));
                setOpen(false);
              }}
            />
          </I18nProvider>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

type EventCalendarToolbarProps = React.ComponentProps<"div">;

/** Free slot for consumer toolbar buttons; pure layout shell. */
function EventCalendarToolbar({ className, ...props }: EventCalendarToolbarProps) {
  const viewConfig = useEventCalendarViewConfig();
  const defaultProps = {
    "data-slot": "event-calendar-toolbar",
    className: cn("flex items-center gap-2", viewConfig.classNames?.toolbar, className),
    children: props.children,
  };
  return <div {...mergeProps<React.ComponentProps<"div">>(defaultProps, props)} />;
}

interface EventCalendarNavProps extends React.ComponentProps<"div"> {
  /**
   * Render the view switcher in the composed layout. Turn off when the
   * calendar ships with a fixed view (e.g. a month-only embed) and users
   * should not be able to change it.
   * @default true
   */
  showViewSwitcher?: boolean;
}

/**
 * Default composed nav: Today, prev/next, title, spacer, view switcher.
 * Pass children to use it as a pure layout shell instead.
 */
function EventCalendarNav({
  className,
  children,
  showViewSwitcher = true,
  ...props
}: EventCalendarNavProps) {
  const viewConfig = useEventCalendarViewConfig();
  const defaultProps = {
    "data-slot": "event-calendar-nav",
    className: cn(
      "flex min-w-0 flex-wrap items-center gap-1 px-2 py-2",
      viewConfig.stickyNav && "bg-background sticky top-0 z-30",
      viewConfig.classNames?.nav,
      className,
    ),
    children: children ?? (
      // react-aria warms tooltips up globally: after the first one, moving
      // between buttons shows the next instantly.
      <>
        <EventCalendarNavToday />
        {showViewSwitcher && <EventCalendarViewSwitcher />}
        <div className="flex items-center">
          <EventCalendarNavPrev />
          <EventCalendarNavNext />
        </div>
        {/* ms-3 sets the title apart from the tight control cluster so the
            period reads as its own group, not another button */}
        <EventCalendarTitle className="ms-3" />
        <div className="grow" />
      </>
    ),
  };
  return <div {...mergeProps<React.ComponentProps<"div">>(defaultProps, props)} />;
}

export type {
  EventCalendarNavProps,
  EventCalendarTitleProps,
  EventCalendarToolbarProps,
  EventCalendarViewSwitcherProps,
};
export {
  EventCalendarDatePicker,
  EventCalendarNav,
  EventCalendarNavNext,
  EventCalendarNavPrev,
  EventCalendarNavToday,
  EventCalendarTitle,
  EventCalendarToolbar,
  EventCalendarViewSwitcher,
};
