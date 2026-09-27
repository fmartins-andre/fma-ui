import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import meta from "./meta.json";
import { Textarea } from "./textarea";

const componentMeta = {
  title: "ui/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    placeholder: "Type your message here.",
  },
} satisfies Meta<typeof Textarea>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithButton: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm gap-2">
      <Textarea {...args} />
      <Button>Send Message</Button>
    </div>
  ),
};
