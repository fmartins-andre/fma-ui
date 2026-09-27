import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import meta from "./meta.json";

// Base UI (@base-ui/react/drawer), not react-aria-components — upstream
// hasn't ported this one to the aria base yet either.
const componentMeta = {
  title: "ui/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    onOpenChange: fn(),
  },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Submit
          </DrawerClose>
          <DrawerClose className="hover:underline">Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
} satisfies Meta<typeof Drawer>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const OpensAndClosesWithSubmit: Story = {
  play: async ({ args, canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvasBody.findByRole("button", { name: /open/i }));
    await expect(args.onOpenChange).toHaveBeenCalled();
    expect(await canvasBody.findByRole("dialog")).toHaveAttribute("data-open");

    await userEvent.click(await canvasBody.findByRole("button", { name: /submit/i }), {
      delay: 100,
    });
    await expect(args.onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    await waitFor(async () => {
      expect(await canvasBody.findByRole("dialog")).toHaveAttribute("data-closed");
    });
  },
};
