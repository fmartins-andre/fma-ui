import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
  args: {
    variant: "default",
    children: "Badge",
  },
} satisfies Meta<typeof Badge>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map(
        (variant) => (
          <Badge {...args} key={variant} variant={variant}>
            {variant}
          </Badge>
        ),
      )}
    </div>
  ),
};

export const AsLink: Story = {
  render: (args) => (
    <Badge {...args} render={(props) => <a href="https://ui.fmartinsandre.dev" {...props} />}>
      Clickable
    </Badge>
  ),
};
