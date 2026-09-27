import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button, LinkButton } from "./button";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    // meta.json (packages/ui/src/core/button/meta.json) is the single source
    // of truth for this description — it also feeds registry.json. Don't
    // duplicate the prose here.
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    isDisabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    onPress: fn(),
  },
} satisfies Meta<typeof Button>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map(
        (variant) => (
          <Button {...args} key={variant} variant={variant}>
            {variant}
          </Button>
        ),
      )}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <Button {...args} key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const AsLink: Story = {
  render: () => (
    <LinkButton href="https://ui.fmartinsandre.dev" variant="outline">
      Visit site
    </LinkButton>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Visit site" });
    expect(link).toHaveAttribute("href", "https://ui.fmartinsandre.dev");
  },
};
