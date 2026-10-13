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
  createExpandedRowModel,
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
  TableFooter,
  TableHeader,
  TableLayout,
  TableLoadMoreItem,
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
  // Flattens expanded `getSubRows` children into the rows (tree rows).
  expandedRowModel: createExpandedRowModel(),
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
  /** Tints the footer rows (`footerContent`). */
  footerBackground?: boolean;
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

/** Every built-in string of the grid. Labels that interpolate are functions. */
type DataGridI18nLabels = {
  table: string;
  loading: string;
  fetchingMore: string;
  allRowsLoaded: string;
  empty: string;
  sort: string;
  sortAscending: string;
  sortDescending: string;
  pin: string;
  pinColumnStart: string;
  pinColumnEnd: string;
  unpinColumn: (column: string) => string;
  move: string;
  moveColumnLeft: string;
  moveColumnRight: string;
  columns: string;
  toggleColumns: string;
  columnMenu: (column: string) => string;
  resizeColumn: (column: string) => string;
  expandRow: string;
  collapseRow: string;
  rowDetails: (row: string) => string;
  pinRow: string;
  unpinRow: string;
  filter: string;
  filterSearch: (title: string) => string;
  filterNoResults: string;
  filterClear: string;
  filterSelected: (count: number) => string;
  pagination: string;
  rowsPerPage: string;
  paginationInfo: (info: { from: number; to: number; count: number }) => string;
  previousPage: string;
  nextPage: string;
  goToPage: (page: number) => string;
  ellipsis: string;
};

type DataGridI18nConfig = { labels: DataGridI18nLabels };

/** Partial overrides, merged over the defaults per section. */
type DataGridI18nOverrides = { labels?: Partial<DataGridI18nLabels> };

const defaultDataGridI18n: DataGridI18nConfig = {
  labels: {
    table: "Data grid",
    loading: "Loading...",
    fetchingMore: "Loading more...",
    allRowsLoaded: "All records loaded",
    empty: "No data available",
    sort: "Sort",
    sortAscending: "Ascending",
    sortDescending: "Descending",
    pin: "Pin",
    pinColumnStart: "Pin to start",
    pinColumnEnd: "Pin to end",
    unpinColumn: (column) => `Unpin ${column} column`,
    move: "Move",
    moveColumnLeft: "Move left",
    moveColumnRight: "Move right",
    columns: "Columns",
    toggleColumns: "Toggle columns",
    columnMenu: (column) => `${column} column`,
    resizeColumn: (column) => `Resize ${column}`,
    expandRow: "Expand row",
    collapseRow: "Collapse row",
    rowDetails: (row) => `${row} details`,
    pinRow: "Pin row",
    unpinRow: "Unpin row",
    filter: "Filter",
    filterSearch: (title) => `Search ${title}`,
    filterNoResults: "No results found.",
    filterClear: "Clear filters",
    filterSelected: (count) => `${count} selected`,
    pagination: "Pagination",
    rowsPerPage: "Rows per page",
    paginationInfo: ({ from, to, count }) => `${from} - ${to} of ${count}`,
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    goToPage: (page) => `Page ${page}`,
    ellipsis: "...",
  },
};

/** Merges overrides over the defaults; untouched keys keep their default. */
function mergeDataGridI18n(overrides?: DataGridI18nOverrides): DataGridI18nConfig {
  return { labels: { ...defaultDataGridI18n.labels, ...overrides?.labels } };
}

