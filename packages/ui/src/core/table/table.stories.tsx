import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/tabs";
import meta from "./meta.json";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const invoices = [
  { invoice: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
  { invoice: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
  { invoice: "INV003", status: "Unpaid", method: "Bank Transfer", amount: "$350.00" },
];

const componentMeta = {
  title: "ui/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Table>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: () => (
    <Table aria-label="Invoices">
      <TableCaption>A list of your recent invoices.</TableCaption>
      {/* react-aria: columns go straight into TableHeader, with no TableRow around them. */}
      <TableHeader>
        <TableHead isRowHeader>Invoice</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Method</TableHead>
        <TableHead>Amount</TableHead>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice} id={row.invoice}>
            <TableCell>{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell>{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// Regression: wrapping the columns in a TableRow (shadcn's markup) throws
// "Cell count must match column count" once the table sits inside another
// react-aria collection, such as a Tabs panel.
export const InsideTabs: Story = {
  render: () => (
    <Tabs defaultSelectedKey="invoices">
      <TabsList>
        <TabsTrigger id="invoices">Invoices</TabsTrigger>
        <TabsTrigger id="other">Other</TabsTrigger>
      </TabsList>
      <TabsContent id="invoices">
        <Table aria-label="Invoices">
          <TableHeader>
            <TableHead isRowHeader>Invoice</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {invoices.map((row) => (
              <TableRow key={row.invoice} id={row.invoice}>
                <TableCell>{row.invoice}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent id="other">Other</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole("grid", { name: "Invoices" });
    await expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    await expect(within(table).getAllByRole("row")).toHaveLength(invoices.length + 1);
  },
};
