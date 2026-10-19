import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowPinningState,
  type RowSelectionState,
  type SortingState,
  type Table,
  useTable,
} from "@tanstack/react-table";
import { Columns3Icon } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { DropdownMenuItem } from "@/core/dropdown-menu/dropdown-menu";
import { Skeleton } from "@/core/skeleton/skeleton";
import {
  DataGrid,
  DataGridColumnFilter,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridContainer,
  type DataGridFeatures,
  type DataGridI18nOverrides,
  type DataGridLayout,
  DataGridPagination,
  DataGridRowActions,
  DataGridRowDragHandle,
  DataGridRowExpand,
  DataGridRowPin,
  DataGridRowSelect,
  DataGridTable,
  type DataGridTableClassNames,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  dataGridFeatures,
} from "./data-grid";
import meta from "./meta.json";

type User = {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  joined: string;
};

const USERS: User[] = [
  {
    id: "USR-001",
    name: "Alice Martin",
    role: "Frontend Engineer",
    status: "Active",
    joined: "2023-01-15",
  },
  {
    id: "USR-002",
    name: "Bob Chen",
    role: "Product Manager",
    status: "Active",
    joined: "2022-07-08",
  },
  {
    id: "USR-003",
    name: "Carol Smith",
    role: "UX Designer",
    status: "Inactive",
    joined: "2021-11-22",
  },
  {
    id: "USR-004",
    name: "David Kim",
    role: "Backend Engineer",
    status: "Active",
    joined: "2023-05-03",
  },
  {
    id: "USR-005",
    name: "Eva Brown",
    role: "Data Analyst",
    status: "Pending",
    joined: "2024-02-14",
  },
  {
    id: "USR-006",
    name: "Frank Lee",
    role: "DevOps Engineer",
    status: "Active",
    joined: "2022-03-19",
  },
  {
    id: "USR-007",
    name: "Grace Liu",
    role: "QA Engineer",
    status: "Inactive",
    joined: "2023-09-01",
  },
  {
    id: "USR-008",
    name: "Henry Park",
    role: "Engineering Manager",
    status: "Active",
    joined: "2020-06-30",
  },
];

type UserColumn = ColumnDef<DataGridFeatures, User>;

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Pending", value: "Pending" },
];

const header =
  (title: string): UserColumn["header"] =>
  ({ column }) => <DataGridColumnHeader column={column} title={title} visibility />;

const COLUMNS: UserColumn[] = [
  { accessorKey: "id", header: header("ID"), size: 110, meta: { headerTitle: "ID" } },
  {
    accessorKey: "name",
    header: header("Name"),
    size: 180,
    meta: { headerTitle: "Name", autoSize: true },
  },
  { accessorKey: "role", header: header("Role"), size: 190, meta: { headerTitle: "Role" } },
  {
    accessorKey: "status",
    header: header("Status"),
    size: 120,
    filterFn: "arrHas",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Active" ? "success-light" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
    meta: { headerTitle: "Status", skeleton: <Skeleton className="h-5 w-16 rounded-full" /> },
  },
  { accessorKey: "joined", header: header("Joined"), size: 130, meta: { headerTitle: "Joined" } },
];

const SELECT_COLUMN: UserColumn = {
  id: "select",
  size: 48,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  header: () => <DataGridRowSelect />,
  cell: () => <DataGridRowSelect />,
  meta: { headerTitle: "Select" },
};

type UsersDataGridProps = {
  data?: User[];
  columns?: UserColumn[];
  isLoading?: boolean;
  loadingMode?: "skeleton" | "spinner";
  emptyMessage?: React.ReactNode;
  onRowClick?: (user: User) => void;
  layout?: DataGridLayout;
  selectable?: boolean;
  pageSize?: number;
  toolbar?: (table: Table<DataGridFeatures, User>) => React.ReactNode;
  /** Adds an expand column and a details row under expanded rows. */
  expandable?: boolean;
  initialPinning?: ColumnPinningState;
  i18n?: DataGridI18nOverrides;
  tableClassNames?: DataGridTableClassNames;
  /** Footer rows for `footerContent`. */
  footer?: (table: Table<DataGridFeatures, User>) => React.ReactNode;
};

const EXPAND_COLUMN: UserColumn = {
  id: "expand",
  size: 48,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  header: () => <span className="sr-only">Details</span>,
  cell: ({ row }) => <DataGridRowExpand row={row} />,
  meta: { headerTitle: "Details" },
};

