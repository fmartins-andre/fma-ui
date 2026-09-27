import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select";

const componentMeta = {
  title: "ui/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
    disabled: { control: "boolean" },
  },
  args: {
    size: "default",
  },
} satisfies Meta<typeof NativeSelect>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="next">Next.js</NativeSelectOption>
      <NativeSelectOption value="tanstack">TanStack Start</NativeSelectOption>
      <NativeSelectOption value="remix">Remix</NativeSelectOption>
    </NativeSelect>
  ),
};

export const WithGroups: Story = {
  parameters: {
    docs: { description: { story: "Options grouped under <optgroup> labels." } },
  },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOptGroup label="Frameworks">
        <NativeSelectOption value="next">Next.js</NativeSelectOption>
        <NativeSelectOption value="tanstack">TanStack Start</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Meta-frameworks">
        <NativeSelectOption value="astro">Astro</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};

export const Sizes: Story = {
  parameters: {
    docs: { description: { story: "The default and sm size." } },
  },
  render: () => (
    <div className="flex flex-col items-start gap-3">
      {(["default", "sm"] as const).map((size) => (
        <NativeSelect key={size} size={size}>
          <NativeSelectOption value="next">Next.js</NativeSelectOption>
          <NativeSelectOption value="tanstack">TanStack Start</NativeSelectOption>
        </NativeSelect>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    docs: { description: { story: "The native disabled attribute." } },
  },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="next">Next.js</NativeSelectOption>
    </NativeSelect>
  ),
};

export const Interactive: Story = {
  parameters: {
    docs: { description: { story: "Verifies selecting an option updates the value." } },
  },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="next">Next.js</NativeSelectOption>
      <NativeSelectOption value="tanstack">TanStack Start</NativeSelectOption>
    </NativeSelect>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox");
    await userEvent.selectOptions(select, "tanstack");
    expect(select).toHaveValue("tanstack");
  },
};
