"use client";

import { cn } from "cn";
import { FilterIcon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import {
  Form,
  SearchField,
  Tag,
  TagGroup,
  TagList,
  type ToggleButtonGroupProps,
} from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Input } from "@/core/input/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/core/input-group/input-group";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/sheet/sheet";
import { ToggleGroup } from "@/core/toggle-group/toggle-group";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";

type FilterToolbarLabels = {
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  quickFilters: string;
  filters: string;
  /** The filters button's accessible name, with the active count. */
  filtersTrigger: (active: number) => string;
  filtersTitle: string;
  apply: string;
  clear: string;
  activeFilters: string;
  clearAll: string;
  refresh: string;
};

type FilterToolbarI18n = { labels?: Partial<FilterToolbarLabels> };

const defaultFilterToolbarLabels: FilterToolbarLabels = {
  search: "Search",
  searchPlaceholder: "Search…",
  clearSearch: "Clear search",
  quickFilters: "Quick filters",
  filters: "Filters",
  filtersTrigger: (active) => (active > 0 ? `Filters, ${active} active` : "Filters"),
  filtersTitle: "Filter results",
  apply: "Apply",
  clear: "Clear",
  activeFilters: "Active filters",
  clearAll: "Clear filters",
  refresh: "Refresh",
};

const FilterToolbarContext = React.createContext<FilterToolbarLabels>(defaultFilterToolbarLabels);

const useFilterToolbarLabels = () => React.useContext(FilterToolbarContext);

/**
 * Lays out the list controls: search, quick filters and actions on one row
 * (wrapping on narrow screens), active filter chips on a row of their own.
 * Its `i18n` reaches every part inside.
 */
function FilterToolbar({
  i18n,
  className,
  ...props
}: React.ComponentProps<"div"> & { i18n?: FilterToolbarI18n }) {
  const overrides = i18n?.labels;
  const labels = React.useMemo(
    () => ({ ...defaultFilterToolbarLabels, ...overrides }),
    [overrides],
  );
  return (
    <FilterToolbarContext.Provider value={labels}>
      <div
        data-slot="filter-toolbar"
        className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
        {...props}
      />
    </FilterToolbarContext.Provider>
  );
}

/** Groups the trailing actions (filters, refresh, export…) at the end of the row. */
function FilterToolbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-toolbar-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

/**
 * The search box. `onChange` gets the committed term: on Enter, when cleared,
 * and — with `debounceMs` — after the user stops typing. Typing alone doesn't
 * fire a request per keystroke.
 */
function FilterSearch({
  value,
  onChange,
  debounceMs,
  placeholder,
  "aria-label": ariaLabel,
  isDisabled,
  maxLength,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  "aria-label"?: string;
  isDisabled?: boolean;
  maxLength?: number;
  className?: string;
}) {
  const labels = useFilterToolbarLabels();
  const [draft, setDraft] = React.useState(value);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastValue = React.useRef(value);

  // Follow outside changes (e.g. "Clear filters" or the back button).
  if (lastValue.current !== value) {
    lastValue.current = value;
    if (draft !== value) setDraft(value);
  }

  React.useEffect(() => () => clearTimeout(timer.current), []);

  function commit(next: string) {
    clearTimeout(timer.current);
    const trimmed = next.trim();
    if (trimmed !== value) onChange(trimmed);
  }

  function handleChange(next: string) {
    setDraft(next);
    if (debounceMs === undefined) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), debounceMs);
  }

  return (
    <SearchField
      data-slot="filter-search"
      aria-label={ariaLabel ?? labels.search}
      value={draft}
      onChange={handleChange}
      onSubmit={commit}
      onClear={() => commit("")}
      isDisabled={isDisabled}
      maxLength={maxLength}
      className={cn("min-w-48 flex-1 sm:max-w-sm", className)}
    >
      {({ isEmpty }) => (
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <Input
            data-slot="input-group-control"
            placeholder={placeholder ?? labels.searchPlaceholder}
            className="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent [&::-webkit-search-cancel-button]:hidden"
          />
          {!isEmpty && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label={labels.clearSearch}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      )}
    </SearchField>
  );
}

/**
 * Filters applied with one press: a `ToggleGroup` of `ToggleGroupItem`s
 * (single or multiple selection), outlined so the pressed state reads at a glance.
 */