function UsersDataGrid({
  data = USERS,
  columns = COLUMNS,
  isLoading,
  loadingMode,
  emptyMessage,
  onRowClick,
  layout,
  selectable,
  pageSize = 5,
  toolbar,
  expandable,
  initialPinning = { start: [], end: [] },
  i18n,
  footer,
  tableClassNames,
}: UsersDataGridProps) {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(initialPinning);
  const [rowPinning, setRowPinning] = React.useState<RowPinningState>({ top: [], bottom: [] });

  const table = useTable({
    features: dataGridFeatures,
    data,
    columns: [
      ...(expandable ? [EXPAND_COLUMN] : []),
      ...(selectable ? [SELECT_COLUMN] : []),
      ...columns,
    ],
    getRowCanExpand: () => !!expandable,
    getRowId: (row: User) => row.id,
    state: {
      pagination,
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      columnOrder,
      columnPinning,
      rowPinning,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onRowPinningChange: setRowPinning,
    enableRowSelection: selectable,
    keepPinnedRows: true,
  });

  return (
    <DataGrid
      table={table}
      recordCount={table.getFilteredRowModel().rows.length}
      isLoading={isLoading}
      loadingMode={loadingMode}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      tableLayout={layout}
      i18n={i18n}
      tableClassNames={tableClassNames}
      className="w-[760px]"
    >
      {toolbar?.(table)}
      <DataGridContainer>
        <DataGridTable<User>
          aria-label="Users"
          footerContent={footer?.(table)}
          renderExpandedRow={
            expandable
              ? (row) => (
                  <p className="text-muted-foreground">
                    {row.original.name} has been a {row.original.role} since {row.original.joined}.
                  </p>
                )
              : undefined
          }
        />
      </DataGridContainer>
      <DataGridPagination />
      <output data-testid="selection" className="sr-only">
        {Object.keys(rowSelection).sort().join(",")}
      </output>
      <output data-testid="sizing" className="sr-only">
        {table.store.state.columnSizing.id ?? ""}
      </output>
    </DataGrid>
  );
}

const componentMeta = {
  title: "ui/DataGrid",
  component: DataGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof DataGrid>;

export default componentMeta;
type Story = StoryObj<typeof UsersDataGrid>;

const body = () => within(document.body);
const bodyRows = (canvas: ReturnType<typeof within>): HTMLElement[] =>
  canvas.getAllByRole("row").slice(1);
const firstCells = (canvas: ReturnType<typeof within>) =>
  bodyRows(canvas).map((row) => within(row).getAllByRole("rowheader")[0]?.textContent);

export const Default: Story = {
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid", { name: "Users" });
    await expect(grid).toBeInTheDocument();
    await expect(bodyRows(canvas)).toHaveLength(5);
    await expect(canvas.getByText("1 - 5 of 8")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Go to next page" }));
    await expect(bodyRows(canvas)).toHaveLength(3);
    await expect(canvas.getByText("6 - 8 of 8")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(canvas.getByRole("button", { name: /Rows per page/ }));
    await userEvent.click(await body().findByRole("option", { name: "10" }));
    await expect(bodyRows(canvas)).toHaveLength(8);
    await expect(canvas.queryByRole("button", { name: "Go to next page" })).toBeNull();
  },
};

/** Sortable columns sort on press (or Enter on the header) and expose `aria-sort`. */
export const Sorting: Story = {
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const name = canvas.getByRole("columnheader", { name: /Name/ });
    await userEvent.click(name);
    await expect(name).toHaveAttribute("aria-sort", "ascending");
    await expect(firstCells(canvas)[0]).toBe("USR-001");
    await userEvent.click(name);
    await expect(name).toHaveAttribute("aria-sort", "descending");
    await expect(
      within(bodyRows(canvas)[0] as HTMLElement).getByText("Henry Park"),
    ).toBeInTheDocument();
  },
};

/** With `enableRowSelection`, `DataGridRowSelect` checkboxes select rows; the header one selects the page. */
export const Selection: Story = {
  args: { selectable: true },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const selection = canvas.getByTestId("selection");
    const rowCheckbox = within(bodyRows(canvas)[1] as HTMLElement).getByRole("checkbox");
    await userEvent.click(rowCheckbox);
    await expect(selection).toHaveTextContent("USR-002");

    // Select the whole page, then go on: selections on other pages are kept.
    await userEvent.click(canvas.getByRole("checkbox", { name: /select all/i }));
    await expect(selection).toHaveTextContent("USR-001,USR-002,USR-003,USR-004,USR-005");
    await userEvent.click(canvas.getByRole("button", { name: "Go to next page" }));
    await userEvent.click(within(bodyRows(canvas)[0] as HTMLElement).getByRole("checkbox"));
    await expect(selection).toHaveTextContent("USR-001,USR-002,USR-003,USR-004,USR-005,USR-006");
  },
};

/** `onRowClick` makes rows actionable by pointer and keyboard. */
export const RowClick: Story = {
  args: { onRowClick: fn() },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(within(bodyRows(canvas)[2] as HTMLElement).getByText("Carol Smith"));
    await expect(args.onRowClick).toHaveBeenLastCalledWith(USERS[2]);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(args.onRowClick).toHaveBeenLastCalledWith(USERS[3]);
  },
};

