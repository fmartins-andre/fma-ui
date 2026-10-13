"use client";

import { cn } from "cn";
import { GripVerticalIcon } from "lucide-react";
import * as React from "react";
import {
  Button as AriaButton,
  type DragAndDropOptions,
  DropIndicator,
  GridList,
  GridListItem,
  type GridListItemProps,
  type GridListProps,
  type Key,
  useDragAndDrop,
} from "react-aria-components";

type SortableLayout = "vertical" | "horizontal" | "grid";

/** Where a reorder put the moved items: before or after `key`. */
interface SortableMoveDetails {
  keys: Set<Key>;
  target: { key: Key; dropPosition: "before" | "after" };
}

interface SortableProps<T extends object>
  extends Omit<
    GridListProps<T>,
    | "items"
    | "children"
    | "layout"
    | "orientation"
    | "dragAndDropHooks"
    | "onChange"
    | "defaultValue"
  > {
  /** Items in their current order (controlled). */
  value?: T[];
  /** Initial order (uncontrolled). Needs `children` as a render function. */
  defaultValue?: T[];
  /** Called with the reordered items after a drop. */
  onChange?: (value: T[], details: SortableMoveDetails) => void;
  /** The item's key; must match the `id` of its `SortableItem`. Defaults to `item.id`. */
  getKey?: (item: T) => Key;
  /** `vertical` list, `horizontal` row, or wrapping `grid`. */
  layout?: SortableLayout;
  /** One `SortableItem` per item, or a function rendering one from an item. */
  children: React.ReactNode | ((item: T) => React.ReactNode);
  /** Custom drag preview; receives the keys being dragged. Defaults to the browser's snapshot. */
  renderDragPreview?: (keys: Key[]) => React.ReactElement;
  onDragStart?: DragAndDropOptions<T>["onDragStart"];
  onDragEnd?: DragAndDropOptions<T>["onDragEnd"];
}

const defaultGetKey = (item: object) => (item as { id: Key }).id;

/** Moves `keys` (kept in their current order) before or after `target.key`. */
function moveItems<T extends object>(
  items: T[],
  getKey: (item: T) => Key,
  { keys, target }: SortableMoveDetails,
): T[] {
  const moved = items.filter((item) => keys.has(getKey(item)));
  const rest = items.filter((item) => !keys.has(getKey(item)));
  let at = rest.findIndex((item) => getKey(item) === target.key);
  if (at === -1) return items;
  if (target.dropPosition === "after") at += 1;
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}

/**
 * A reorderable list, row or grid: drag items with the pointer, or with the
 * keyboard from a `SortableItemHandle` (Enter, arrows, Enter).
 */
function Sortable<T extends object>({
  value: valueProp,
  defaultValue,
  onChange,
  getKey = defaultGetKey,
  layout = "vertical",
  children,
  renderDragPreview,
  onDragStart,
  onDragEnd,
  className,
  ...props
}: SortableProps<T>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? []);
  const value = valueProp ?? uncontrolled;

  const { dragAndDropHooks } = useDragAndDrop<T>({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
    onReorder: (event) => {
      if (event.target.dropPosition === "on") return;
      const details: SortableMoveDetails = {
        keys: event.keys,
        target: { key: event.target.key, dropPosition: event.target.dropPosition },
      };
      const next = moveItems(value, getKey, details);
      if (valueProp === undefined) setUncontrolled(next);
      onChange?.(next, details);
    },
    renderDragPreview: renderDragPreview
      ? (items) => renderDragPreview(items.map((item) => item["text/plain"] ?? ""))
      : undefined,
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        data-slot="sortable-drop-indicator"
        className={cn(
          // Takes no room: the negative margins cancel the extra gap it adds.
          "relative outline-none",
          layout === "vertical"
            ? "-my-[calc(var(--sortable-gap)/2)] h-0 before:inset-x-0 before:-top-px before:h-0.5"
            : "-mx-[calc(var(--sortable-gap)/2)] w-0 before:inset-y-0 before:-left-px before:w-0.5",
          "before:absolute before:rounded-full data-drop-target:before:bg-primary",
        )}
      />
    ),
    onDragStart,
    onDragEnd,
  });

  return (
    <GridList<T>
      data-slot="sortable"
      data-layout={layout}
      layout={layout === "grid" ? "grid" : "stack"}
      orientation={layout === "vertical" ? "vertical" : "horizontal"}
      // Arrows walk the items in a row or grid, so Tab reaches the handle there.
      keyboardNavigationBehavior={layout === "vertical" ? "arrow" : "tab"}
      items={typeof children === "function" ? value : undefined}
      dragAndDropHooks={dragAndDropHooks}
      className={cn(
        "flex gap-(--sortable-gap) outline-none [--sortable-gap:--spacing(2)]",
        layout === "vertical" && "flex-col",
        layout === "grid" && "flex-wrap",
        className as string,
      )}
      {...props}
    >
      {typeof children === "function" ? (item: T) => children(item) : (children as React.ReactNode)}
    </GridList>
  );
}

interface SortableItemProps extends Omit<GridListItemProps, "id" | "children"> {
  /** Must match the key `getKey` returns for this item. */
  id: Key;
  children?: React.ReactNode;
}

/** A sortable item. Dragged items get `data-dragging`; `isDisabled` pins one in place. */
function SortableItem({ className, children, ...props }: SortableItemProps) {
  return (
    <GridListItem
      data-slot="sortable-item"
      className={cn(
        "relative flex cursor-grab items-center gap-2 rounded-md outline-none transition-opacity data-dragging:cursor-grabbing data-dragging:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-ring/50 data-disabled:cursor-default data-disabled:opacity-50",
        className as string,
      )}
      {...props}
    >
      {children}
    </GridListItem>
  );
}

/**
 * The item's grip, and its keyboard / screen-reader drag button: focus it,
 * Enter starts the drag, arrows pick the drop position, Enter drops.
 */
function SortableItemHandle({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof AriaButton>, "slot">) {
  return (
    <AriaButton
      slot="drag"
      data-slot="sortable-item-handle"
      className={cn(
        "flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none data-disabled:cursor-default data-focus-visible:ring-2 data-focus-visible:ring-ring/50 data-hovered:bg-accent data-hovered:text-accent-foreground",
        className as string,
      )}
      {...props}
    >
      {children ?? <GripVerticalIcon aria-hidden="true" className="size-4" />}
    </AriaButton>
  );
}

export type { SortableItemProps, SortableLayout, SortableMoveDetails, SortableProps };
export { Sortable, SortableItem, SortableItemHandle };
