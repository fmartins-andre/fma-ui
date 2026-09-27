import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Label } from "../label/label";
import { Checkbox } from "./checkbox";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    isDisabled: { control: "boolean" },
    isIndeterminate: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

// Checkbox's own children slot is for a custom indicator/icon override, not
// label text — passing long text there crams it into the fixed size-4 box.
// The real pattern pairs Checkbox with an external Label via id/htmlFor,
// laid out as a flex row.
export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms-disabled" />
      <Label htmlFor="terms-disabled">Accept terms and conditions</Label>
    </div>
  ),
};

// isIndeterminate is a controlled prop, not user-toggleable by clicking — set
// programmatically (e.g. a "select all" checkbox whose children are only
// partially selected).
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="select-all" />
      <Label htmlFor="select-all">Select all</Label>
    </div>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms-interactive" />
      <Label htmlFor="terms-interactive">Accept terms and conditions</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  },
};