export const LoadingSkeleton: Story = {
  args: { isLoading: true },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvasElement.querySelector("[data-slot=data-grid-table-container]"),
    ).toHaveAttribute("aria-busy", "true");
    await expect(bodyRows(canvas)).toHaveLength(5);
    await expect(canvas.queryByText("Alice Martin")).toBeNull();
  },
};

export const LoadingSpinner: Story = {
  args: { isLoading: true, loadingMode: "spinner" },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("Alice Martin")).toBeInTheDocument();
    const overlay = canvasElement.querySelector("[data-slot=data-grid-loading]");
    await expect(overlay).toHaveAttribute("role", "status");
    await expect(overlay).toHaveTextContent("Loading...");
  },
};

export const Empty: Story = {
  args: { data: [], emptyMessage: "No users yet." },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No users yet.")).toBeVisible();
    await expect(canvas.getByText("0 - 0 of 8".replace("8", "0"))).toBeInTheDocument();
  },
};

/** Header menus: sorting, pinning, moving and a column visibility submenu. */
export const ColumnMenus: Story = {
  args: {
    layout: {
      columnsPinnable: true,
      columnsMovable: true,
      columnsVisibility: true,
      headerBackground: true,
    },
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const headers = () => canvas.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    const openMenu = async (name: string) => {
      await userEvent.click(canvas.getByRole("button", { name: new RegExp(`^${name}`) }));
      return body().findByRole("menu");
    };

    let menu = await openMenu("Role");
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Descending/ }));
    await expect(canvas.getByRole("columnheader", { name: /Role/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    menu = await openMenu("Role");
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Move left/ }));
    await waitFor(() => expect(headers().slice(0, 3)).toEqual(["ID", "Role", "Name"]));

    menu = await openMenu("Joined");
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Pin to start/ }));
    await waitFor(() => expect(headers()[0]).toBe("Joined"));
    await expect(canvas.getByRole("button", { name: "Unpin Joined column" })).toBeInTheDocument();

    menu = await openMenu("Name");
    await userEvent.click(within(menu).getByRole("menuitem", { name: /^Status/ }));
    await waitFor(() => expect(headers()).not.toContain("Status"));
  },
};

/** A toolbar with a faceted status filter and a column visibility menu. */
export const FilterAndVisibility: Story = {
  args: {
    toolbar: (table) => (
      <div className="flex items-center justify-between">
        <DataGridColumnFilter
          column={table.getColumn("status")}
          title="Status"
          options={STATUS_OPTIONS}
        />
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline" size="sm">
              <Columns3Icon aria-hidden="true" />
              Columns
            </Button>
          }
        />
      </div>
    ),
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Status" }));
    const options = await body().findByRole("listbox", { name: "Status" });
    // Facet counts come from the data.
    await expect(within(options).getByRole("option", { name: /Inactive/ })).toHaveTextContent("2");
    await userEvent.click(within(options).getByRole("option", { name: /Inactive/ }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(bodyRows(canvas)).toHaveLength(2));
    await expect(canvas.getByText("1 - 2 of 2")).toBeInTheDocument();

    // Exact matches: "Active" must not also match "Inactive".
    await userEvent.click(canvas.getByRole("button", { name: /Status/ }));
    const reopened = await body().findByRole("listbox", { name: "Status" });
    await userEvent.click(within(reopened).getByRole("option", { name: /Inactive/ }));
    await userEvent.click(within(reopened).getByRole("option", { name: /^Active/ }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByText("1 - 5 of 5")).toBeInTheDocument());

    await userEvent.click(canvas.getByRole("button", { name: "Columns" }));
    const menu = await body().findByRole("menu");
    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "Role" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("columnheader", { name: /Role/ })).toBeNull());
  },
};

/** `columnsResizable`: drag a header edge, or focus its resizer and use the arrow keys. */
export const Resizable: Story = {
  args: { layout: { columnsResizable: true, cellBorder: true } },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvasElement, canvas }) => {
    const header = canvas.getByRole("columnheader", { name: /^ID/ });
    const before = header.getBoundingClientRect().width;
    const resizer = canvasElement.querySelector<HTMLElement>("[data-resizable-direction]");
    if (!resizer) throw new Error("No column resizer");
    const box = resizer.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    // user-event's pointer moves don't reach react-aria's move handler, so
    // dispatch full pointer events (a real mouse drag works the same way).
    const pointer = (type: string, target: EventTarget, clientX: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX,
          clientY: y,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          isPrimary: true,
        }),
      );
    pointer("pointerdown", resizer, x);
    pointer("pointermove", resizer, x + 30);
    pointer("pointermove", resizer, x + 60);
    pointer("pointerup", resizer, x + 60);
    await waitFor(() => expect(header.getBoundingClientRect().width).toBeGreaterThan(before + 40));
  },
};

