import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import meta from "./meta.json";
import {
  Popover,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const componentMeta = {
  title: "ui/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Popover>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "Click the trigger to open a floating panel anchored below it." },
    },
  },
  render: () => (
    <PopoverTrigger>
      <Button variant="outline">Open popover</Button>
      <Popover>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
      </Popover>
    </PopoverTrigger>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open popover" });
    await userEvent.click(trigger);
    // Popover enters with a transition — the title lands in the DOM before
    // it's actually visible, so the visibility check needs its own retry too.
    const body = within(document.body);
    await waitFor(() => expect(body.getByText("Dimensions")).toBeVisible());
  },
};
