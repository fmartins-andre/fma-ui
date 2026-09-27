import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Label } from "../label/label";
import meta from "./meta.json";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const componentMeta = {
  title: "ui/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    isDisabled: { control: "boolean" },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  args: {
    defaultValue: "default",
    onChange: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

// RadioGroupItem's own children slot is for a custom indicator override, not
// label text — passing long text there crams it into the fixed size-4 box.
// The real pattern pairs each item with an external Label via id/htmlFor,
// laid out as a flex row.
export const Default: Story = {
  parameters: {
    docs: { description: { story: "Three mutually-exclusive options, one selected by default." } },
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="r-default" />
        <Label htmlFor="r-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="r-comfortable" />
        <Label htmlFor="r-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="r-compact" />
        <Label htmlFor="r-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  parameters: {
    docs: { description: { story: "isDisabled on the whole group blocks every item." } },
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="rd-default" />
        <Label htmlFor="rd-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="rd-comfortable" />
        <Label htmlFor="rd-comfortable">Comfortable</Label>
      </div>
    </RadioGroup>
  ),
};

export const Interactive: Story = {
  parameters: {
    docs: { description: { story: "Verifies onChange fires with the newly selected value." } },
  },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="ri-default" />
        <Label htmlFor="ri-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="ri-comfortable" />
        <Label htmlFor="ri-comfortable">Comfortable</Label>
      </div>
    </RadioGroup>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Comfortable" }));
    expect(args.onChange).toHaveBeenCalledWith("comfortable");
  },
};