function ReorderDemo() {
  const [data, setData] = React.useState(USERS.slice(0, 4));
  const columns: UserColumn[] = [
    { id: "drag", size: 48, header: "", cell: () => <DataGridRowDragHandle /> },
    { accessorKey: "name", header: "Name", size: 200 },
    { accessorKey: "role", header: "Role", size: 200 },
  ];
  const table = useTable({
    features: dataGridFeatures,
    // No pagination: every row is already here.
    manualPagination: true,
    data,
    columns,
    getRowId: (row: User) => row.id,
  });
  return (
    <DataGrid table={table} recordCount={data.length} className="w-[460px]">
      <DataGridContainer>
        <DataGridTable
          aria-label="Users"
          onRowsReorder={(event) => {
            const moved = data.filter((user) => event.keys.has(user.id));
            const rest = data.filter((user) => !event.keys.has(user.id));
            let at = rest.findIndex((user) => user.id === event.target.key);
            if (event.target.dropPosition === "after") at += 1;
            setData([...rest.slice(0, at), ...moved, ...rest.slice(at)]);
          }}
        />
      </DataGridContainer>
    </DataGrid>
  );
}

/** `onRowsReorder` with a `DataGridRowDragHandle`: drag rows, or use the keyboard. */
export const RowReorder: Story = {
  render: () => <ReorderDemo />,
  play: async ({ canvas }) => {
    const names = () =>
      bodyRows(canvas).map((row) => within(row).getByRole("rowheader").textContent);
    await expect(names()).toEqual(["Alice Martin", "Bob Chen", "Carol Smith", "David Kim"]);
    // Keyboard drag: reach the handle through the grid, Enter starts the
    // drag, arrows walk the drop positions, Enter drops.
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toHaveAccessibleName("Drag Alice Martin");
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(document.activeElement).toHaveAccessibleName(
        /Insert between Alice Martin and Bob Chen/,
      ),
    );
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    await waitFor(() =>
      expect(names()).toEqual(["Bob Chen", "Carol Smith", "David Kim", "Alice Martin"]),
    );
  },
};

/** Row pinning keeps pinned rows on top across sorting and pages. */
export const RowPinning: Story = {
  args: {
    columns: [
      ...COLUMNS,
      {
        id: "pin",
        size: 60,
        header: "Pin",
        enableSorting: false,
        cell: ({ row }) => <DataGridRowPin row={row} />,
      },
    ],
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const pin = within(bodyRows(canvas)[3] as HTMLElement).getByRole("button", { name: "Pin row" });
    await userEvent.click(pin);
    await expect(firstCells(canvas)[0]).toBe("USR-004");
    await userEvent.click(canvas.getByRole("button", { name: "Go to next page" }));
    await expect(firstCells(canvas)[0]).toBe("USR-004");
  },
};

/**
 * `DataGridRowActions` puts a row's actions behind a menu button. Pressing it
 * doesn't trigger `onRowClick`; with no actions left (inactive users here) the
 * menu says so.
 */
export const RowActions: Story = {
  args: {
    onRowClick: fn(),
    columns: [
      ...COLUMNS,
      {
        id: "actions",
        size: 60,
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DataGridRowActions rowLabel={row.original.name}>
            {row.original.status !== "Inactive" && (
              <DropdownMenuItem id="edit">Edit</DropdownMenuItem>
            )}
            {row.original.status !== "Inactive" && (
              <DropdownMenuItem id="deactivate" variant="destructive">
                Deactivate
              </DropdownMenuItem>
            )}
          </DataGridRowActions>
        ),
      },
    ],
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas, args }) => {
    const body = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Alice Martin" }));
    await body.findByRole("menuitem", { name: "Edit" });
    await expect(args.onRowClick).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(canvas.getByRole("button", { name: "Actions for Carol Smith" }));
    const empty = await body.findByRole("menuitem", { name: "No actions available" });
    await expect(empty).toHaveAttribute("aria-disabled", "true");
    await expect(args.onRowClick).not.toHaveBeenCalled();
  },
};

/** `DataGridRowPin position="bottom"` pins rows under the page's rows. */
export const RowPinningBottom: Story = {
  args: {
    columns: [
      ...COLUMNS,
      {
        id: "pin",
        size: 60,
        header: "Pin",
        enableSorting: false,
        cell: ({ row }) => <DataGridRowPin row={row} position="bottom" />,
      },
    ],
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const pin = within(bodyRows(canvas)[0] as HTMLElement).getByRole("button", { name: "Pin row" });
    await userEvent.click(pin);
    await expect(firstCells(canvas).at(-1)).toBe("USR-001");
    const pinned = bodyRows(canvas).at(-1) as HTMLElement;
    await expect(pinned).toHaveAttribute("data-row-pinned", "bottom");
    await expect(pinned).toHaveAttribute("data-row-pinned-boundary", "bottom");
    await userEvent.click(canvas.getByRole("button", { name: "Go to next page" }));
    await expect(firstCells(canvas).at(-1)).toBe("USR-001");
  },
};

