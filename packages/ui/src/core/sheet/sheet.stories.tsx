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
