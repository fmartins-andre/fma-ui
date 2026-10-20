"use client";

import { cn } from "cn";
import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Button } from "@/core/button/button";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/core/description-list/description-list";
import { Empty, EmptyDescription } from "@/core/empty/empty";
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/core/field/field";

type CollectionFieldLabels = {
  /** The remove button's accessible name ("Remove lot 2"). */
  remove: (item: string) => string;
  /** The remove button's visible text in the `group` layout. */
  removeText: string;
  added: (item: string) => string;
  removed: (item: string) => string;
  /** Shown instead of the add button once `maxItems` is reached. */
  maxReached: (max: number) => string;
  /** Shown while the list is empty, unless `emptyMessage` is given. */
  empty: string;
};

type CollectionFieldI18n = { labels?: Partial<CollectionFieldLabels> };

const defaultCollectionFieldLabels: CollectionFieldLabels = {
  remove: (item) => `Remove ${item}`,
  removeText: "Remove",
  added: (item) => `${item} added`,
  removed: (item) => `${item} removed`,
  maxReached: (max) => `Up to ${max} items.`,
  empty: "Nothing added yet.",
};

type CollectionFieldContextValue = {
  labels: CollectionFieldLabels;
  canRemove: boolean;
  /** Called by an item's remove button, before the app's `onRemove`. */
  willRemove: (item: string) => void;
};

const CollectionFieldContext = React.createContext<CollectionFieldContextValue | null>(null);

function useCollectionField(part: string) {
  const context = React.useContext(CollectionFieldContext);
  if (!context) throw new Error(`${part} must be used within a CollectionField`);
  return context;
}

/** What gets focus in a new item: its first focusable field, not its remove button. */
function firstField(item: Element) {
  const candidates = item.querySelectorAll<HTMLElement>(
    "input, select, textarea, button, [tabindex]",
  );
  return [...candidates].find(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled, [type=hidden]") &&
      !element.closest("[aria-hidden=true], [data-slot=collection-field-remove]"),
  );
}

type CollectionFieldProps = Omit<React.ComponentProps<"fieldset">, "children"> & {
  /** Names the list (a legend). */
  label: React.ReactNode;
  description?: React.ReactNode;
  /** An error about the list as a whole ("The payments must add up to the total"). */
  error?: React.ReactNode;
  /** How many items there are (`fields.length` of a `useFieldArray`). */
  itemCount: number;
  /** Items can't be removed below this: their remove buttons go away. */
  minItems?: number;
  /** The add button gives way to `labels.maxReached` once there are this many. */
  maxItems?: number;
  /** Appends an item (the app's `append`). */
  onAdd: () => void;
  /** The add button's text: what is added ("Add lot"). */
  addLabel: React.ReactNode;
  emptyMessage?: React.ReactNode;
  /** After the add button: a `CollectionFieldSummary` for lists that add up to a value. */
  summary?: React.ReactNode;
  i18n?: CollectionFieldI18n;
  /** `CollectionFieldItem`s. */
  children?: React.ReactNode;
};

/**
 * A list edited in place inside a form: items are added and filled right
 * there. Rows, state and validation stay in the app (`useFieldArray`'s
 * `fields`, `append`, `remove`); this lays them out, adds and removes, and
 * says what happened: adding announces the new item and focuses its first
 * field, removing announces it and focuses the add button.
 */
function CollectionField({
  label,
  description,
  error,
  itemCount,
  minItems = 0,
  maxItems,
  onAdd,
  addLabel,
  emptyMessage,
  summary,
  i18n,
  className,
  children,
  ...props
}: CollectionFieldProps) {
  const labels = { ...defaultCollectionFieldLabels, ...i18n?.labels };
  const listRef = React.useRef<HTMLDivElement>(null);
  const addRef = React.useRef<HTMLButtonElement>(null);
  const pending = React.useRef<{ type: "add" } | { type: "remove"; item: string } | null>(null);
  const previousCount = React.useRef(itemCount);
  const [announcement, setAnnouncement] = React.useState("");
  const canAdd = maxItems === undefined || itemCount < maxItems;

  // Runs after every render: the item appears (or goes) once the app's array changes.
  React.useLayoutEffect(() => {
    const change = itemCount - previousCount.current;
    previousCount.current = itemCount;
    const action = pending.current;

    if (action?.type === "add" && change > 0) {
      pending.current = null;
      const items = listRef.current?.querySelectorAll("[data-slot=collection-field-item]");
      const item = items?.[items.length - 1];
      if (!item) return;
      setAnnouncement(labels.added(item.getAttribute("data-label") ?? ""));
      firstField(item)?.focus();
    } else if (action?.type === "remove" && change < 0) {
      pending.current = null;
      setAnnouncement(labels.removed(action.item));
      addRef.current?.focus();
    }
  });

  const context: CollectionFieldContextValue = {
    labels,
    canRemove: itemCount > minItems,
    willRemove: (item) => {
      pending.current = { type: "remove", item };
    },
  };

  return (
    <CollectionFieldContext.Provider value={context}>
      <FieldSet
        data-slot="collection-field"
        data-invalid={error ? true : undefined}
        className={cn("gap-3", className)}
        {...props}
      >
        <FieldLegend variant="label">{label}</FieldLegend>
        {description && <FieldDescription className="-mt-1.5">{description}</FieldDescription>}
        <span role="status" className="sr-only">
          {announcement}
        </span>
        {itemCount === 0 ? (
          <Empty className="gap-0 rounded-lg border border-dashed p-4 md:p-4">
            <EmptyDescription>{emptyMessage ?? labels.empty}</EmptyDescription>
          </Empty>
        ) : (
          <div ref={listRef} data-slot="collection-field-items" className="flex flex-col gap-3">
            {children}
          </div>
        )}
        {error && <FieldError>{error}</FieldError>}
        {canAdd ? (
          <Button
            ref={addRef}
            data-slot="collection-field-add"
            variant="outline"
            size="sm"
            className="self-start"
            onPress={() => {
              pending.current = { type: "add" };
              onAdd();
            }}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {addLabel}
          </Button>
        ) : (
          maxItems !== undefined && (
            <p data-slot="collection-field-max" className="text-sm text-muted-foreground">
              {labels.maxReached(maxItems)}
            </p>
          )
        )}
        {summary}
      </FieldSet>
    </CollectionFieldContext.Provider>
  );
}

type CollectionFieldItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Names the item, numbered ("Lot 2"): the group's name, the legend in `group`, and the remove button's. */
  label: string;
  /** Removes it (the app's `remove(index)`). */
  onRemove: () => void;
  /**
   * `row`: a few fields side by side on wide screens (method + amount), the
   * remove button at the end. `group`: many fields under a visible numbered
   * legend, with a static border so items stay apart when the fields stack.
   */
  layout?: "row" | "group";
  children: React.ReactNode;
};

/** One item of a `CollectionField`, with its fields as children. */
function CollectionFieldItem({
  label,
  onRemove,
  layout = "row",
  className,
  children,
  ...props
}: CollectionFieldItemProps) {
  const { labels, canRemove, willRemove } = useCollectionField("CollectionFieldItem");
  const remove = () => {
    willRemove(label);
    onRemove();
  };

  if (layout === "group") {
    return (
      <fieldset
        data-slot="collection-field-item"
        data-layout="group"
        data-label={label}
        className={cn("relative rounded-lg border p-4", className)}
        {...(props as React.ComponentProps<"fieldset">)}
      >
        {/* Floated so it sits inside the border, as a heading, not on it. */}
        <legend className="float-left mb-4 flex min-h-7 items-center pe-24 text-sm font-medium">
          {label}
        </legend>
        {canRemove && (
          <Button
            data-slot="collection-field-remove"
            variant="ghost"
            size="sm"
            aria-label={labels.remove(label)}
            className="absolute end-3 top-4"
            onPress={remove}
          >
            {labels.removeText}
          </Button>
        )}
        <div className="clear-both flex flex-col gap-4">{children}</div>
      </fieldset>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="collection-field-item"
      data-layout="row"
      data-label={label}
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", className)}
      {...props}
    >
      {children}
      {canRemove && (
        <Button
          data-slot="collection-field-remove"
          variant="ghost"
          size="icon"
          aria-label={labels.remove(label)}
          className="self-end"
          onPress={remove}
        >
          <Trash2Icon />
        </Button>
      )}
    </div>
  );
}

/**
 * Where a list that adds up to a value stands: the total, what is allocated
 * and what remains. The last item (`isEmphasized`) stands out by size and
 * weight; its value says the state in words ("R$ 20,00 left", "Settled").
 */
function CollectionFieldSummary({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <DescriptionList
      data-slot="collection-field-summary"
      className={cn("rounded-lg border p-3", className)}
      {...props}
    />
  );
}

function CollectionFieldSummaryItem({
  label,
  value,
  isEmphasized = false,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  isEmphasized?: boolean;
}) {
  return (
    <DescriptionItem
      data-slot="collection-field-summary-item"
      className={cn(isEmphasized && "border-t pt-2", className)}
      {...props}
    >
      <DescriptionTerm className={cn(isEmphasized && "font-medium text-foreground")}>
        {label}
      </DescriptionTerm>
      <DescriptionDetails className={cn("tabular-nums", isEmphasized && "text-base font-semibold")}>
        {value}
      </DescriptionDetails>
    </DescriptionItem>
  );
}

export type {
  CollectionFieldI18n,
  CollectionFieldItemProps,
  CollectionFieldLabels,
  CollectionFieldProps,
};
export { CollectionField, CollectionFieldItem, CollectionFieldSummary, CollectionFieldSummaryItem };