const MANY = Array.from({ length: 1000 }, (_, i) => ({
  id: `USR-${String(i + 1).padStart(4, "0")}`,
  name: `User ${i + 1}`,
  role: USERS[i % USERS.length]?.role ?? "",
  status: USERS[i % USERS.length]?.status ?? "Active",
  joined: "2024-01-01",
})) satisfies User[];

function VirtualDemo() {
  const table = useTable({
    features: dataGridFeatures,
    // No pagination: every row is already here.
    manualPagination: true,
    data: MANY,
    columns: COLUMNS,
    getRowId: (row: User) => row.id,
  });
  return (
    <DataGrid
      table={table}
      recordCount={MANY.length}
      tableLayout={{ headerSticky: true }}
      className="w-[760px]"
    >
      <DataGridContainer>
        <DataGridTable aria-label="Users" isVirtualized rowHeight={40} className="h-80" />
      </DataGridContainer>
    </DataGrid>
  );
}

/** `isVirtualized` renders only the rows in view; here 1,000 rows. */
export const Virtualized: Story = {
  render: () => <VirtualDemo />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid", { name: "Users" });
    await expect(grid).toHaveAttribute("aria-rowcount", "1001");
    await expect(canvas.getAllByRole("row").length).toBeLessThan(40);
    // Rows scroll under the header, so its cells must paint an opaque background.
    for (const header of canvas.getAllByRole("columnheader")) {
      const { backgroundColor } = getComputedStyle(header);
      await expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      await expect(backgroundColor).not.toMatch(/\/ 0?\.\d+\)$/);
    }
  },
};

/**
 * Many pages: the first page, a run around the current one and the last page,
 * with an ellipsis for each hidden stretch. The row keeps its width as you page.
 */
