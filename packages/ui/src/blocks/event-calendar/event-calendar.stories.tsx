import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings2Icon } from "lucide-react";
import * as React from "react";
import { DialogTrigger, I18nProvider } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Popover } from "@/core/popover/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { Switch } from "@/core/switch/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { EventCalendar } from "./event-calendar";
import { EventCalendarContent } from "./event-calendar-content";
import type { EventCalendarI18nOverrides } from "./event-calendar-i18n";
import { EventCalendarNav, EventCalendarToolbar } from "./event-calendar-nav";
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarInteractions,
  EventCalendarResource,
  EventCalendarViewSettings,
} from "./event-calendar-types";
import meta from "./meta.json";

// A fixed week (Sun 8 - Sat 14 March 2026, UTC) keeps the stories deterministic.
const at = (day: number, hour = 0, minute = 0) => new Date(Date.UTC(2026, 2, day, hour, minute));
const TODAY = at(11, 12);

const TEAM: EventCalendarResource[] = [
  { id: "alex", title: "Alex", color: "var(--color-blue-500)" },
  { id: "mia", title: "Mia", color: "var(--color-violet-500)" },
  { id: "sam", title: "Sam", color: "var(--color-emerald-500)" },
];

const EVENTS: CalendarEvent[] = [
  { id: "sync", title: "Team sync", start: at(9, 9), end: at(9, 9, 30), resourceId: "alex" },
  {
    id: "review",
    title: "Design review",
    start: at(10, 11),
    end: at(10, 12),
    resourceId: "mia",
    color: "var(--color-violet-500)",
  },
  {
    id: "demo",
    title: "Product demo",
    start: at(11, 15),
    end: at(11, 16),
    resourceId: "sam",
    color: "var(--color-emerald-500)",
  },
  {
    id: "offsite",
    title: "Team offsite",
    start: at(12),
    end: at(14),
    allDay: true,
    color: "var(--color-rose-500)",
  },
  {
    id: "standup",
    title: "Standup",
    start: at(9, 8, 30),
    end: at(9, 8, 45),
    recurrence: "RRULE:FREQ=DAILY;COUNT=5",
    resourceId: "alex",
  },
];

// Six events on one day, to overflow a month cell into "+N more".
const BUSY_DAY: CalendarEvent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `busy-${i}`,
  title: `Busy ${i + 1}`,
  start: at(18, 9 + i),
  end: at(18, 9 + i, 45),
}));

type DemoProps = {
  events?: CalendarEvent[];
  view?: CalendarView;
  onEventClick?: () => void;
  onEventUpdate?: () => void;
  onSelectSlot?: () => void;
};

function Demo({ events = EVENTS, view = "week", ...callbacks }: DemoProps) {
  return (
    <div className="flex h-[640px] w-[960px] flex-col rounded-lg border">
      <EventCalendar
        defaultEvents={events}
        defaultView={view}
        defaultDate={TODAY}
        timeZone="UTC"
        locale="en-US"
        resources={TEAM}
        dayStartHour={7}
        className="flex min-h-0 flex-1 flex-col"
        {...callbacks}
      >
        <EventCalendarNav />
        <EventCalendarContent />
      </EventCalendar>
    </div>
  );
}

