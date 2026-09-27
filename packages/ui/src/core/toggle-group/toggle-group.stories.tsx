import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import meta from "./meta.json";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const componentMeta = {
  title: "ui/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    selectionMode: { control: "select", options: ["single", "multiple"] },
  },
  args: {
    selectionMode: "multiple",
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Text formatting">
      <ToggleGroupItem id="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem id="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem id="underline" aria-label="Toggle underline">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

// selectionMode="single" restricts to one exclusive selection, unlike "multiple" (default here).
export const Single: Story = {
  args: { selectionMode: "single" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};