export const ManyPages: Story = {
  args: { data: MANY },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const nav = within(canvas.getByRole("navigation", { name: "Pagination" }));
    const labels = () =>
      nav
        .getAllByRole("button", { name: /^Page \d+$/ })
        .map((button) => button.textContent?.trim());
    await expect(labels()).toEqual(["1", "2", "3", "4", "5", "...", "200"]);

    await userEvent.click(nav.getByRole("button", { name: "Page 5" }));
    await expect(labels()).toEqual(["1", "...", "4", "5", "6", "...", "200"]);

    await userEvent.click(nav.getByRole("button", { name: "Page 200" }));
    await expect(labels()).toEqual(["1", "...", "196", "197", "198", "199", "200"]);

    // The ellipsis jumps to the middle of the stretch it hides (pages 2-195).
    await userEvent.click(nav.getByRole("button", { name: "Page 98" }));
    await expect(nav.getByRole("button", { name: "Page 98" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(labels()).toEqual(["1", "...", "97", "98", "99", "...", "200"]);
  },
};

/** Layout options: dense rows, cell borders, stripes and a tinted header. */
export const Layout: Story = {
  args: { layout: { dense: true, cellBorder: true, stripped: true, headerBackground: true } },
  render: (args) => <UsersDataGrid {...args} />,
};

/**
 * Dark mode scoped to a subtree (`.dark` on a wrapper, not on <html>): the
 * tinted header follows the dark tokens instead of the page's light ones.
 */
export const ScopedDarkHeader: Story = {
  args: { layout: { headerBackground: true } },
  render: (args) => (
    <div className="dark rounded-lg bg-background p-2 text-foreground">
      <UsersDataGrid {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    for (const header of canvas.getAllByRole("columnheader")) {
      ctx.fillStyle = getComputedStyle(header).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      // Dark background (~10) tinted by muted (~37) at 40%: around 21.
      await expect(Math.max(r, g, b)).toBeLessThan(40);
    }
  },
};

/**
 * `renderExpandedRow` adds a full-width row under each expanded row;
 * `DataGridRowExpand` toggles it (rows expand when `getRowCanExpand` allows).
 */
export const ExpandableRows: Story = {
  args: { expandable: true, selectable: true },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const [toggle] = canvas.getAllByRole("button", { name: "Expand row" });
    if (!toggle) throw new Error("no expand button");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    const details = await canvas.findByText(/Alice Martin has been a Frontend Engineer/);
    const detailsRow = details.closest("[role=row]") as HTMLElement;
    await expect(detailsRow).toHaveAttribute("data-slot", "data-grid-expanded-row");
    // One cell spanning every column, and no selection checkbox.
    await expect(within(detailsRow).getAllByRole("gridcell")).toHaveLength(1);
    await expect(within(detailsRow).queryByRole("checkbox")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Collapse row" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // "Select all" selects the page's rows, not the details row.
    await userEvent.click(canvas.getAllByRole("checkbox")[0] as HTMLElement);
    await expect(detailsRow).not.toHaveAttribute("aria-selected", "true");
    await waitFor(() =>
      expect(
        canvas.getAllByRole("row").filter((row) => row.getAttribute("aria-selected") === "true"),
      ).toHaveLength(5),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Collapse row" }));
    await waitFor(() =>
      expect(canvas.queryByText(/Alice Martin has been a Frontend Engineer/)).toBeNull(),
    );
  },
};

/** With `columnsDraggable`, dropping a header on another moves the column to that side. */
export const DraggableColumns: Story = {
  args: { layout: { columnsDraggable: true } },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const titles = () =>
      canvas.getAllByRole("columnheader").map((header) => header.textContent?.trim());
    await expect(titles()).toEqual(["ID", "Name", "Role", "Status", "Joined"]);
    const area = (name: string) =>
      canvas
        .getByRole("columnheader", { name })
        .querySelector("[data-slot=data-grid-column-drag-area]") as HTMLElement;

    // Native drag and drop, as the browser fires it.
    const drag = (source: HTMLElement, target: HTMLElement, side: "start" | "end") => {
      const box = target.getBoundingClientRect();
      const init = {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
        clientX: side === "start" ? box.left + 4 : box.right - 4,
        clientY: box.top + box.height / 2,
      };
      source.dispatchEvent(new DragEvent("dragstart", init));
      for (const type of ["dragenter", "dragover", "drop"])
        target.dispatchEvent(new DragEvent(type, init));
      source.dispatchEvent(new DragEvent("dragend", init));
    };

    drag(area("Role"), area("ID"), "start");
    await waitFor(() => expect(titles()).toEqual(["Role", "ID", "Name", "Status", "Joined"]));
    drag(area("Role"), area("Joined"), "end");
    await waitFor(() => expect(titles()).toEqual(["ID", "Name", "Status", "Joined", "Role"]));

    // Pressing a header still sorts.
    const name = canvas.getByRole("columnheader", { name: /Name/ });
    await userEvent.click(name);
    await expect(name).toHaveAttribute("aria-sort", "ascending");
  },
};

/**
 * Pinned columns stick to their side with a divider on the group's inner
 * edge; with `columnsDraggable` they keep their place (no drag area).
 */
export const PinnedColumns: Story = {
  args: {
    layout: { columnsDraggable: true, columnsPinnable: true },
    initialPinning: { start: ["id"], end: ["joined"] },
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const id = canvas.getByRole("columnheader", { name: /^ID/ });
    const joined = canvas.getByRole("columnheader", { name: /^Joined/ });
    await expect(id).toHaveAttribute("data-pinned", "start");
    await expect(id).toHaveAttribute("data-last-col", "start");
    await expect(joined).toHaveAttribute("data-pinned", "end");
    await expect(joined).toHaveAttribute("data-last-col", "end");
    await expect(getComputedStyle(id).borderInlineEndWidth).toBe("1px");
    await expect(getComputedStyle(joined).borderInlineStartWidth).toBe("1px");

    const cell = within(bodyRows(canvas)[0] as HTMLElement).getByText("USR-001");
    await expect(cell.closest("[data-pinned]")).toHaveAttribute("data-pinned", "start");
    // Body cells scroll under pinned ones, so those paint an opaque background.
    await expect(
      getComputedStyle(cell.closest("[data-pinned]") as HTMLElement).backgroundColor,
    ).not.toBe("rgba(0, 0, 0, 0)");

    await expect(id.querySelector("[data-slot=data-grid-column-drag-area]")).toBeNull();
    await expect(joined.querySelector("[data-slot=data-grid-column-drag-area]")).toBeNull();
    await expect(
      canvas
        .getByRole("columnheader", { name: /^Name/ })
        .querySelector("[data-slot=data-grid-column-drag-area]"),
    ).not.toBeNull();
  },
};

type FileNode = { id: string; name: string; size: string; children?: FileNode[] };

const FILES: FileNode[] = [
  {
    id: "src",
    name: "src",
    size: "48 KB",
    children: [
      {
        id: "src/core",
        name: "core",
        size: "40 KB",
        children: [{ id: "src/core/button.tsx", name: "button.tsx", size: "4 KB" }],
      },
      { id: "src/index.ts", name: "index.ts", size: "1 KB" },
    ],
  },
  { id: "package.json", name: "package.json", size: "2 KB" },
];

const FILE_COLUMNS: ColumnDef<DataGridFeatures, FileNode>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 260,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <DataGridRowExpand row={row} />
        {row.original.name}
      </div>
    ),
  },
  { accessorKey: "size", header: "Size", size: 120 },
];

function TreeDemo() {
  const table = useTable({
    features: dataGridFeatures,
    manualPagination: true,
    data: FILES,
    columns: FILE_COLUMNS,
    getRowId: (row: FileNode) => row.id,
    getSubRows: (row: FileNode) => row.children,
  });
  return (
    <DataGrid table={table} recordCount={FILES.length} className="w-[420px]">
      <DataGridContainer>
        <DataGridTable aria-label="Files" />
      </DataGridContainer>
    </DataGrid>
  );
}

