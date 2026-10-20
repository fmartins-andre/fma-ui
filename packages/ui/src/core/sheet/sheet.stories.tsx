import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import meta from "./meta.json";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const componentMeta = {
  title: "ui/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  // Sheet's own `children` prop is required (not optional) — every story below
  // overrides via `render`, so this default is only here to satisfy that type.
  args: { children: null },
} satisfies Meta<typeof Sheet>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "Opens from the right (the default side) with header and footer." },
    },
  },
  render: (args) => (
    <SheetTrigger>
      <Button variant="outline">Open sheet</Button>
      <Sheet {...args}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile here.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Save</SheetClose>
        </SheetFooter>
      </Sheet>
    </SheetTrigger>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open sheet" });
    await userEvent.click(trigger);
    // The sheet enters with a transition — the title lands in the DOM before
    // it's actually visible, so the visibility check needs its own retry too.
    const body = within(document.body);
    await waitFor(() => expect(body.getByText("Edit profile")).toBeVisible());
  },
};

export const Left: Story = {
  args: { side: "left" },
  parameters: {
    docs: { description: { story: 'side="left" for a navigation-drawer style sheet.' } },
  },
  render: (args) => (
    <SheetTrigger>
      <Button variant="outline">Open from left</Button>
      <Sheet {...args}>
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
      </Sheet>
    </SheetTrigger>
  ),
};

const SIZES = [
  { size: "sm", description: "The default: forms and short lists." },
  { size: "md", description: "Filters and a cart." },
  { size: "lg", description: "Dense content: a correction form, an event history." },
] as const;

/**
 * `size` caps a left/right sheet from the `sm` breakpoint up (`sm` 384px, `md`
 * 448px, `lg` 672px); below it the sheet takes 3/4 of the screen. A width in
 * `className` replaces the cap. No effect on top/bottom sheets.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {SIZES.map(({ size, description }) => (
        <SheetTrigger key={size}>
          <Button variant="outline">Open {size}</Button>
          <Sheet {...args} size={size}>
            <SheetHeader>
              <SheetTitle>Size {size}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
          </Sheet>
        </SheetTrigger>
      ))}
      <SheetTrigger>
        <Button variant="outline">Open custom</Button>
        <Sheet {...args} className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Custom width</SheetTitle>
            <SheetDescription>A width in className replaces the size.</SheetDescription>
          </SheetHeader>
        </Sheet>
      </SheetTrigger>
    </div>
  ),
  play: async ({ canvas }) => {
    const body = within(document.body);
    const widths = { sm: 384, md: 448, lg: 672, custom: 576 };
    for (const [name, width] of Object.entries(widths)) {
      await userEvent.click(canvas.getByRole("button", { name: `Open ${name}` }));
      const sheet = await body.findByRole("dialog");
      const panel = sheet.closest("[data-slot=sheet-content]");
      await waitFor(() => expect(panel?.getBoundingClientRect().width).toBe(width));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
  },
};
