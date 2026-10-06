"use client";

import {
  type CellData,
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  flexRender,
  type RowData,
  type RowSelectionState,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  type Column as TanstackColumn,
  type Row as TanstackRow,
  type Table as TanstackTable,
  tableFeatures,
} from "@tanstack/react-table";
import { cn } from "cn";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowLeftToLineIcon,
  ArrowRightIcon,
  ArrowRightToLineIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CirclePlusIcon,
  GripVerticalIcon,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import * as React from "react";
import {
  Button as AriaButton,
  Cell,
  Column,
  ColumnResizer,
  Dialog,
  DialogTrigger,
  type DragAndDropOptions,
  isTextDropItem,
  type Key,
  ListBox,
  ListBoxItem,
  ResizableTableContainer,
  Row,
  type Selection,
  type SortDescriptor,
  Table,
  TableBody,
  TableHeader,
  TableLayout,
  useDrag,
  useDragAndDrop,
  useDrop,
  useLocale,
  Virtualizer,
} from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Checkbox } from "@/core/checkbox/checkbox";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import { Input } from "@/core/input/input";
import { Popover } from "@/core/popover/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Spinner } from "@/core/spinner/spinner";

type DataGridColumnMeta = {
  /** Label for the header menu, visibility menu and filters. */
  headerTitle?: string;
  headerClassName?: string;
  cellClassName?: string;
  /** Placeholder shown in this column's cells while loading. */
  skeleton?: React.ReactNode;
  /** Takes the remaining width (a `1fr` column). */
  autoSize?: boolean;
};

/**
 * The TanStack Table features the grid relies on, with client-side sorting,
 * filtering, faceting and pagination. Create the table with
 * `useTable({ features: dataGridFeatures, ... })`; for server-side data set
 * `manualSorting`/`manualFiltering`/`manualPagination` and pass the page.
 * Column `meta` takes `headerTitle`, `skeleton`, `autoSize` and class names.
 */
const dataGridFeatures = tableFeatures({
  columnFilteringFeature,
  columnFacetingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
  columnMeta: {} as DataGridColumnMeta,
});

type DataGridFeatures = typeof dataGridFeatures;

type DataGridColumn<TData extends RowData, TValue extends CellData = CellData> = TanstackColumn<
  DataGridFeatures,
  TData,
  TValue
>;

/** Label for a column: `meta.headerTitle`, a string `columnDef.header`, or `column.id`. */
function getColumnHeaderLabel<TData extends RowData, TValue extends CellData>(
  column: DataGridColumn<TData, TValue>,
): string {
  const { meta, header } = column.columnDef;
  if (typeof meta?.headerTitle === "string") return meta.headerTitle;
  if (typeof header === "string") return header;
  return column.id;
}

type DataGridLayout = {
  /** Tighter cell padding. */
  dense?: boolean;
  cellBorder?: boolean;
  /** Borders between rows. Defaults to true. */
  rowBorder?: boolean;
  /** Alternating row background. */
  stripped?: boolean;
  headerBackground?: boolean;
  /** Keeps the header visible while the body scrolls (give the grid a height). */
  headerSticky?: boolean;
  /** "fixed" (default) sizes columns from `size`; "auto" lets the content decide. */
  width?: "auto" | "fixed";
  /** Lets users drag column edges to resize (fixed width only). */
  columnsResizable?: boolean;
  /** Adds pin to start/end to `DataGridColumnHeader` menus. */
  columnsPinnable?: boolean;
  /** Adds move left/right to `DataGridColumnHeader` menus. */
  columnsMovable?: boolean;
  /**
   * Lets users drag a header onto another to reorder columns (pointer only;
   * keyboard users move columns with `columnsMovable`).
   */
  columnsDraggable?: boolean;
  /** Adds a column visibility submenu to `DataGridColumnHeader` menus that ask for it. */
  columnsVisibility?: boolean;
};

type DataGridProps<TData extends RowData> = {
  /** A table created with `useTable({ features: dataGridFeatures, ... })`. */
  table: TanstackTable<DataGridFeatures, TData>;
  /** Total rows across pages (the server's total with manual pagination). */
  recordCount: number;
  isLoading?: boolean;
  /** "skeleton" (default) shows placeholder rows; "spinner" overlays the current rows. */
  loadingMode?: "skeleton" | "spinner";
  emptyMessage?: React.ReactNode;
  /** Makes rows actionable: pressing one (or Enter on it) calls this. */
  onRowClick?: (row: TData) => void;
  tableLayout?: DataGridLayout;
  className?: string;
  children?: React.ReactNode;
};