function FilterQuickToggles({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof ToggleGroup> & Pick<ToggleButtonGroupProps, "aria-label">) {
  const labels = useFilterToolbarLabels();
  return (
    <ToggleGroup
      data-slot="filter-quick-toggles"
      variant="outline"
      aria-label={ariaLabel ?? labels.quickFilters}
      className={cn(
        "flex-wrap [&>[data-selected]]:border-ring/40 [&>[data-selected]]:bg-accent [&>[data-selected]]:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The "Filters" button and the side sheet with the less frequent filters.
 * Put `Field`s in `children`, controlled by a draft the app keeps: `onApply`
 * commits it (return `false` to keep the sheet open, e.g. on a validation
 * error), `onClear` empties the draft, and `onOpenChange(false)` is the
 * moment to throw an unapplied draft away. The fields are a form, so Enter
 * applies.
 */
function FilterSheet({
  activeCount = 0,
  onApply,
  onClear,
  isOpen: isOpenProp,
  onOpenChange,
  title,
  description,
  isDisabled,
  children,
  className,
}: {
  /** How many advanced filters are applied; shown on the button. */
  activeCount?: number;
  onApply: () => boolean | undefined | Promise<boolean | undefined>;
  onClear?: () => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  isDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const labels = useFilterToolbarLabels();
  const [isOpenState, setIsOpenState] = React.useState(false);
  const isOpen = isOpenProp ?? isOpenState;
  const [isApplying, setIsApplying] = React.useState(false);

  function setOpen(next: boolean) {
    setIsOpenState(next);
    onOpenChange?.(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsApplying(true);
    try {
      if ((await onApply()) !== false) setOpen(false);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <SheetTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button
        variant="outline"
        data-slot="filter-sheet-trigger"
        aria-label={labels.filtersTrigger(activeCount)}
        isDisabled={isDisabled}
      >
        <FilterIcon data-icon="inline-start" />
        {labels.filters}
        {activeCount > 0 && (
          <Badge size="sm" radius="full" aria-hidden="true">
            {activeCount}
          </Badge>
        )}
      </Button>
      <Sheet side="right" size="md" className={className}>
        <SheetHeader>
          <SheetTitle>{title ?? labels.filtersTitle}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <Form
          data-slot="filter-sheet-form"
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">{children}</div>
          <SheetFooter className="flex-row border-t *:flex-1">
            {onClear && (
              <Button type="button" variant="outline" onPress={onClear}>
                {labels.clear}
              </Button>
            )}
            <Button type="submit" isPending={isApplying}>
              {labels.apply}
            </Button>
          </SheetFooter>
        </Form>
      </Sheet>
    </SheetTrigger>
  );
}

type FilterChip = {
  id: string;
  /** What is filtered, e.g. "Status". */
  label: React.ReactNode;
  /** The applied value, already formatted, e.g. "Active". */
  value: React.ReactNode;
  /** Plain text for assistive tech when `label`/`value` aren't strings. */
  textValue?: string;
};

/**
 * The applied filters as chips, each removable with its × (or Backspace and
 * Delete from the keyboard), plus "Clear filters". Renders nothing when empty.
 */
function FilterChips({
  items,
  onRemove,
  onClearAll,
  className,
}: {
  items: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}) {
  const labels = useFilterToolbarLabels();
  if (items.length === 0) return null;
  return (
    <div
      data-slot="filter-chips"
      className={cn("flex w-full basis-full flex-wrap items-center gap-2", className)}
    >
      <TagGroup
        aria-label={labels.activeFilters}
        onRemove={(keys) => {
          for (const key of keys) onRemove(String(key));
        }}
      >
        <TagList items={items} className="flex flex-wrap items-center gap-1.5">
          {(item) => (
            <Tag
              id={item.id}
              textValue={
                item.textValue ??
                (typeof item.label === "string" && typeof item.value === "string"
                  ? `${item.label}: ${item.value}`
                  : undefined)
              }
              data-slot="filter-chip"
              className="flex h-7 items-center gap-1 rounded-md border bg-background pr-0.5 pl-2 text-xs outline-none data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <span className="text-muted-foreground">{item.label}:</span>
              <span className="font-medium">{item.value}</span>
              <Button
                slot="remove"
                variant="ghost"
                size="icon-xs"
                data-slot="filter-chip-remove"
                className="text-muted-foreground"
              >
                <XIcon />
              </Button>
            </Tag>
          )}
        </TagList>
      </TagGroup>
      {onClearAll && (
        <Button variant="ghost" size="sm" onPress={onClearAll}>
          {labels.clearAll}
        </Button>
      )}
    </div>
  );
}

/** Reloads the list; spins while `isPending`. */
function FilterRefresh({
  onRefresh,
  isPending = false,
  "aria-label": ariaLabel,
  className,
}: {
  onRefresh: () => void;
  isPending?: boolean;
  "aria-label"?: string;
  className?: string;
}) {
  const labels = useFilterToolbarLabels();
  const label = ariaLabel ?? labels.refresh;
  return (
    <TooltipTrigger>
      <Button
        variant="outline"
        size="icon"
        data-slot="filter-refresh"
        aria-label={label}
        isPending={isPending}
        onPress={onRefresh}
        className={className}
      >
        <RefreshCwIcon className={cn(isPending && "animate-spin")} />
      </Button>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

export type { FilterChip, FilterToolbarI18n, FilterToolbarLabels };
export {
  defaultFilterToolbarLabels,
  FilterChips,
  FilterQuickToggles,
  FilterRefresh,
  FilterSearch,
  FilterSheet,
  FilterToolbar,
  FilterToolbarActions,
};