type DataGridProps<TData extends RowData> = {
  /** A table created with `useTable({ features: dataGridFeatures, ... })`. */
  table: TanstackTable<DataGridFeatures, TData>;
  /** Total rows across pages (the server's total with manual pagination). */
  recordCount: number;
  isLoading?: boolean;
  /** "skeleton" (default) shows placeholder rows; "spinner" overlays the current rows. */
  loadingMode?: "skeleton" | "spinner";
  /** Shown beside the spinner in the "spinner" loading mode. Defaults to "Loading...". */
  loadingMessage?: React.ReactNode;
  /** Shown while `DataGridTable` fetches more rows (`onFetchMore`). Defaults to `loadingMessage`. */
  fetchingMoreMessage?: React.ReactNode;
  /** Shown under the rows once `hasMore` is false. Defaults to "All records loaded". */
  allRowsLoadedMessage?: React.ReactNode;
  /** Defaults to "No data available". */
  emptyMessage?: React.ReactNode;
  /**
   * Overrides for the built-in strings (menus, aria labels, pagination,
   * filter). Specific props such as `loadingMessage`, `emptyMessage` or the
   * pagination label props win over their `i18n` counterpart.
   */
  i18n?: DataGridI18nOverrides;
  /** Makes rows actionable: pressing one (or Enter on it) calls this. */
  onRowClick?: (row: TData) => void;
  tableLayout?: DataGridLayout;
  className?: string;
  children?: React.ReactNode;
};

type DataGridContextValue = Omit<DataGridProps<RowData>, "table" | "children" | "i18n"> & {
  table: TanstackTable<DataGridFeatures, RowData>;
  layout: DataGridLayout;
  i18n: DataGridI18nConfig;
};

const DataGridContext = React.createContext<DataGridContextValue | null>(null);

function useDataGrid<TData extends RowData = RowData>() {
  const context = React.useContext(DataGridContext);
  if (!context) throw new Error("useDataGrid must be used within a DataGrid");
  return context as Omit<DataGridContextValue, "table"> & {
    table: TanstackTable<DataGridFeatures, TData>;
  };
}

/** The grid's labels; the defaults outside a `DataGrid`. */
function useDataGridLabels(): DataGridI18nLabels {
  return (React.useContext(DataGridContext)?.i18n ?? defaultDataGridI18n).labels;
}