type DataGridContextValue = Omit<DataGridProps<RowData>, "table" | "children"> & {
  table: TanstackTable<DataGridFeatures, RowData>;
  layout: DataGridLayout;
};

const DataGridContext = React.createContext<DataGridContextValue | null>(null);

function useDataGrid<TData extends RowData = RowData>() {
  const context = React.useContext(DataGridContext);
  if (!context) throw new Error("useDataGrid must be used within a DataGrid");
  return context as Omit<DataGridContextValue, "table"> & {
    table: TanstackTable<DataGridFeatures, TData>;
  };
}

/** Provides the TanStack `table` to the grid parts (table, pagination, headers). */
function DataGrid<TData extends RowData>({
  table,
  tableLayout,
  className,
  children,
  ...props
}: DataGridProps<TData>) {
  // Rebuilt every render on purpose: the table instance is stable while its
  // state changes, and the parts must re-render with it.
  const value: DataGridContextValue = {
    // The context is untyped; useDataGrid<TData>() restores the row type.
    ...(props as Omit<DataGridProps<RowData>, "table" | "children">),
    table: table as TanstackTable<DataGridFeatures, RowData>,
    layout: { rowBorder: true, width: "fixed", ...tableLayout },
  };
  return (
    <DataGridContext.Provider value={value}>
      <div data-slot="data-grid" className={cn("flex w-full flex-col gap-2.5", className)}>
        {children}
      </div>
    </DataGridContext.Provider>
  );
}

/** Frames the table: border, rounded corners and clipping. */
function DataGridContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-grid-container"
      className={cn("w-full overflow-hidden rounded-lg border", className)}
      {...props}
    />
  );
}

// Logical insets, so pinned columns stick to the correct side in RTL too.
function pinningStyle<TData extends RowData>(
  column: DataGridColumn<TData>,
): React.CSSProperties | undefined {
  const pinned = column.getIsPinned();
  if (!pinned) return undefined;
  return {
    position: "sticky",
    zIndex: 1,
    ...(pinned === "start"
      ? { insetInlineStart: column.getStart("start") }
      : { insetInlineEnd: column.getAfter("end") }),
  };
}

type DataGridTableProps<TData extends RowData = RowData> = {
  "aria-label"?: string;
  className?: string;
  /**
   * Enables row reordering by drag and drop (rows need a `DataGridRowDragHandle`).
   * Receives react-aria's reorder event: the dragged keys (row ids) and the target.
   */
  onRowsReorder?: DragAndDropOptions["onReorder"];
  /** Renders only the visible rows. Give the table a fixed height through `className`. */
  isVirtualized?: boolean;
  /** Row height for virtualization, in pixels (an estimate when rows can expand). */
  rowHeight?: number;
  /**
   * Content of a full-width row shown under each expanded row. Expand rows
   * with `DataGridRowExpand` and make them expandable with `getRowCanExpand`.
   */
  renderExpandedRow?: (row: TanstackRow<DataGridFeatures, TData>) => React.ReactNode;
};

// Key suffix of the full-width row rendered under an expanded row.
const EXPANDED = ":expanded";

/**
 * Renders the grid with react-aria's `Table`: keyboard navigation between
 * cells, `aria-sort`, selection and resizing come from react-aria while
 * TanStack holds the data model.
 */
