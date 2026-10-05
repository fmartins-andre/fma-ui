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
import { Skeleton } from "@/core/skeleton/skeleton";
import {
  DataGrid,
  DataGridColumnFilter,
  DataGridColumnHeader,
  DataGridColumnVisibility,
  DataGridContainer,
  type DataGridFeatures,
  type DataGridLayout,
  DataGridPagination,
  DataGridRowDragHandle,
  DataGridRowPin,
  DataGridRowSelect,
  DataGridTable,
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

type DemoProps = {
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
};

function Demo({
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
}: DemoProps) {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    start: [],
    end: [],
  });
  const [rowPinning, setRowPinning] = React.useState<RowPinningState>({ top: [], bottom: [] });

  const table = useTable({
    features: dataGridFeatures,
    data,
    columns: selectable ? [SELECT_COLUMN, ...columns] : columns,
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
      className="w-[760px]"
    >
      {toolbar?.(table)}
      <DataGridContainer>
        <DataGridTable aria-label="Users" />
      </DataGridContainer>
      <DataGridPagination />
      <output data-testid="selection" className="sr-only">
        {Object.keys(rowSelection).sort().join(",")}
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
type Story = StoryObj<typeof Demo>;

const body = () => within(document.body);
const bodyRows = (canvas: ReturnType<typeof within>): HTMLElement[] =>
  canvas.getAllByRole("row").slice(1);
const firstCells = (canvas: ReturnType<typeof within>) =>
  bodyRows(canvas).map((row) => within(row).getAllByRole("rowheader")[0]?.textContent);

export const Default: Story = {
  render: (args) => <Demo {...args} />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid", { name: "Users" });
    await expect(grid).toBeInTheDocument();
    await expect(bodyRows(canvas)).toHaveLength(5);
    await expect(canvas.getByText("1 - 5 of 8")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(bodyRows(canvas)).toHaveLength(3);
    await expect(canvas.getByText("6 - 8 of 8")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(canvas.getByRole("button", { name: /Rows per page/ }));
    await userEvent.click(await body().findByRole("option", { name: "10" }));
    await expect(bodyRows(canvas)).toHaveLength(8);
    await expect(canvas.queryByRole("button", { name: "Next page" })).toBeNull();
  },
};

/** Sortable columns sort on press (or Enter on the header) and expose `aria-sort`. */
export const Sorting: Story = {
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
  play: async ({ canvas }) => {
    const selection = canvas.getByTestId("selection");
    const rowCheckbox = within(bodyRows(canvas)[1] as HTMLElement).getByRole("checkbox");
    await userEvent.click(rowCheckbox);
    await expect(selection).toHaveTextContent("USR-002");

    // Select the whole page, then go on: selections on other pages are kept.
    await userEvent.click(canvas.getByRole("checkbox", { name: /select all/i }));
    await expect(selection).toHaveTextContent("USR-001,USR-002,USR-003,USR-004,USR-005");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await userEvent.click(within(bodyRows(canvas)[0] as HTMLElement).getByRole("checkbox"));
    await expect(selection).toHaveTextContent("USR-001,USR-002,USR-003,USR-004,USR-005,USR-006");
  },
};

/** `onRowClick` makes rows actionable by pointer and keyboard. */
export const RowClick: Story = {
  args: { onRowClick: fn() },
  render: (args) => <Demo {...args} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(within(bodyRows(canvas)[2] as HTMLElement).getByText("Carol Smith"));
    await expect(args.onRowClick).toHaveBeenLastCalledWith(USERS[2]);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(args.onRowClick).toHaveBeenLastCalledWith(USERS[3]);
  },
};

export const LoadingSkeleton: Story = {
  args: { isLoading: true },
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Alice Martin")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Loading")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { data: [], emptyMessage: "No users yet." },
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
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
  render: (args) => <Demo {...args} />,
  play: async ({ canvas }) => {
    const pin = within(bodyRows(canvas)[3] as HTMLElement).getByRole("button", { name: "Pin row" });
    await userEvent.click(pin);
    await expect(firstCells(canvas)[0]).toBe("USR-004");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(firstCells(canvas)[0]).toBe("USR-004");
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

/** Layout options: dense rows, cell borders, stripes and a tinted header. */
export const Layout: Story = {
  args: { layout: { dense: true, cellBorder: true, stripped: true, headerBackground: true } },
  render: (args) => <Demo {...args} />,
};