const componentMeta = {
  title: "blocks/EventCalendar",
  component: Demo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { onEventClick: fn(), onEventUpdate: fn(), onSelectSlot: fn() },
} satisfies Meta<typeof Demo>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);
const slot = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot=${name}]`);

export const Week: Story = {
  play: async ({ canvasElement, canvas }) => {
    const title = () => slot(canvasElement, "event-calendar-title")?.textContent;
    await expect(title()).toMatch(/Mar/);
    await expect(canvas.getByRole("button", { name: /Team sync/ })).toBeInTheDocument();
    // The recurring standup appears once per day.
    await expect(canvas.getAllByRole("button", { name: /Standup/ }).length).toBeGreaterThanOrEqual(
      5,
    );

    const before = title();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(title()).not.toBe(before));
    await expect(canvas.queryByRole("button", { name: /Team sync/ })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Previous" }));
    await waitFor(() => expect(title()).toBe(before));
  },
};

/** The view switcher is a react-aria menu; the current view is checked. */
export const SwitchViews: Story = {
  play: async ({ canvasElement, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Select view/ }));
    let menu = await body().findByRole("menu");
    await expect(within(menu).getByRole("menuitemradio", { name: /Week/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Month/ }));
    await waitFor(() =>
      expect(slot(canvasElement, "event-calendar-content")).toHaveAttribute("data-view", "month"),
    );

    await userEvent.click(canvas.getByRole("button", { name: /Select view/ }));
    menu = await body().findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Agenda/ }));
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: /Product demo/ })).toBeInTheDocument(),
    );
  },
};

/** Pressing a chip reports it and selects it (a toggle button). */
export const SelectEvent: Story = {
  play: async ({ canvas, args }) => {
    const chip = canvas.getByRole("button", { name: /Design review/ });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    await expect(args.onEventClick).toHaveBeenCalled();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
  },
};

/** A crowded month day collapses into "+N more", which opens the day's list. */
export const MonthOverflow: Story = {
  args: { view: "month", events: [...EVENTS, ...BUSY_DAY] },
  play: async ({ canvas }) => {
    const more = await canvas.findByRole("button", { name: /more/ });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);
    const dialog = await body().findByRole("dialog");
    await expect(dialog).toHaveAccessibleName(/March 18/);
    await expect(within(dialog).getAllByRole("button", { name: /Busy/ }).length).toBeGreaterThan(0);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
  },
};

/** The resource view lays out one column per team member. */
export const Resources: Story = {
  args: { view: "resource" },
  play: async ({ canvas }) => {
    for (const member of ["Alex", "Mia", "Sam"]) {
      await expect(canvas.getAllByText(member).length).toBeGreaterThan(0);
    }
    await expect(canvas.getByRole("button", { name: /Product demo/ })).toBeInTheDocument();
  },
};

/** With no events in range, the agenda shows its empty state. */
export const EmptyAgenda: Story = {
  args: { view: "agenda", events: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[data-slot=icon-stack]")).not.toBeNull();
  },
};

/** Dragging a chip proposes an update; `onEventUpdate` accepts or rejects it. */
export const DragToMove: Story = {
  play: async ({ canvas, args }) => {
    const chip = canvas.getByRole("button", { name: /Design review/ });
    const box = chip.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + 4;
    const pointer = (type: string, target: EventTarget, dx: number, dy: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX: x + dx,
          clientY: y + dy,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          isPrimary: true,
        }),
      );
    // One day to the right (a column), one hour down.
    const column = box.width + 2;
    pointer("pointerdown", chip, 0, 0);
    for (let step = 1; step <= 5; step++)
      pointer("pointermove", window, (column * step) / 5, (48 * step) / 5);
    pointer("pointerup", window, column, 48);
    await waitFor(() => expect(args.onEventUpdate).toHaveBeenCalled());
    const [update] = (args.onEventUpdate as ReturnType<typeof fn>).mock.lastCall ?? [];
    await expect((update as { source: string }).source).toBe("drag");
    await expect((update as { start: Date }).start.getTime()).toBeGreaterThan(at(10, 11).getTime());
  },
};

function ControlledViewDemo() {
  const [view, setView] = React.useState<CalendarView>("day");
  return (
    <div className="flex h-[560px] w-[720px] flex-col gap-2">
      <output data-testid="view">{view}</output>
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
        <EventCalendar
          defaultEvents={EVENTS}
          view={view}
          onViewChange={setView}
          defaultDate={TODAY}
          timeZone="UTC"
          locale="en-US"
          className="flex min-h-0 flex-1 flex-col"
        >
          <EventCalendarNav />
          <EventCalendarContent />
        </EventCalendar>
      </div>
    </div>
  );
}

/** `view`/`onViewChange` make the view controlled. */
export const ControlledView: Story = {
  render: () => <ControlledViewDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("view")).toHaveTextContent("day");
    await userEvent.click(canvas.getByRole("button", { name: /Select view/ }));
    const menu = await body().findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: /Month/ }));
    await waitFor(() => expect(canvas.getByTestId("view")).toHaveTextContent("month"));
  },
};

function ShortcutsDemo() {
  return (
    <div className="flex h-[560px] w-[720px] flex-col gap-2">
      <input aria-label="Outside" className="rounded border px-2" />
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
        <EventCalendar
          defaultEvents={EVENTS}
          defaultView="week"
          defaultDate={TODAY}
          timeZone="UTC"
          locale="en-US"
          className="flex min-h-0 flex-1 flex-col"
        >
          <input aria-label="Inside" className="rounded border px-2" />
          <EventCalendarNav />
          <EventCalendarContent />
        </EventCalendar>
      </div>
    </div>
  );
}

/**
 * The keys hinted in the view switcher switch views while focus is inside the
 * calendar (`shortcutsScope="focus-within"`), but not while typing in a field.
 */
export const KeyboardShortcuts: Story = {
  render: () => <ShortcutsDemo />,
  play: async ({ canvasElement, canvas }) => {
    const view = () => slot(canvasElement, "event-calendar-content")?.getAttribute("data-view");
    await expect(view()).toBe("week");

    await userEvent.click(canvas.getByRole("textbox", { name: "Outside" }));
    await userEvent.keyboard("m");
    await userEvent.click(canvas.getByRole("textbox", { name: "Inside" }));
    await userEvent.keyboard("m");
    await expect(view()).toBe("week");

    // The switcher stays mounted across views, so focus stays in the calendar.
    const switcher = canvas.getByRole("button", { name: /Select view/ });
    switcher.focus();
    await userEvent.keyboard("{Control>}m{/Control}");
    await expect(view()).toBe("week");
    await userEvent.keyboard("m");
    await waitFor(() => expect(view()).toBe("month"));
    await userEvent.keyboard("D");
    await waitFor(() => expect(view()).toBe("day"));
    await userEvent.keyboard("5");
    await waitFor(() => expect(view()).toBe("days"));
    await expect(switcher).toHaveTextContent(/5/);
  },
};

const onSlotClick = fn();

/**
 * Drag-to-create needs a pointer; with `showDayAddButton` every day (month
 * cells, time-grid day headers) gets a labelled "+" button that fires
 * `onSlotClick` for that day, reachable with Tab.
 */
export const KeyboardCreate: Story = {
  render: () => (
    <div className="flex h-[560px] w-[860px] flex-col rounded-lg border">
      <EventCalendar
        defaultEvents={EVENTS}
        defaultView="week"
        defaultDate={TODAY}
        timeZone="UTC"
        locale="en-US"
        showDayAddButton
        onSlotClick={onSlotClick}
        className="flex min-h-0 flex-1 flex-col"
      >
        <EventCalendarNav />
        <EventCalendarContent />
      </EventCalendar>
    </div>
  ),
  play: async ({ canvas }) => {
    onSlotClick.mockClear();
    const add = canvas.getByRole("button", { name: /^Add event on .*March 11/ });
    add.focus();
    await userEvent.keyboard("{Enter}");
    await expect(onSlotClick).toHaveBeenCalledTimes(1);
    const [slot] = onSlotClick.mock.lastCall ?? [];
    await expect(slot).toMatchObject({ allDay: true, view: "week" });
    await expect((slot as { date: Date }).date.getTime()).toBe(at(11).getTime());

    // The month view has one per cell too.
    await userEvent.keyboard("m");
    const monthAdd = await canvas.findByRole("button", { name: /^Add event on .*March 18/ });
    monthAdd.focus();
    await userEvent.keyboard(" ");
    await expect(onSlotClick).toHaveBeenCalledTimes(2);
    await expect(onSlotClick.mock.lastCall?.[0]).toMatchObject({ view: "month" });
  },
};

/** Presses at `from`, moves by (dx, dy) in steps and releases, as a mouse would. */
function pointerDrag(target: Element, from: { x: number; y: number }, dx: number, dy: number) {
  const fire = (type: string, on: EventTarget, step: number) =>
    on.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: from.x + dx * step,
        clientY: from.y + dy * step,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        isPrimary: true,
      }),
    );
  fire("pointerdown", target, 0);
  for (let step = 1; step <= 5; step++) fire("pointermove", window, step / 5);
  fire("pointerup", window, 1);
}

const centre = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

type Update = {
  source: string;
  start: Date;
  end: Date;
  resourceId?: string;
  occurrence: { isRecurring: boolean; start: Date };
};
const lastUpdate = (mock: unknown) =>
  ((mock as ReturnType<typeof fn>).mock.lastCall?.[0] ?? {}) as Update;

/** Dragging a timed chip's bottom edge proposes a longer event (`source: "resize-end"`). */
export const ResizeEvent: Story = {
  play: async ({ canvas, args }) => {
    const chip = canvas.getByRole("button", { name: /Design review/ });
    const handle = chip.querySelector("[data-slot=event-calendar-resize-handle][data-edge=end]");
    if (!handle) throw new Error("no end resize handle");
    pointerDrag(handle, centre(handle), 0, 48);
    await waitFor(() => expect(args.onEventUpdate).toHaveBeenCalled());
    const update = lastUpdate(args.onEventUpdate);
    await expect(update.source).toBe("resize-end");
    await expect(update.start.getTime()).toBe(at(10, 11).getTime());
    await expect(update.end.getTime()).toBeGreaterThan(at(10, 12).getTime());
  },
};

/** In the resource view, dragging a chip into another member's column reassigns it. */
export const DragBetweenResources: Story = {
  args: { view: "resource" },
  play: async ({ canvas, args }) => {
    const chip = canvas.getByRole("button", { name: /Product demo/ });
    // Column headers carry the members' names; move from Sam's to Mia's column.
    const [mia] = canvas.getAllByText("Mia");
    const [sam] = canvas.getAllByText("Sam");
    if (!mia || !sam) throw new Error("resource headers not rendered");
    const from = { x: centre(chip).x, y: chip.getBoundingClientRect().top + 4 };
    pointerDrag(chip, from, centre(mia).x - centre(sam).x, 0);
    await waitFor(() => expect(args.onEventUpdate).toHaveBeenCalled());
    const update = lastUpdate(args.onEventUpdate);
    await expect(update.source).toBe("drag");
    await expect(update.resourceId).toBe("mia");
    await expect(update.start.getTime()).toBe(at(11, 15).getTime());
  },
};

function SingleOccurrenceDemo() {
  const [events, setEvents] = React.useState<CalendarEvent[]>(EVENTS);
  return (
    <div className="flex h-[640px] w-[960px] flex-col rounded-lg border">
      <EventCalendar
        events={events}
        onEventsChange={setEvents}
        // "This occurrence only": add an override of that occurrence
        // (RECURRENCE-ID semantics) and keep the series as it is.
        onEventUpdate={({ event, occurrence, start, end, allDay }) => {
          if (!occurrence?.isRecurring) return;
          setEvents((current) => [
            ...current,
            {
              ...event,
              id: `${event.id}-${occurrence.start.getTime()}`,
              recurrence: undefined,
              recurringEventId: event.id,
              originalStart: occurrence.start,
              start,
              end,
              allDay,
            },
          ]);
          return false;
        }}
        defaultView="week"
        defaultDate={TODAY}
        timeZone="UTC"
        locale="en-US"
        dayStartHour={7}
        className="flex min-h-0 flex-1 flex-col"
      >
        <EventCalendarNav />
        <EventCalendarContent />
      </EventCalendar>
    </div>
  );
}

/**
 * Moving one occurrence of a recurring event reports that occurrence; the
 * consumer decides the scope. Here: "this occurrence only".
 */
export const EditSingleOccurrence: Story = {
  render: () => <SingleOccurrenceDemo />,
  play: async ({ canvas }) => {
    const standups = () =>
      canvas
        .getAllByRole("button", { name: /Standup/ })
        .map((chip) => chip.closest("[data-ec-day]")?.getAttribute("data-ec-day"));
    const before = standups();
    await expect(before).toHaveLength(5);

    // The Wednesday (11th) occurrence: one hour later.
    const wednesday = String(at(11).getTime());
    const chip = canvas
      .getAllByRole("button", { name: /Standup/ })
      .find((el) => el.closest("[data-ec-day]")?.getAttribute("data-ec-day") === wednesday);
    if (!chip) throw new Error("no Wednesday standup");
    pointerDrag(chip, { x: centre(chip).x, y: chip.getBoundingClientRect().top + 4 }, 0, 48);

    // Still five standups: Wednesday's is now a one-off an hour later.
    const onWednesday = () =>
      canvas
        .getAllByRole("button", { name: /Standup/ })
        .find((el) => el.closest("[data-ec-day]")?.getAttribute("data-ec-day") === wednesday);
    await waitFor(() => expect(onWednesday()).not.toHaveAttribute("data-recurring"));
    await expect(standups()).toHaveLength(5);
    await expect(onWednesday()).not.toHaveAccessibleName(/8:30/);
    await expect(
      canvas
        .getAllByRole("button", { name: /Standup/ })
        .filter((el) => el.hasAttribute("data-recurring")),
    ).toHaveLength(4);
  },
};

/** `timeZone` sets the wall clock: 09:00 UTC is 06:00 in São Paulo (UTC-3). */
export const TimeZones: Story = {
  render: () => (
    <div className="flex h-[640px] w-[960px] flex-col rounded-lg border">
      <EventCalendar
        defaultEvents={EVENTS}
        defaultView="day"
        defaultDate={at(9, 12)}
        timeZone="America/Sao_Paulo"
        locale="en-US"
        dayStartHour={5}
        className="flex min-h-0 flex-1 flex-col"
      >
        <EventCalendarNav />
        <EventCalendarContent />
      </EventCalendar>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Team sync/ })).toHaveAccessibleName(/6:00/);
    await expect(canvas.getByRole("button", { name: /Standup/ })).toHaveAccessibleName(/5:30/);
  },
};

/**
 * Language presets: `id` is the BCP-47 `locale` (dates come from Intl), and
 * `i18n` overrides the static strings Intl can't reach. Arabic also flips the
 * calendar to right-to-left.
 */
const LOCALES: Array<{
  id: string;
  label: string;
  dir: "ltr" | "rtl";
  i18n?: EventCalendarI18nOverrides;
}> = [
  { id: "en-US", label: "English", dir: "ltr" },
  {
    id: "pt-BR",
    label: "Português",
    dir: "ltr",
    i18n: {
      labels: {
        today: "Hoje",
        allDay: "Dia inteiro",
        noEvents: "Sem eventos",
        more: (n) => `+${n} mais`,
      },
      viewNames: {
        month: "Mês",
        week: "Semana",
        day: "Dia",
        days: (n) => `${n} dias`,
        agenda: "Agenda",
        resource: "Equipe",
      },
    },
  },
  {
    id: "de",
    label: "Deutsch",
    dir: "ltr",
    i18n: {
      labels: {
        today: "Heute",
        allDay: "Ganztägig",
        noEvents: "Keine Termine",
        more: (n) => `+${n} weitere`,
      },
      viewNames: {
        month: "Monat",
        week: "Woche",
        day: "Tag",
        days: (n) => `${n} Tage`,
        agenda: "Agenda",
        resource: "Team",
      },
    },
  },
  {
    id: "ja",
    label: "日本語",
    dir: "ltr",
    i18n: {
      labels: { today: "今日", allDay: "終日", noEvents: "予定なし", more: (n) => `他${n}件` },
      viewNames: {
        month: "月",
        week: "週",
        day: "日",
        days: (n) => `${n}日間`,
        agenda: "予定",
        resource: "チーム",
      },
    },
  },
  {
    id: "ar",
    label: "العربية",
    dir: "rtl",
    i18n: {
      labels: {
        today: "اليوم",
        allDay: "طوال اليوم",
        noEvents: "لا توجد أحداث",
        more: (n) => `+${n} المزيد`,
      },
      viewNames: {
        month: "شهر",
        week: "أسبوع",
        day: "يوم",
        days: (n) => `${n} أيام`,
        agenda: "جدول الأعمال",
        resource: "الفريق",
      },
    },
  },
];

const TIME_ZONES = [
  { id: "UTC", label: "UTC" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "America/New_York", label: "New York" },
  { id: "Europe/London", label: "London" },
  { id: "Asia/Tokyo", label: "Tokyo" },
];

type Settings = {
  viewSettings: EventCalendarViewSettings;
  interactions: EventCalendarInteractions;
  weekStartsOn: 0 | 1;
  dayStartHour: number;
  dayEndHour: number;
  interval: number;
  snapDuration: number;
  eventTooltip: boolean;
  showDayAddButton: boolean;
  locale: string;
  timeZone: string;
};

const DEFAULT_SETTINGS: Settings = {
  viewSettings: { weekends: true, weekNumbers: false, nowIndicator: true, offDays: false },
  interactions: { drag: true, resize: true, selectSlot: true },
  weekStartsOn: 0,
  dayStartHour: 7,
  dayEndHour: 24,
  interval: 60,
  snapDuration: 15,
  eventTooltip: false,
  showDayAddButton: false,
  locale: "en-US",
  timeZone: "UTC",
};

function SettingSwitch({
  label,
  isSelected,
  onChange,
}: {
  label: string;
  isSelected: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <span id={id}>{label}</span>
      <Switch aria-labelledby={id} isSelected={isSelected} onChange={onChange} />
    </div>
  );
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: Array<{ id: string | number; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <Select
        aria-label={label}
        value={String(value)}
        onChange={(key) => key !== null && onChange(String(key))}
      >
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} id={String(option.id)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SettingsDemo() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [view, setView] = React.useState<CalendarView>("week");
  const patch = (partial: Partial<Settings>) => setSettings((old) => ({ ...old, ...partial }));
  const locale = LOCALES.find((entry) => entry.id === settings.locale) ?? LOCALES[0];
  const isTimeGrid = view !== "month" && view !== "agenda";
  const hours = (values: number[]) =>
    values.map((hour) => ({ id: hour, label: `${String(hour).padStart(2, "0")}:00` }));

  return (
    <I18nProvider locale={settings.locale}>
      <div dir={locale?.dir} className="flex h-[680px] w-[1000px] flex-col rounded-lg border">
        <EventCalendar
          defaultEvents={EVENTS}
          view={view}
          onViewChange={setView}
          defaultDate={TODAY}
          resources={TEAM}
          locale={settings.locale}
          i18n={locale?.i18n}
          timeZone={settings.timeZone}
          viewSettings={settings.viewSettings}
          onViewSettingsChange={(viewSettings) => patch({ viewSettings })}
          interactions={settings.interactions}
          onInteractionsChange={(interactions) => patch({ interactions })}
          weekStartsOn={settings.weekStartsOn}
          dayStartHour={settings.dayStartHour}
          dayEndHour={settings.dayEndHour}
          interval={settings.interval}
          snapDuration={settings.snapDuration}
          eventTooltip={settings.eventTooltip}
          showDayAddButton={settings.showDayAddButton}
          offDays
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-wrap items-center gap-2 pe-2">
            <EventCalendarNav className="min-w-0 flex-1" />
            <EventCalendarToolbar>
              <DialogTrigger>
                <Button variant="outline" size="sm">
                  <Settings2Icon aria-hidden="true" />
                  Settings
                </Button>
                <Popover placement="bottom end" className="w-80">
                  <Tabs aria-label="Settings">
                    <TabsList className="w-full">
                      <TabsTrigger id="view" className="flex-1">
                        View
                      </TabsTrigger>
                      {/* the hour track only exists in time-grid views */}
                      {isTimeGrid && (
                        <TabsTrigger id="time" className="flex-1">
                          Time grid
                        </TabsTrigger>
                      )}
                      <TabsTrigger id="behavior" className="flex-1">
                        Behavior
                      </TabsTrigger>
                      <TabsTrigger id="region" className="flex-1">
                        Region
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent id="view" className="flex flex-col gap-3">
                      {(
                        [
                          ["weekends", "Weekends", true],
                          ["weekNumbers", "Week numbers", false],
                          ["nowIndicator", "Now indicator", true],
                          ["offDays", "Mark off days", false],
                        ] as const
                      ).map(([key, label, fallback]) => (
                        <SettingSwitch
                          key={key}
                          label={label}
                          isSelected={settings.viewSettings[key] ?? fallback}
                          onChange={(value) =>
                            patch({ viewSettings: { ...settings.viewSettings, [key]: value } })
                          }
                        />
                      ))}
                      <SettingSwitch
                        label="Day add button"
                        isSelected={settings.showDayAddButton}
                        onChange={(showDayAddButton) => patch({ showDayAddButton })}
                      />
                      <SettingSelect
                        label="Week starts"
                        value={settings.weekStartsOn}
                        options={[
                          { id: 0, label: "Sunday" },
                          { id: 1, label: "Monday" },
                        ]}
                        onChange={(value) => patch({ weekStartsOn: Number(value) as 0 | 1 })}
                      />
                    </TabsContent>
                    <TabsContent id="time" className="flex flex-col gap-3">
                      <SettingSelect
                        label="Day starts"
                        value={settings.dayStartHour}
                        options={hours([0, 6, 7, 8])}
                        onChange={(value) => patch({ dayStartHour: Number(value) })}
                      />
                      <SettingSelect
                        label="Day ends"
                        value={settings.dayEndHour}
                        options={hours([18, 20, 24])}
                        onChange={(value) => patch({ dayEndHour: Number(value) })}
                      />
                      <SettingSelect
                        label="Grid interval"
                        value={settings.interval}
                        options={[
                          { id: 30, label: "30 min" },
                          { id: 60, label: "60 min" },
                        ]}
                        onChange={(value) => patch({ interval: Number(value) })}
                      />
                      <SettingSelect
                        label="Drag snap"
                        value={settings.snapDuration}
                        options={[
                          { id: 5, label: "5 min" },
                          { id: 15, label: "15 min" },
                          { id: 30, label: "30 min" },
                        ]}
                        onChange={(value) => patch({ snapDuration: Number(value) })}
                      />
                    </TabsContent>
                    <TabsContent id="behavior" className="flex flex-col gap-3">
                      {(
                        [
                          ["drag", "Drag to move"],
                          ["resize", "Drag to resize"],
                          ["selectSlot", "Drag to create"],
                        ] as const
                      ).map(([key, label]) => (
                        <SettingSwitch
                          key={key}
                          label={label}
                          isSelected={settings.interactions[key]}
                          onChange={(value) =>
                            patch({ interactions: { ...settings.interactions, [key]: value } })
                          }
                        />
                      ))}
                      <SettingSwitch
                        label="Event tooltips"
                        isSelected={settings.eventTooltip}
                        onChange={(eventTooltip) => patch({ eventTooltip })}
                      />
                    </TabsContent>
                    <TabsContent id="region" className="flex flex-col gap-3">
                      <SettingSelect
                        label="Language"
                        value={settings.locale}
                        options={LOCALES.map(({ id, label }) => ({ id, label }))}
                        onChange={(value) => patch({ locale: value })}
                      />
                      <SettingSelect
                        label="Time zone"
                        value={settings.timeZone}
                        options={TIME_ZONES}
                        onChange={(value) => patch({ timeZone: value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Language changes the locale and every label; Arabic also flips the calendar
                        to right-to-left. Time zone shifts every event&apos;s clock time.
                      </p>
                    </TabsContent>
                  </Tabs>
                  <Button variant="outline" size="sm" onPress={() => setSettings(DEFAULT_SETTINGS)}>
                    Reset to defaults
                  </Button>
                </Popover>
              </DialogTrigger>
            </EventCalendarToolbar>
          </div>
          <EventCalendarContent />
        </EventCalendar>
      </div>
    </I18nProvider>
  );
}

/**
 * Every display option in one place: a settings popover drives view options,
 * time-grid internals, interactions, language (with RTL) and time zone.
 */
export const Settings: Story = {
  render: () => <SettingsDemo />,
  play: async ({ canvasElement, canvas }) => {
    const dayHeaders = () =>
      canvasElement.querySelectorAll("[data-slot=event-calendar-day-header]").length;
    await expect(dayHeaders()).toBe(7);

    await userEvent.click(canvas.getByRole("button", { name: /Settings/ }));
    let dialog = await body().findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("switch", { name: "Weekends" }));
    await waitFor(() => expect(dayHeaders()).toBe(5));

    await userEvent.click(within(dialog).getByRole("tab", { name: "Region" }));
    await userEvent.click(within(dialog).getByRole("button", { name: /Language/ }));
    await userEvent.click(await body().findByRole("option", { name: "العربية" }));
    await waitFor(() =>
      expect(canvasElement.querySelector("[dir=rtl] [data-slot=event-calendar]")).not.toBeNull(),
    );
    // Escape on the select's trigger is the select's; close from the tab.
    within(dialog).getByRole("tab", { name: "Region" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "اليوم" })).toBeInTheDocument();

    // Reset brings English and weekends back.
    await userEvent.click(canvas.getByRole("button", { name: /Settings/ }));
    dialog = await body().findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Reset to defaults" }));
    await waitFor(() => expect(dayHeaders()).toBe(7));
    await expect(canvas.getByRole("button", { name: "Today" })).toBeInTheDocument();
  },
};