function DataGridTable<TData extends RowData = RowData>({
  "aria-label": ariaLabel = "Data grid",
  className,
  onRowsReorder,
  isVirtualized,
  rowHeight = 40,
  renderExpandedRow,
}: DataGridTableProps<TData>) {
  const {
    table,
    layout,
    isLoading,
    loadingMode = "skeleton",
    emptyMessage,
    onRowClick,
  } = useDataGrid();
  const state = table.store.state;
  const columns = [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ];
  // The first column holding data names each row (not a checkbox or handle).
  const rowHeaderId = (columns.find((column) => column.accessorFn) ?? columns[0])?.id;
  const headers = new Map(
    table.getFlatHeaders().map((header) => [header.column.id, header] as const),
  );
  const rows = [...table.getTopRows(), ...table.getCenterRows()];
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const showSkeleton = isLoading && loadingMode === "skeleton";
  const skeletonIds = Array.from(
    { length: state.pagination.pageSize || 5 },
    (_, index) => `skeleton-${index}`,
  );

  const { enableRowSelection } = table.options;
  const isSelectable = enableRowSelection === true || typeof enableRowSelection === "function";
  const sorting = state.sorting[0];
  const sortDescriptor: SortDescriptor | undefined = sorting && {
    column: sorting.id,
    direction: sorting.desc ? "descending" : "ascending",
  };

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys]
        .filter((key) => !String(key).endsWith(EXPANDED))
        .map((key) => ({ "text/plain": String(key) })),
    onReorder: onRowsReorder,
    isDisabled: !onRowsReorder,
  });

  const fixed = layout.width === "fixed";
  const overlapsRows = layout.headerSticky || isVirtualized;
  const cellPadding = layout.dense ? "px-2.5 py-1.5" : "px-4 py-2.5";

  const onSelectionChange = (keys: Selection) => {
    const pageIds = new Set(rows.map((row) => row.id));
    const selected =
      keys === "all" ? [...pageIds] : [...keys].map(String).filter((id) => pageIds.has(id));
    // Keep selections made on other pages.
    const next: RowSelectionState = {};
    for (const id of Object.keys(state.rowSelection)) {
      if (!pageIds.has(id)) next[id] = true;
    }
    for (const id of selected) next[id] = true;
    table.setRowSelection(next);
  };

  let content = (
    <Table
      aria-label={ariaLabel}
      data-slot="data-grid-table"
      sortDescriptor={sortDescriptor}
      onSortChange={(descriptor) =>
        table.setSorting([
          { id: String(descriptor.column), desc: descriptor.direction === "descending" },
        ])
      }
      selectionMode={isSelectable && !showSkeleton ? "multiple" : "none"}
      selectedKeys={Object.keys(state.rowSelection)}
      onSelectionChange={onSelectionChange}
      disabledKeys={[
        ...rows.filter((row) => isSelectable && !row.getCanSelect()).map((row) => row.id),
        ...rows.filter((row) => row.getIsExpanded()).map((row) => row.id + EXPANDED),
      ]}
      // Disabled rows (unselectable ones, expanded panels) stay focusable.
      disabledBehavior="selection"
      onRowAction={
        onRowClick && !showSkeleton
          ? (key) => {
              const row = rowsById.get(String(key));
              if (row) onRowClick(row.original);
            }
          : undefined
      }
      dragAndDropHooks={onRowsReorder ? dragAndDropHooks : undefined}
      className={cn(
        "w-full caption-bottom border-separate border-spacing-0 text-sm outline-none",
        fixed && "table-fixed",
      )}
    >
      <TableHeader className={cn(layout.headerSticky && "sticky top-0", overlapsRows && "z-10")}>
        {columns.map((column) => {
          const header = headers.get(column.id);
          const width = column.columnDef.meta?.autoSize ? "1fr" : column.getSize();
          return (
            <Column
              key={column.id}
              id={column.id}
              isRowHeader={column.id === rowHeaderId}
              allowsSorting={column.getCanSort() && !showSkeleton}
              width={fixed ? width : undefined}
              minWidth={fixed ? column.columnDef.minSize : undefined}
              style={pinningStyle(column)}
              className={cn(
                "group/column relative h-10 border-b text-left align-middle font-medium whitespace-nowrap text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                isVirtualized && "flex items-center",
                layout.dense ? "px-2.5" : "px-4",
                layout.cellBorder && "border-e last:border-e-0",
                // Opaque backgrounds on the cells: rows scroll under a sticky or virtualized
                // header, and the virtualized header row group paints no background.
                // Mixes the raw tokens: `--color-*` resolve at :root, so they'd stay
                // light under a `.dark` subtree.
                layout.headerBackground
                  ? "bg-[color-mix(in_oklab,var(--muted)_40%,var(--background))]"
                  : (overlapsRows || column.getIsPinned()) && "bg-background",
                column.columnDef.meta?.headerClassName,
              )}
            >
              <div className="flex items-center gap-1">
                {layout.columnsDraggable && !showSkeleton ? (
                  <ColumnDragArea column={column} dense={layout.dense}>
                    {header && !header.isPlaceholder
                      ? flexRender(column.columnDef.header, header.getContext())
                      : null}
                  </ColumnDragArea>
                ) : (
                  <div className="min-w-0 flex-1">
                    {header && !header.isPlaceholder
                      ? flexRender(column.columnDef.header, header.getContext())
                      : null}
                  </div>
                )}
                {layout.columnsResizable && fixed && column.getCanResize() && (
                  <ColumnResizer
                    aria-label={`Resize ${getColumnHeaderLabel(column)}`}
                    className="absolute inset-y-0 -end-px z-10 w-1.5 cursor-col-resize touch-none bg-transparent outline-none data-focus-visible:bg-ring data-hovered:bg-border data-resizing:bg-ring"
                  />
                )}
              </div>
            </Column>
          );
        })}
      </TableHeader>
      <TableBody
        renderEmptyState={() => (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {emptyMessage ?? "No data available."}
          </div>
        )}
      >
        {showSkeleton
          ? skeletonIds.map((id) => (
              <Row key={id} id={id} className={rowClassName(layout, isVirtualized)}>
                {columns.map((column) => (
                  <Cell
                    key={column.id}
                    className={cn(cellPadding, cellClassName(layout, isVirtualized))}
                  >
                    {column.columnDef.meta?.skeleton ?? <Skeleton className="h-4 w-full" />}
                  </Cell>
                ))}
              </Row>
            ))
          : rows.flatMap((row) => [
              <Row
                key={row.id}
                id={row.id}
                // Names the row in drag-and-drop and selection announcements.
                textValue={String((rowHeaderId && row.getValue(rowHeaderId)) ?? row.id)}
                data-pinned={row.getIsPinned() || undefined}
                className={cn(
                  rowClassName(layout, isVirtualized),
                  onRowClick && "cursor-pointer",
                  "data-pinned:bg-muted/40",
                )}
              >
                {[
                  ...row.getStartVisibleCells(),
                  ...row.getCenterVisibleCells(),
                  ...row.getEndVisibleCells(),
                ].map((cell) => (
                  <Cell
                    key={cell.id}
                    style={pinningStyle(cell.column)}
                    className={cn(
                      cellPadding,
                      cellClassName(layout, isVirtualized),
                      cell.column.getIsPinned() && "bg-background",
                      cell.column.columnDef.meta?.cellClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Cell>
                ))}
              </Row>,
              ...(renderExpandedRow && row.getIsExpanded()
                ? [
                    <Row
                      key={row.id + EXPANDED}
                      id={row.id + EXPANDED}
                      textValue={`${String((rowHeaderId && row.getValue(rowHeaderId)) ?? row.id)} details`}
                      data-slot="data-grid-expanded-row"
                      className={rowClassName({ ...layout, stripped: false }, isVirtualized)}
                    >
                      <Cell
                        colSpan={columns.length}
                        className={cn(
                          cellPadding,
                          cellClassName(layout, isVirtualized),
                          "bg-muted/20",
                        )}
                      >
                        {renderExpandedRow(row as TanstackRow<DataGridFeatures, TData>)}
                      </Cell>
                    </Row>,
                  ]
                : []),
            ])}
      </TableBody>
    </Table>
  );

  if (isVirtualized) {
    content = (
      <Virtualizer
        layout={TableLayout}
        layoutOptions={
          // Expanded panels are taller than rows: measure rows instead of fixing their height.
          renderExpandedRow
            ? { estimatedRowHeight: rowHeight, headingHeight: rowHeight }
            : { rowHeight, headingHeight: rowHeight }
        }
      >
        {content}
      </Virtualizer>
    );
  }

  return (
    <div
      data-slot="data-grid-table-container"
      aria-busy={isLoading || undefined}
      className="relative"
    >
      <ResizableTableContainer
        onResize={(widths) => {
          const sizing: Record<string, number> = {};
          for (const [id, width] of widths)
            if (typeof width === "number") sizing[String(id)] = width;
          table.setColumnSizing((old) => ({ ...old, ...sizing }));
        }}
        className={cn("relative w-full overflow-auto", className)}
      >
        {content}
      </ResizableTableContainer>
      {isLoading && loadingMode === "spinner" && (
        <div
          data-slot="data-grid-loading"
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/60"
        >
          <Spinner className="size-6" aria-label="Loading" />
        </div>
      )}
    </div>
  );
}

// Native table rows can't draw borders (border-separate), so cells do. A
// virtualized table renders positioned divs instead: the row draws the border
// and cells center their content with flex.
function rowClassName(layout: DataGridLayout, isVirtualized?: boolean) {
  return cn(
    "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset data-hovered:bg-muted/40 data-selected:bg-muted data-dragging:opacity-50 data-drop-target:bg-accent",
    layout.stripped && "odd:bg-muted/30",
    // Virtualized rows are zero-height boxes (cells are positioned), so this
    // border draws at each row's top: skip the first body row (rowindex 2,
    // after the header), which sits right under the header's own border.
    isVirtualized && layout.rowBorder && "border-b aria-[rowindex=2]:border-b-0",
  );
}

function cellClassName(layout: DataGridLayout, isVirtualized?: boolean) {
  return cn(
    "align-middle outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
    isVirtualized && "flex items-center",
    !isVirtualized && layout.rowBorder && "border-b [tr:last-child>&]:border-b-0",
    layout.cellBorder && "border-e last:border-e-0",
  );
}

const COLUMN_DRAG_TYPE = "application/x-fma-data-grid-column";

/**
 * A header's drag source and drop target for `columnsDraggable`: dropping a
 * header on another moves it before or after that column, by pointer side.
 */
function ColumnDragArea({
  column,
  dense,
  children,
}: {
  column: DataGridColumn<RowData>;
  dense?: boolean;
  children: React.ReactNode;
}) {
  const { table } = useDataGrid();
  const { direction } = useLocale();
  const ref = React.useRef<HTMLDivElement>(null);
  const [side, setSide] = React.useState<"before" | "after" | null>(null);
  const sideAt = (x: number) => {
    const width = ref.current?.offsetWidth ?? 0;
    const startHalf = x < width / 2;
    return startHalf === (direction === "ltr") ? "before" : "after";
  };

  const { dragProps, isDragging } = useDrag({
    getItems: () => [{ [COLUMN_DRAG_TYPE]: column.id, "text/plain": getColumnHeaderLabel(column) }],
  });
  const { dropProps } = useDrop({
    ref,
    getDropOperation: (types) => (types.has(COLUMN_DRAG_TYPE) && !isDragging ? "move" : "cancel"),
    onDropEnter: (event) => setSide(sideAt(event.x)),
    onDropMove: (event) => setSide(sideAt(event.x)),
    onDropExit: () => setSide(null),
    onDrop: async (event) => {
      const at = sideAt(event.x);
      setSide(null);
      const item = event.items.find(
        (item) => isTextDropItem(item) && item.types.has(COLUMN_DRAG_TYPE),
      );
      if (!item || !isTextDropItem(item)) return;
      const id = await item.getText(COLUMN_DRAG_TYPE);
      if (id === column.id) return;
      const current = table.store.state.columnOrder.length
        ? table.store.state.columnOrder
        : table.getAllLeafColumns().map((leaf) => leaf.id);
      const next = current.filter((key) => key !== id);
      const index = next.indexOf(column.id);
      if (index === -1) return;
      next.splice(at === "after" ? index + 1 : index, 0, id);
      table.setColumnOrder(next);
    },
  });

  return (
    <div
      ref={ref}
      {...dragProps}
      {...dropProps}
      data-slot="data-grid-column-drag-area"
      data-dragging={isDragging || undefined}
      data-drop-side={side ?? undefined}
      className={cn(
        // Spans the cell's padding, so the drop line sits on the column edge.
        "relative min-w-0 flex-1 cursor-grab py-2.5 data-dragging:opacity-50",
        dense ? "-mx-2.5 px-2.5" : "-mx-4 px-4",
        "before:pointer-events-none before:absolute before:inset-y-0 before:w-0.5 before:bg-primary before:opacity-0 data-drop-side:before:opacity-100 data-[drop-side=after]:before:end-0 data-[drop-side=before]:before:start-0",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Toggles a row's full-width details (`renderExpandedRow` on `DataGridTable`);
 * put it in a cell. Rows expand only when `getRowCanExpand` allows it.
 */
function DataGridRowExpand<TData extends RowData>({
  row,
  className,
}: {
  row: TanstackRow<DataGridFeatures, TData>;
  className?: string;
}) {
  if (!row.getCanExpand()) return null;
  const isExpanded = row.getIsExpanded();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isExpanded ? "Collapse row" : "Expand row"}
      aria-expanded={isExpanded}
      onPress={() => row.toggleExpanded()}
      className={className}
    >
      {isExpanded ? (
        <ChevronDownIcon aria-hidden="true" />
      ) : (
        <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
      )}
    </Button>
  );
}

/** Row selection checkbox: in a header it selects the page, in a cell its row. */
function DataGridRowSelect(props: Omit<React.ComponentProps<typeof Checkbox>, "slot">) {
  return <Checkbox slot="selection" {...props} />;
}

/** Drag handle for `onRowsReorder`; put it in a cell. */
function DataGridRowDragHandle({ className, ...props }: React.ComponentProps<typeof AriaButton>) {
  return (
    <AriaButton
      slot="drag"
      className={cn(
        "flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground outline-none data-focus-visible:ring-2 data-focus-visible:ring-ring/50 data-hovered:bg-muted",
        className as string,
      )}
      {...props}
    >
      <GripVerticalIcon aria-hidden="true" className="size-4" />
    </AriaButton>
  );
}

/** Pins a row to the top (TanStack row pinning); put it in a cell. */
function DataGridRowPin<TData extends RowData>({
  row,
}: {
  row: TanstackRow<DataGridFeatures, TData>;
}) {
  const isPinned = row.getIsPinned();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isPinned ? "Unpin row" : "Pin row"}
      aria-pressed={!!isPinned}
      onPress={() => row.pin(isPinned ? false : "top")}
    >
      {isPinned ? <PinOffIcon aria-hidden="true" /> : <PinIcon aria-hidden="true" />}
    </Button>
  );
}

type DataGridColumnHeaderProps<TData extends RowData, TValue extends CellData> = {
  column: DataGridColumn<TData, TValue>;
  /** Defaults to `getColumnHeaderLabel(column)`. */
  title?: string;
  icon?: React.ReactNode;
  /** Adds the column visibility submenu (with `tableLayout.columnsVisibility`). */
  visibility?: boolean;
  className?: string;
};

/**
 * A header with a sort indicator. With pinning, moving or visibility enabled
 * in `tableLayout`, the title opens a menu with those actions and sorting.
 */
function DataGridColumnHeader<TData extends RowData, TValue extends CellData>({
  column,
  title,
  icon,
  visibility = false,
  className,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const { table, layout, isLoading } = useDataGrid<TData>();
  const label = title ?? getColumnHeaderLabel(column);
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const canSort = column.getCanSort();
  const canPin = !!layout.columnsPinnable && column.getCanPin();
  const order = table.store.state.columnOrder.length
    ? table.store.state.columnOrder
    : table.getAllLeafColumns().map((leaf) => leaf.id);
  const index = order.indexOf(column.id);

  const sortIcon = canSort ? (
    sorted === "desc" ? (
      <ArrowDownIcon aria-hidden="true" className="size-3.5" />
    ) : sorted === "asc" ? (
      <ArrowUpIcon aria-hidden="true" className="size-3.5" />
    ) : (
      <ChevronsUpDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
    )
  ) : null;

  const hasMenu = canPin || layout.columnsMovable || (layout.columnsVisibility && visibility);

  if (!hasMenu) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        {icon}
        {label}
        {sortIcon}
      </span>
    );
  }

  const move = (offset: number) => {
    const next = [...order];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(index + offset, 0, moved);
    table.setColumnOrder(next);
  };

  const onAction = (key: Key) => {
    switch (key) {
      case "asc":
      case "desc":
        if (sorted === key) column.clearSorting();
        else column.toggleSorting(key === "desc");
        break;
      case "pin-start":
        column.pin(pinned === "start" ? false : "start");
        break;
      case "pin-end":
        column.pin(pinned === "end" ? false : "end");
        break;
      case "move-left":
        move(-1);
        break;
      case "move-right":
        move(1);
        break;
      default:
        table.getColumn(String(key))?.toggleVisibility();
    }
  };

  const hideable = table.getAllLeafColumns().filter((leaf) => leaf.getCanHide());
  const check = (isOn: boolean) =>
    isOn ? <CheckIcon aria-hidden="true" className="ml-auto text-primary" /> : null;

  return (
    <div className="-ms-2 flex items-center gap-1">
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          isDisabled={isLoading}
          className={cn("h-7 gap-1.5 px-2 font-medium text-muted-foreground", className)}
        >
          {icon}
          {label}
          {sortIcon}
        </Button>
        <DropdownMenu aria-label={`${label} column`} className="w-44" onAction={onAction}>
          {canSort && (
            <DropdownMenuGroup aria-label="Sort">
              <DropdownMenuItem id="asc" textValue="Ascending">
                <ArrowUpIcon aria-hidden="true" />
                Ascending
                {check(sorted === "asc")}
              </DropdownMenuItem>
              <DropdownMenuItem id="desc" textValue="Descending">
                <ArrowDownIcon aria-hidden="true" />
                Descending
                {check(sorted === "desc")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          {canPin && (
            <>
              {canSort && <DropdownMenuSeparator />}
              <DropdownMenuGroup aria-label="Pin">
                <DropdownMenuItem id="pin-start" textValue="Pin to start">
                  <ArrowLeftToLineIcon aria-hidden="true" className="rtl:rotate-180" />
                  Pin to start
                  {check(pinned === "start")}
                </DropdownMenuItem>
                <DropdownMenuItem id="pin-end" textValue="Pin to end">
                  <ArrowRightToLineIcon aria-hidden="true" className="rtl:rotate-180" />
                  Pin to end
                  {check(pinned === "end")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          {layout.columnsMovable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup aria-label="Move">
                <DropdownMenuItem id="move-left" isDisabled={index <= 0 || !!pinned}>
                  <ArrowLeftIcon aria-hidden="true" />
                  Move left
                </DropdownMenuItem>
                <DropdownMenuItem
                  id="move-right"
                  isDisabled={index >= order.length - 1 || !!pinned}
                >
                  <ArrowRightIcon aria-hidden="true" />
                  Move right
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          {layout.columnsVisibility && visibility && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup aria-label="Columns">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                {hideable.map((leaf) => (
                  <DropdownMenuItem
                    key={leaf.id}
                    id={leaf.id}
                    textValue={getColumnHeaderLabel(leaf)}
                  >
                    {getColumnHeaderLabel(leaf)}
                    {check(leaf.getIsVisible())}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenu>
      </DropdownMenuTrigger>
      {canPin && pinned && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Unpin ${label} column`}
          onPress={() => column.pin(false)}
        >
          <PinOffIcon aria-hidden="true" className="opacity-60" />
        </Button>
      )}
    </div>
  );
}

/** A menu to show or hide columns; `trigger` is the button that opens it. */
function DataGridColumnVisibility<TData extends RowData>({
  table,
  trigger,
}: {
  table: TanstackTable<DataGridFeatures, TData>;
  trigger: React.ReactElement;
}) {
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide());
  return (
    <DropdownMenuTrigger>
      {trigger}
      <DropdownMenu
        aria-label="Columns"
        placement="bottom end"
        className="min-w-40"
        selectionMode="multiple"
        selectedKeys={hideable.filter((column) => column.getIsVisible()).map((column) => column.id)}
        onSelectionChange={(keys) => {
          const visible = keys === "all" ? null : new Set([...keys].map(String));
          for (const column of hideable)
            column.toggleVisibility(!visible || visible.has(column.id));
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          {hideable.map((column) => (
            <DropdownMenuItem
              key={column.id}
              id={column.id}
              textValue={getColumnHeaderLabel(column)}
            >
              {getColumnHeaderLabel(column)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}

type DataGridColumnFilterProps<TData extends RowData, TValue extends CellData> = {
  column?: DataGridColumn<TData, TValue>;
  title?: string;
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
};

/**
 * A faceted filter: a button opening a searchable list of options. The
 * column's filter value becomes the array of selected values (pair it with
 * `filterFn: "arrHas"`); counts come from `getFacetedUniqueValues`.
 */
function DataGridColumnFilter<TData extends RowData, TValue extends CellData>({
  column,
  title,
  options,
}: DataGridColumnFilterProps<TData, TValue>) {
  const [query, setQuery] = React.useState("");
  const facets = column?.getFacetedUniqueValues?.();
  const value = column?.getFilterValue();
  const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
  const shown = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );
  const setSelected = (values: string[]) =>
    column?.setFilterValue(values.length ? values : undefined);

  return (
    <DialogTrigger>
      <Button variant="outline" size="sm" className="border-dashed">
        <CirclePlusIcon aria-hidden="true" />
        {title}
        {selected.size > 0 && (
          <Badge variant="secondary" className="ms-1 px-1 font-normal">
            {selected.size > 2
              ? `${selected.size} selected`
              : options
                  .filter((option) => selected.has(option.value))
                  .map((option) => option.label)
                  .join(", ")}
          </Badge>
        )}
      </Button>
      <Popover placement="bottom start" className="w-56 gap-0 p-0">
        <Dialog aria-label={title ?? "Filter"} className="outline-none">
          <div className="p-2">
            <Input
              aria-label={`Search ${title ?? "options"}`}
              placeholder={title}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8"
            />
          </div>
          <ListBox
            aria-label={title ?? "Options"}
            selectionMode="multiple"
            // Escape closes the popover instead of clearing the filter.
            escapeKeyBehavior="none"
            selectedKeys={selected}
            onSelectionChange={(keys) =>
              setSelected(
                keys === "all" ? options.map((option) => option.value) : [...keys].map(String),
              )
            }
            items={shown}
            renderEmptyState={() => (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}
            className="max-h-72 overflow-y-auto p-1 outline-none"
          >
            {(option) => (
              <ListBoxItem
                id={option.value}
                textValue={option.label}
                className="group/option flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-focused:bg-accent data-focused:text-accent-foreground"
              >
                <span className="flex size-4 items-center justify-center rounded-sm border border-primary opacity-50 group-data-selected/option:bg-primary group-data-selected/option:text-primary-foreground group-data-selected/option:opacity-100">
                  <CheckIcon
                    aria-hidden="true"
                    className="size-3.5 invisible group-data-selected/option:visible"
                  />
                </span>
                {option.icon && <option.icon className="size-4 text-muted-foreground" />}
                <span>{option.label}</span>
                {facets?.get(option.value) !== undefined && (
                  <span className="ms-auto font-mono text-xs">{facets.get(option.value)}</span>
                )}
              </ListBoxItem>
            )}
          </ListBox>
          {selected.size > 0 && (
            <div className="border-t p-1">
              <Button variant="ghost" size="sm" className="w-full" onPress={() => setSelected([])}>
                Clear filters
              </Button>
            </div>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

type DataGridPaginationProps = {
  sizes?: number[];
  /** "{from}", "{to}" and "{count}" are replaced. */
  info?: string;
  rowsPerPageLabel?: string;
  previousPageLabel?: string;
  nextPageLabel?: string;
  /** How many page buttons show at once before an ellipsis. */
  moreLimit?: number;
  className?: string;
};

function DataGridPagination({
  sizes = [5, 10, 25, 50, 100],
  info = "{from} - {to} of {count}",
  rowsPerPageLabel = "Rows per page",
  previousPageLabel = "Previous page",
  nextPageLabel = "Next page",
  moreLimit = 5,
  className,
}: DataGridPaginationProps) {
  const { table, recordCount, isLoading } = useDataGrid();
  const { pageIndex, pageSize } = table.store.state.pagination;
  const pageCount = table.getPageCount();
  const from = recordCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, recordCount);
  const groupStart = Math.floor(pageIndex / moreLimit) * moreLimit;
  const groupEnd = Math.min(groupStart + moreLimit, pageCount);
  const pages = Array.from({ length: groupEnd - groupStart }, (_, i) => groupStart + i);

  if (isLoading) {
    return (
      <div data-slot="data-grid-pagination" className={cn("flex justify-between", className)}>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-60" />
      </div>
    );
  }

  return (
    <nav
      aria-label="Pagination"
      data-slot="data-grid-pagination"
      className={cn(
        "flex flex-col flex-wrap items-center justify-between gap-2.5 sm:flex-row",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Select
          aria-label={rowsPerPageLabel}
          value={String(pageSize)}
          onChange={(key) => table.setPageSize(Number(key))}
          className="flex items-center gap-2.5"
        >
          <span className="text-sm text-muted-foreground">{rowsPerPageLabel}</span>
          <SelectTrigger size="sm" className="w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((size) => (
              <SelectItem key={size} id={String(size)}>
                {String(size)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col items-center gap-2.5 sm:flex-row">
        <span className="text-sm text-nowrap text-muted-foreground">
          {info
            .replaceAll("{from}", String(from))
            .replaceAll("{to}", String(to))
            .replaceAll("{count}", String(recordCount))}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={previousPageLabel}
              isDisabled={!table.getCanPreviousPage()}
              onPress={() => table.previousPage()}
            >
              <ChevronLeftIcon aria-hidden="true" className="rtl:rotate-180" />
            </Button>
            {groupStart > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Page ${groupStart}`}
                onPress={() => table.setPageIndex(groupStart - 1)}
              >
                …
              </Button>
            )}
            {pages.map((page) => (
              <Button
                key={page}
                variant="ghost"
                size="icon-sm"
                aria-label={`Page ${page + 1}`}
                aria-current={page === pageIndex ? "page" : undefined}
                className="text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
                onPress={() => table.setPageIndex(page)}
              >
                {page + 1}
              </Button>
            ))}
            {groupEnd < pageCount && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Page ${groupEnd + 1}`}
                onPress={() => table.setPageIndex(groupEnd)}
              >
                …
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={nextPageLabel}
              isDisabled={!table.getCanNextPage()}
              onPress={() => table.nextPage()}
            >
              <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

export type {
  DataGridColumn,
  DataGridColumnFilterProps,
  DataGridColumnHeaderProps,
  DataGridColumnMeta,
  DataGridFeatures,
  DataGridLayout,
  DataGridPaginationProps,
  DataGridProps,
  DataGridTableProps,
};
export {
  DataGrid,
  DataGridColumnFilter,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridContainer,
  DataGridPagination,
  DataGridRowDragHandle,
  DataGridRowExpand,
  DataGridRowPin,
  DataGridRowSelect,
  DataGridTable,
  dataGridFeatures,
  getColumnHeaderLabel,
  useDataGrid,
};