/** Provides the TanStack `table` to the grid parts (table, pagination, headers). */
function DataGrid<TData extends RowData>({
  table,
  tableLayout,
  className,
  children,
  i18n,
  ...props
}: DataGridProps<TData>) {
  // Rebuilt every render on purpose: the table instance is stable while its
  // state changes, and the parts must re-render with it.
  const value: DataGridContextValue = {
    // The context is untyped; useDataGrid<TData>() restores the row type.
    ...(props as Omit<DataGridProps<RowData>, "table" | "children" | "i18n">),
    table: table as TanstackTable<DataGridFeatures, RowData>,
    layout: { rowBorder: true, width: "fixed", ...tableLayout },
    i18n: mergeDataGridI18n(i18n),
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

/**
 * Pinning hooks on header and body cells: `data-pinned` names the side and
 * `data-last-col` marks the group's inner edge (the last start-pinned or
 * first end-pinned column), which carries the divider.
 */
function pinningAttributes<TData extends RowData>(column: DataGridColumn<TData>) {
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  const isInner =
    pinned === "start" ? column.getIsLastColumn("start") : column.getIsFirstColumn("end");
  return { "data-pinned": pinned, "data-last-col": isInner ? pinned : undefined };
}

/**
 * The opaque surface behind pinned cells and sticky headers:
 * `--data-grid-surface` when set on an ancestor, else `--card` inside a Card,
 * else `--background`. Raw tokens: `--color-*` resolve at :root, so they'd
 * stay light under a scoped `.dark` subtree.
 */
const pinnedDivider = "data-[last-col=end]:border-s data-[last-col=start]:border-e";

const surfaceBackground =
  "bg-[color:var(--data-grid-surface,var(--data-grid-card-surface,var(--background)))]";

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
  /**
   * Footer rows (`DataGridTableFootRow`), rendered in the table's footer
   * (`<tfoot>`), e.g. totals.
   */
  footerContent?: React.ReactNode;
  /**
   * Infinite scroll: called when the user scrolls near the end of the loaded
   * rows (within one viewport height, see `fetchMoreScrollOffset`). Append
   * the next rows to `data`; give the table a height through `className`.
   */
  onFetchMore?: () => void;
  /** Whether `onFetchMore` is loading; shows a loading row under the rows. */
  isFetchingMore?: boolean;
  /** False once every row is loaded: stops `onFetchMore` and shows `allRowsLoadedMessage`. */
  hasMore?: boolean;
  /**
   * How close to the end `onFetchMore` fires, as a fraction of the viewport
   * height (1 = within one viewport). Defaults to 1.
   */
  fetchMoreScrollOffset?: number;
};

// Key suffix of the full-width row rendered under an expanded row.
const EXPANDED = ":expanded";
// Key of the end-of-list row under infinite scroll.
const ALL_LOADED = "data-grid:all-loaded";

/**
 * Renders the grid with react-aria's `Table`: keyboard navigation between
 * cells, `aria-sort`, selection and resizing come from react-aria while
 * TanStack holds the data model.
 */
function DataGridTable<TData extends RowData = RowData>({
  "aria-label": ariaLabelProp,
  className,
  onRowsReorder,
  isVirtualized,
  rowHeight = 40,
  renderExpandedRow,
  footerContent,
  onFetchMore,
  isFetchingMore,
  hasMore,
  fetchMoreScrollOffset,
}: DataGridTableProps<TData>) {
  const {
    table,
    layout,
    isLoading,
    loadingMode = "skeleton",
    loadingMessage,
    fetchingMoreMessage,
    allRowsLoadedMessage,
    emptyMessage,
    onRowClick,
    i18n: { labels },
  } = useDataGrid();
  const ariaLabel = ariaLabelProp ?? labels.table;
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
  const topRows = table.getTopRows();
  const bottomRows = table.getBottomRows();
  const rows = [...topRows, ...table.getCenterRows(), ...bottomRows];
  // The seam between pinned and unpinned rows.
  const topBoundaryId = topRows.at(-1)?.id;
  const bottomBoundaryId = bottomRows[0]?.id;
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
        ALL_LOADED,
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
              {...pinningAttributes(column)}
              className={cn(
                "group/column relative h-10 border-b text-left align-middle font-medium whitespace-nowrap text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                isVirtualized && "flex items-center",
                layout.dense ? "px-2.5" : "px-4",
                layout.cellBorder && "border-e last:border-e-0",
                pinnedDivider,
                // Opaque backgrounds on the cells: rows scroll under a sticky or virtualized
                // header, and the virtualized header row group paints no background.
                // Mixes the raw tokens: `--color-*` resolve at :root, so they'd stay
                // light under a `.dark` subtree.
                layout.headerBackground
                  ? "bg-[color-mix(in_oklab,var(--muted)_40%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]"
                  : (overlapsRows || column.getIsPinned()) && surfaceBackground,
                column.columnDef.meta?.headerClassName,
              )}
            >
              <div className="flex items-center gap-1">
                {/* Pinned columns keep their place: no drag source, no drop target. */}
                {layout.columnsDraggable && !showSkeleton && !column.getIsPinned() ? (
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
                    aria-label={labels.resizeColumn(getColumnHeaderLabel(column))}
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
            {emptyMessage ?? labels.empty}
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
                data-row-id={row.id}
                data-depth={row.depth || undefined}
                data-row-pinned={row.getIsPinned() || undefined}
                data-row-pinned-boundary={
                  row.id === topBoundaryId
                    ? "top"
                    : row.id === bottomBoundaryId
                      ? "bottom"
                      : undefined
                }
                className={cn(
                  rowClassName(layout, isVirtualized),
                  onRowClick && "cursor-pointer",
                  "data-row-pinned:bg-muted/40",
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
                    {...pinningAttributes(cell.column)}
                    className={cn(
                      cellPadding,
                      cellClassName(layout, isVirtualized),
                      pinnedDivider,
                      cell.column.getIsPinned() && surfaceBackground,
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
                      textValue={labels.rowDetails(
                        String((rowHeaderId && row.getValue(rowHeaderId)) ?? row.id),
                      )}
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
        {onFetchMore && !showSkeleton && (
          <TableLoadMoreItem
            data-slot="data-grid-fetching-more"
            onLoadMore={hasMore === false ? undefined : onFetchMore}
            isLoading={!!isFetchingMore && hasMore !== false}
            scrollOffset={fetchMoreScrollOffset}
            className={cn(isVirtualized && "flex items-center justify-center")}
          >
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
            >
              <Spinner className="size-4" role="presentation" aria-hidden="true" />
              {fetchingMoreMessage ?? loadingMessage ?? labels.fetchingMore}
            </div>
          </TableLoadMoreItem>
        )}
        {onFetchMore && hasMore === false && !showSkeleton && rows.length > 0 && (
          <Row
            id={ALL_LOADED}
            textValue={labels.allRowsLoaded}
            data-slot="data-grid-all-loaded"
            className={rowClassName({ ...layout, stripped: false }, isVirtualized)}
          >
            <Cell
              colSpan={columns.length}
              className={cn(
                cellPadding,
                cellClassName(layout, isVirtualized),
                "justify-center text-center text-sm text-muted-foreground",
              )}
            >
              {allRowsLoadedMessage ?? labels.allRowsLoaded}
            </Cell>
          </Row>
        )}
      </TableBody>
      {footerContent ? <DataGridTableFoot>{footerContent}</DataGridTableFoot> : null}
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
      // Pinned cells and sticky headers follow a Card's surface.
      className="relative [[data-slot=card]_&]:[--data-grid-card-surface:var(--card)]"
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
          role="status"
          className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-background/60 text-sm text-muted-foreground"
        >
          <Spinner className="size-5" role="presentation" aria-hidden="true" />
          {loadingMessage ?? labels.loading}
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
    "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset data-hovered:bg-accent/50 data-selected:bg-accent data-selected:text-accent-foreground data-dragging:opacity-50 data-drop-target:bg-accent",
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

/** The table's footer (`<tfoot>`); `footerContent` on `DataGridTable` renders one for you. */
function DataGridTableFoot({ className, ...props }: React.ComponentProps<typeof TableFooter>) {
  return (
    <TableFooter
      data-slot="data-grid-table-foot"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

/** A footer row, inside `footerContent`. */
function DataGridTableFootRow({ className, ...props }: React.ComponentProps<typeof Row>) {
  const { layout } = useDataGrid();
  return (
    <Row
      data-slot="data-grid-table-foot-row"
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        layout.footerBackground && "bg-muted/40",
        className as string,
      )}
      {...props}
    />
  );
}

/** A footer cell; `colSpan` spans it over several columns. */
function DataGridTableFootRowCell({ className, ...props }: React.ComponentProps<typeof Cell>) {
  const { layout } = useDataGrid();
  return (
    <Cell
      data-slot="data-grid-table-foot-cell"
      className={cn(
        "align-middle outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        layout.dense ? "px-2.5 py-1.5" : "px-4 py-2.5",
        // The body's last row draws no bottom border: the footer's first row
        // draws the seam.
        "[tr:first-child>&]:border-t",
        layout.rowBorder && "border-b [tr:last-child>&]:border-b-0",
        layout.cellBorder && "border-e last:border-e-0",
        className as string,
      )}
      {...props}
    />
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
 * Indents a tree row's content by its depth: sets `--data-grid-tree-padding`
 * and uses it as the inline-start padding. For custom tree cells.
 */
function getDataGridTreeIndentStyle<TData extends RowData>(
  row: TanstackRow<DataGridFeatures, TData>,
  indent = 20,
): React.CSSProperties {
  return {
    "--data-grid-tree-padding": `${row.depth * indent}px`,
    paddingInlineStart: "var(--data-grid-tree-padding)",
  } as React.CSSProperties;
}

/**
 * Expands a row: shows its `getSubRows` children (tree rows) or the
 * full-width details of `renderExpandedRow` on `DataGridTable`. Put it in a
 * cell, before the label in tree rows: it indents by the row's depth and
 * leaves a spacer on leaves so labels line up. `children` replaces the chevron.
 */
function DataGridRowExpand<TData extends RowData>({
  row,
  indent = 20,
  className,
  children,
}: {
  row: TanstackRow<DataGridFeatures, TData>;
  /** Inline offset per tree depth, in pixels. */
  indent?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const labels = useDataGridLabels();
  const isExpanded = row.getIsExpanded();
  return (
    <span
      data-slot="data-grid-table-row-expand"
      style={getDataGridTreeIndentStyle(row, indent)}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {row.getCanExpand() ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={isExpanded ? labels.collapseRow : labels.expandRow}
          aria-expanded={isExpanded}
          onPress={() => row.toggleExpanded()}
        >
          {children ??
            (isExpanded ? (
              <ChevronDownIcon aria-hidden="true" />
            ) : (
              <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
            ))}
        </Button>
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
    </span>
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

/** Pins a row to the top, or to the bottom (TanStack row pinning); put it in a cell. */
function DataGridRowPin<TData extends RowData>({
  row,
  position = "top",
}: {
  row: TanstackRow<DataGridFeatures, TData>;
  position?: "top" | "bottom";
}) {
  const labels = useDataGridLabels();
  const isPinned = row.getIsPinned();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isPinned ? labels.unpinRow : labels.pinRow}
      aria-pressed={!!isPinned}
      onPress={() => row.pin(isPinned ? false : position)}
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
  const {
    table,
    layout,
    isLoading,
    i18n: { labels },
  } = useDataGrid<TData>();
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
        <DropdownMenu aria-label={labels.columnMenu(label)} className="w-44" onAction={onAction}>
          {canSort && (
            <DropdownMenuGroup aria-label={labels.sort}>
              <DropdownMenuItem id="asc" textValue={labels.sortAscending}>
                <ArrowUpIcon aria-hidden="true" />
                {labels.sortAscending}
                {check(sorted === "asc")}
              </DropdownMenuItem>
              <DropdownMenuItem id="desc" textValue={labels.sortDescending}>
                <ArrowDownIcon aria-hidden="true" />
                {labels.sortDescending}
                {check(sorted === "desc")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          {canPin && (
            <>
              {canSort && <DropdownMenuSeparator />}
              <DropdownMenuGroup aria-label={labels.pin}>
                <DropdownMenuItem id="pin-start" textValue={labels.pinColumnStart}>
                  <ArrowLeftToLineIcon aria-hidden="true" className="rtl:rotate-180" />
                  {labels.pinColumnStart}
                  {check(pinned === "start")}
                </DropdownMenuItem>
                <DropdownMenuItem id="pin-end" textValue={labels.pinColumnEnd}>
                  <ArrowRightToLineIcon aria-hidden="true" className="rtl:rotate-180" />
                  {labels.pinColumnEnd}
                  {check(pinned === "end")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          {layout.columnsMovable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup aria-label={labels.move}>
                <DropdownMenuItem id="move-left" isDisabled={index <= 0 || !!pinned}>
                  <ArrowLeftIcon aria-hidden="true" />
                  {labels.moveColumnLeft}
                </DropdownMenuItem>
                <DropdownMenuItem
                  id="move-right"
                  isDisabled={index >= order.length - 1 || !!pinned}
                >
                  <ArrowRightIcon aria-hidden="true" />
                  {labels.moveColumnRight}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          {layout.columnsVisibility && visibility && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup aria-label={labels.columns}>
                <DropdownMenuLabel>{labels.columns}</DropdownMenuLabel>
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
          aria-label={labels.unpinColumn(label)}
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
  const labels = useDataGridLabels();
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide());
  return (
    <DropdownMenuTrigger>
      {trigger}
      <DropdownMenu
        aria-label={labels.columns}
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
          <DropdownMenuLabel>{labels.toggleColumns}</DropdownMenuLabel>
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
  const labels = useDataGridLabels();
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
              ? labels.filterSelected(selected.size)
              : options
                  .filter((option) => selected.has(option.value))
                  .map((option) => option.label)
                  .join(", ")}
          </Badge>
        )}
      </Button>
      <Popover placement="bottom start" className="w-56 gap-0 p-0">
        <Dialog aria-label={title ?? labels.filter} className="outline-none">
          <div className="p-2">
            <Input
              aria-label={labels.filterSearch(title ?? labels.filter)}
              placeholder={title}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8"
            />
          </div>
          <ListBox
            aria-label={title ?? labels.filter}
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
                {labels.filterNoResults}
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
                {labels.filterClear}
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
  /** Shown instead of the page size selector while loading. */
  sizesSkeleton?: React.ReactNode;
  /** "{from}", "{to}" and "{count}" are replaced. Defaults to `i18n` `paginationInfo`. */
  info?: string;
  /** Shown instead of the record info while loading. */
  infoSkeleton?: React.ReactNode;
  rowsPerPageLabel?: string;
  previousPageLabel?: string;
  nextPageLabel?: string;
  /**
   * Page buttons when the row is truncated, counting the first and last page
   * (rounded down to an odd number, at least 3). An ellipsis stands in for
   * each hidden stretch.
   */
  moreLimit?: number;
  ellipsisText?: string;
  className?: string;
};

/**
 * The page row: every page when they fit, else the first page, a run around
 * the current one and the last page, with `null` for each hidden stretch. It
 * always takes `limit + 2` slots, so the row keeps its width while paging.
 */
function getPageWindow(pageIndex: number, pageCount: number, moreLimit: number) {
  const limit = Math.max(3, moreLimit % 2 === 0 ? moreLimit - 1 : moreLimit);
  const slots = limit + 2;
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);
  if (pageCount <= slots) return range(0, pageCount - 1);
  const last = pageCount - 1;
  const side = (limit - 3) / 2;
  // Near an edge the run grows into the ellipsis slot that edge doesn't need.
  if (pageIndex <= side + 2) return [...range(0, slots - 3), null, last];
  if (pageIndex >= last - side - 2) return [0, null, ...range(last - (slots - 3), last)];
  return [0, null, ...range(pageIndex - side, pageIndex + side), null, last];
}

function DataGridPagination({
  sizes = [5, 10, 25, 50, 100],
  sizesSkeleton = <Skeleton className="h-8 w-44" />,
  info,
  infoSkeleton = <Skeleton className="h-8 w-60" />,
  rowsPerPageLabel: rowsPerPageProp,
  previousPageLabel: previousPageProp,
  nextPageLabel: nextPageProp,
  moreLimit = 5,
  ellipsisText: ellipsisProp,
  className,
}: DataGridPaginationProps) {
  const {
    table,
    recordCount,
    isLoading,
    i18n: { labels },
  } = useDataGrid();
  const rowsPerPageLabel = rowsPerPageProp ?? labels.rowsPerPage;
  const previousPageLabel = previousPageProp ?? labels.previousPage;
  const nextPageLabel = nextPageProp ?? labels.nextPage;
  const ellipsisText = ellipsisProp ?? labels.ellipsis;
  const { pageIndex, pageSize } = table.store.state.pagination;
  const pageCount = table.getPageCount();
  const from = recordCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, recordCount);
  const pages = getPageWindow(pageIndex, pageCount, moreLimit);

  if (isLoading) {
    return (
      <div data-slot="data-grid-pagination" className={cn("flex justify-between", className)}>
        {sizesSkeleton}
        {infoSkeleton}
      </div>
    );
  }

  return (
    <nav
      aria-label={labels.pagination}
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
          {info !== undefined
            ? info
                .replaceAll("{from}", String(from))
                .replaceAll("{to}", String(to))
                .replaceAll("{count}", String(recordCount))
            : labels.paginationInfo({ from, to, count: recordCount })}
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
            {pages.map((page, index) => {
              if (page === null) {
                // Jumps to the middle of the hidden stretch.
                const before = pages[index - 1] ?? 0;
                const after = pages[index + 1] ?? pageCount - 1;
                const target = Math.floor((before + after) / 2);
                return (
                  <Button
                    key={index === 1 ? "ellipsis-start" : "ellipsis-end"}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={labels.goToPage(target + 1)}
                    className="text-muted-foreground"
                    onPress={() => table.setPageIndex(target)}
                  >
                    {ellipsisText}
                  </Button>
                );
              }
              return (
                <Button
                  key={page}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={labels.goToPage(page + 1)}
                  aria-current={page === pageIndex ? "page" : undefined}
                  className="text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
                  onPress={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </Button>
              );
            })}
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
  DataGridI18nConfig,
  DataGridI18nLabels,
  DataGridI18nOverrides,
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
  DataGridTableFoot,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  dataGridFeatures,
  defaultDataGridI18n,
  getColumnHeaderLabel,
  getDataGridTreeIndentStyle,
  mergeDataGridI18n,
  useDataGrid,
};
