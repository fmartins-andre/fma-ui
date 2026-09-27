import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlusIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/button";
import meta from "./meta.json";
import { Tooltip, TooltipTrigger } from "./tooltip";

const componentMeta = {
  title: "ui/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
  },
  args: {
    placement: "top",
    children: "Add to library",
  },
  // TooltipTrigger is required context — a bare <Tooltip> without it won't work.
  render: (args) => (
    <TooltipTrigger>
      <Button variant="outline" size="icon">
        <PlusIcon />
        <span className="sr-only">Add</span>
      </Button>
      <Tooltip {...args} />
    </TooltipTrigger>
  ),
} satisfies Meta<typeof Tooltip>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Bottom: Story = {
  args: { placement: "bottom" },
};

export const Left: Story = {
  args: { placement: "left" },
};

export const Right: Story = {
  args: { placement: "right" },
};

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /add/i });
    // Hover simulation is flaky in headless browser automation — react-aria's
    // TooltipTrigger opens on focus too, which is reliable to test directly.
    await userEvent.tab();
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.body.querySelector('[data-slot="tooltip-content"]'),
      ).toBeVisible(),
    );
    trigger.blur();
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.body.querySelector('[data-slot="tooltip-content"]'),
      ).not.toBeInTheDocument(),
    );
  },
};
