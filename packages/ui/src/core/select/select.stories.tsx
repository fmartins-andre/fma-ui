import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const componentMeta = {
  title: "ui/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Select>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "Verifies picking an option updates the trigger's displayed value." },
    },
  },
  render: () => (
    <Select placeholder="Select a fruit" aria-label="Fruit">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem id="apple">Apple</SelectItem>
          <SelectItem id="banana">Banana</SelectItem>
          <SelectItem id="blueberry">Blueberry</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    await userEvent.click(trigger);
    const option = await within(document.body).findByRole("option", { name: "Banana" });
    await userEvent.click(option);
    expect(trigger).toHaveTextContent("Banana");
  },
};

export const Disabled: Story = {
  parameters: {
    docs: { description: { story: "isDisabled prevents opening the popover." } },
  },
  render: () => (
    <Select placeholder="Select a fruit" aria-label="Fruit" isDisabled>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem id="apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  ),
};
