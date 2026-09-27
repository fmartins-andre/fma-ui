import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input/input";
import { Label } from "./label";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Label>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  args: { children: "Email", htmlFor: "email" },
  parameters: {
    docs: { description: { story: "A bare label with an htmlFor pointing at a control's id." } },
  },
};

export const WithInput: Story = {
  parameters: {
    docs: {
      description: { story: "The real pairing: Label + Input linked by matching id/htmlFor." },
    },
  },
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