/**
 * Tree rows: `getSubRows` with `DataGridRowExpand` in the label cell, which
 * indents by depth and leaves a spacer on leaves.
 */
export const TreeRows: Story = {
  render: () => <TreeDemo />,
  play: async ({ canvas }) => {
    const names = () => bodyRows(canvas).map((row) => row.textContent?.replace(/\d+ KB$/, ""));
    await expect(names()).toEqual(["src", "package.json"]);

    await userEvent.click(canvas.getByRole("button", { name: "Expand row" }));
    await expect(names()).toEqual(["src", "core", "index.ts", "package.json"]);
    const core = bodyRows(canvas)[1] as HTMLElement;
    await expect(core).toHaveAttribute("data-depth", "1");
    await expect(core.querySelector("[data-slot=data-grid-table-row-expand]")).toHaveStyle({
      paddingInlineStart: "20px",
    });

    await userEvent.click(within(core).getByRole("button", { name: "Expand row" }));
    await expect(names()).toEqual(["src", "core", "button.tsx", "index.ts", "package.json"]);
    await expect(bodyRows(canvas)[2]).toHaveAttribute("data-depth", "2");

    await userEvent.click(within(bodyRows(canvas)[0] as HTMLElement).getByRole("button"));
    await expect(names()).toEqual(["src", "package.json"]);
  },
};

/** `footerContent` renders footer rows (`<tfoot>`), here a count spanning the columns. */
export const Footer: Story = {
  args: {
    layout: { footerBackground: true },
    footer: (table) => (
      <DataGridTableFootRow>
        <DataGridTableFootRowCell colSpan={3}>Active users</DataGridTableFootRowCell>
        <DataGridTableFootRowCell colSpan={2}>
          {
            table.getFilteredRowModel().rows.filter((row) => row.original.status === "Active")
              .length
          }
        </DataGridTableFootRowCell>
      </DataGridTableFootRow>
    ),
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvasElement, canvas }) => {
    const foot = canvasElement.querySelector("tfoot[data-slot=data-grid-table-foot]");
    if (!foot) throw new Error("no tfoot");
    // The first cell spans the row header column, so it is the row's header.
    const cells = [...foot.querySelectorAll("[role=rowheader], [role=gridcell]")];
    await expect(cells.map((cell) => cell.textContent)).toEqual(["Active users", "5"]);
    await expect(cells[0]).toHaveAttribute("colspan", "3");
    // Footer rows are not data rows: the body still holds the page.
    await expect(canvasElement.querySelectorAll("tbody [role=row]")).toHaveLength(5);
    await expect(canvas.getByText("1 - 5 of 8")).toBeInTheDocument();
  },
};

const PT_BR: DataGridI18nOverrides = {
  labels: {
    sortAscending: "Crescente",
    sortDescending: "Decrescente",
    pinColumnStart: "Fixar no início",
    pinColumnEnd: "Fixar no fim",
    moveColumnLeft: "Mover para a esquerda",
    moveColumnRight: "Mover para a direita",
    rowsPerPage: "Linhas por página",
    paginationInfo: ({ from, to, count }) => `${from}–${to} de ${count}`,
    previousPage: "Página anterior",
    nextPage: "Próxima página",
    goToPage: (page) => `Página ${page}`,
    empty: "Nenhum registro",
  },
};

