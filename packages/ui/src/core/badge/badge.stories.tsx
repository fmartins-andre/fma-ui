import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import meta from "./meta.json";

const TONES = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "destructive",
  "invert",
] as const;

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "info",
  "success",
  "warning",
  "destructive",
  "invert",
  ...TONES.map((tone) => `${tone}-light` as const),
  ...TONES.map((tone) => `${tone}-outline` as const),
] as const;

const SIZES = ["xs", "sm", "default", "lg", "xl"] as const;

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
      options: VARIANTS,
    },
    size: { control: "radio", options: SIZES },
    radius: { control: "radio", options: ["default", "full"] },
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
      {(["default", "secondary", "outline", "ghost", "link"] as const).map((variant) => (
        <Badge {...args} key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const Semantic: Story = {
  parameters: {
    docs: {
      description: {
        story: "Each tone in solid, `-light` and `-outline` styles, driven by the status tokens.",
      },
    },
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(["info", "success", "warning", "destructive", "invert"] as const).map((tone) => (
        <div key={tone} className="flex gap-2">
          <Badge {...args} variant={tone}>
            {tone}
          </Badge>
          <Badge {...args} variant={`${tone}-light`}>
            {tone}-light
          </Badge>
          <Badge {...args} variant={`${tone}-outline`}>
            {tone}-outline
          </Badge>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      {SIZES.map((size) => (
        <Badge {...args} key={size} size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
};

export const Radius: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <Badge {...args} radius="default">
        default
      </Badge>
      <Badge {...args} radius="full">
        full
      </Badge>
    </div>
  ),
};

export const AsLink: Story = {
  render: (args) => (
    <Badge {...args} render={(props) => <a href="https://example.com" {...props} />}>
      Clickable
    </Badge>
  ),
};
