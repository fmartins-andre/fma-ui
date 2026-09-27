import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./input";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "file"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    placeholder: "you@example.com",
    type: "text",
  },
} satisfies Meta<typeof Input>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    docs: { description: { story: "The native disabled attribute — not isDisabled here." } },
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
  parameters: {
    docs: { description: { story: "aria-invalid switches on the destructive/error styling." } },
  },
};

export const Typing: Story = {
  parameters: {
    docs: { description: { story: "Verifies typed input is reflected as the field's value." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "hello@example.com");
    expect(input).toHaveValue("hello@example.com");
  },
};