/** One `i18n` prop replaces the built-in strings: menus, aria labels and pagination. */
export const Localized: Story = {
  args: { i18n: PT_BR, layout: { columnsPinnable: true, columnsMovable: true } },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1–5 de 8")).toBeInTheDocument();
    await expect(canvas.getByText("Linhas por página")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Próxima página" }));
    await expect(canvas.getByRole("button", { name: "Página 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(canvas.getByRole("button", { name: /^Role/ }));
    const menu = await body().findByRole("menu");
    for (const name of ["Crescente", "Decrescente", "Fixar no início", "Mover para a direita"])
      await expect(
        within(menu).getByRole("menuitem", { name: new RegExp(name) }),
      ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
  },
};

const PAGE = 20;

function InfiniteUsersDataGrid({ virtualized }: { virtualized?: boolean }) {
  const [data, setData] = React.useState(() => MANY.slice(0, PAGE));
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const hasMore = data.length < 3 * PAGE;
  const table = useTable({
    features: dataGridFeatures,
    manualPagination: true,
    data,
    columns: COLUMNS,
    getRowId: (row: User) => row.id,
  });
  const fetchMore = () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    // Stands in for a request to the server.
    setTimeout(() => {
      setData((current) => MANY.slice(0, current.length + PAGE));
      setIsFetchingMore(false);
    }, 300);
  };
  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      tableLayout={{ headerSticky: true }}
      className="w-[760px]"
    >
      <DataGridContainer>
        <DataGridTable
          aria-label="Users"
          isVirtualized={virtualized}
          className="h-80"
          onFetchMore={fetchMore}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
        />
      </DataGridContainer>
      <output data-testid="loaded" className="sr-only">
        {data.length}
      </output>
    </DataGrid>
  );
}

const scrollToEnd = async (canvasElement: HTMLElement, loaded: number) => {
  const scroller = canvasElement.querySelector(
    "[data-slot=data-grid-table-viewport]",
  ) as HTMLElement;
  scroller.scrollTop = scroller.scrollHeight;
  scroller.dispatchEvent(new Event("scroll"));
  await waitFor(
    () => expect(within(canvasElement).getByTestId("loaded")).toHaveTextContent(String(loaded)),
    { timeout: 3000 },
  );
};

/**
 * Infinite scroll: `onFetchMore` fires near the end of the loaded rows,
 * `isFetchingMore` shows a loading row and `hasMore={false}` ends the list.
 */
export const InfiniteScroll: Story = {
  render: () => <InfiniteUsersDataGrid />,
  play: async ({ canvasElement, canvas }) => {
    await expect(canvas.getByTestId("loaded")).toHaveTextContent("20");
    await scrollToEnd(canvasElement, 40);
    await scrollToEnd(canvasElement, 60);
    await expect(await canvas.findByText("All records loaded")).toBeInTheDocument();
  },
};

/** Infinite scroll over a virtualized body. */
export const InfiniteScrollVirtualized: Story = {
  render: () => <InfiniteUsersDataGrid virtualized />,
  play: async ({ canvasElement, canvas }) => {
    await scrollToEnd(canvasElement, 40);
    await scrollToEnd(canvasElement, 60);
    await scrollToEnd(canvasElement, 60);
    await expect(await canvas.findByText("All records loaded")).toBeInTheDocument();
  },
};

/** `tableClassNames` styles parts of the table; `rowRounded` and `headerBorder` adjust the chrome. */
export const ClassNames: Story = {
  args: {
    layout: { rowRounded: true, rowBorder: false, headerBorder: false, stripped: true },
    tableClassNames: {
      base: "demo-base",
      header: "demo-header",
      body: "demo-body",
      bodyRow: "demo-row",
      edgeCell: "demo-edge",
    },
  },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid", { name: "Users" });
    await expect(grid).toHaveClass("demo-base");
    await expect(grid.querySelector("thead")).toHaveClass("demo-header");
    await expect(grid.querySelector("tbody")).toHaveClass("demo-body");
    const [row] = bodyRows(canvas);
    if (!row) throw new Error("no rows");
    await expect(row).toHaveClass("demo-row");
    const cells = [...row.children] as HTMLElement[];
    await expect(cells[0]).toHaveClass("demo-edge");
    await expect(cells.at(-1)).toHaveClass("demo-edge");
    await expect(cells[1]).not.toHaveClass("demo-edge");
    // Rounded rows round their edge cells; no border under the header.
    await expect(getComputedStyle(cells[0] as HTMLElement).borderStartStartRadius).not.toBe("0px");
    for (const header of canvas.getAllByRole("columnheader"))
      await expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
  },
};

/** `columnsResizeMode: "onEnd"` commits the width to the table once, on release. */
export const ResizeOnEnd: Story = {
  args: { layout: { columnsResizable: true, columnsResizeMode: "onEnd", cellBorder: true } },
  render: (args) => <UsersDataGrid {...args} />,
  play: async ({ canvasElement, canvas }) => {
    const header = canvas.getByRole("columnheader", { name: /^ID/ });
    const before = header.getBoundingClientRect().width;
    const resizer = canvasElement.querySelector<HTMLElement>("[data-resizable-direction]");
    if (!resizer) throw new Error("No column resizer");
    const box = resizer.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const pointer = (type: string, clientX: number) =>
      resizer.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          clientX,
          clientY: y,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          isPrimary: true,
        }),
      );
    const sizing = canvas.getByTestId("sizing");
    pointer("pointerdown", x);
    pointer("pointermove", x + 30);
    pointer("pointermove", x + 60);
    // Mid-drag the column keeps its width; a line marks where its edge lands.
    const indicator = canvasElement.querySelector<HTMLElement>(
      "[data-slot=data-grid-table-resize-indicator]",
    );
    await waitFor(() => expect(indicator).toBeVisible());
    const edge = (indicator as HTMLElement).getBoundingClientRect().left;
    await expect(edge).toBeGreaterThan(header.getBoundingClientRect().right + 40);
    await expect(header.getBoundingClientRect().width).toBe(before);
    await expect(sizing).toHaveTextContent(/^$/);

    pointer("pointerup", x + 60);
    await waitFor(() => expect(Number(sizing.textContent)).toBeGreaterThan(before + 40));
    await expect(header.getBoundingClientRect().width).toBeGreaterThan(before + 40);
    await expect(indicator).not.toBeVisible();
  },
};
