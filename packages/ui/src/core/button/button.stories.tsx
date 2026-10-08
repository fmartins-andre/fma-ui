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
  parameters: {
    docs: { description: { story: "All six visual variants, side by side." } },
  },
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
  parameters: {
    docs: { description: { story: "The size scale, from xs up to lg." } },
  },
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
  parameters: {
    docs: {
      description: {
        story: "isDisabled blocks pointer and keyboard interaction — verified here, not disabled.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    // pointer-events: none (disabled:pointer-events-none) is real CSS here —
    // bypass Testing Library's clickability check, same as clicking would if
    // a user's mouse could somehow still land on it.
    await userEvent.click(button, { pointerEventsCheck: 0 });
    expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Interactive: Story = {
  parameters: {
    docs: { description: { story: "Verifies onPress actually fires on click." } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    expect(args.onPress).toHaveBeenCalledOnce();
  },
};

export const AsLink: Story = {
  parameters: {
    docs: {
      description: {
        story: "LinkButton — the same variants, rendered as a real <a> for link-as-button cases.",
      },
    },
  },
  render: () => (
    <LinkButton href="https://example.com" variant="outline">
      Visit site
    </LinkButton>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Visit site" });
    expect(link).toHaveAttribute("href", "https://example.com");
  },
};
