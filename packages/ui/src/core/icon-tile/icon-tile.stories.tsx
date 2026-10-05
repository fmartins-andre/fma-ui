import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheckIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react";
import { expect } from "storybook/test";
import { IconTile } from "./icon-tile";
import meta from "./meta.json";

const VARIANTS = ["outline", "elevated", "soft", "solid", "frame"] as const;
const SIZES = ["xs", "sm", "default", "lg", "xl"] as const;

const componentMeta = {
  title: "ui/IconTile",
  component: IconTile,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "select", options: SIZES },
    radius: { control: "radio", options: ["default", "full"] },
  },
  args: {
    variant: "outline",
    size: "default",
    radius: "default",
    children: <SparklesIcon />,
  },
} satisfies Meta<typeof IconTile>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {VARIANTS.map((variant) => (
        <IconTile key={variant} {...args} variant={variant} aria-label={variant} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const variant of VARIANTS) {
      await expect(canvas.getByLabelText(variant)).toHaveAttribute("data-variant", variant);
    }
  },
};

/** The glyph scales with the tile through `--icon-tile-icon-size`. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      {SIZES.map((size) => (
        <IconTile key={size} {...args} size={size} data-testid={size} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const width = (size: string) => canvas.getByTestId(size).getBoundingClientRect().width;
    // xs → xl: 24, 32, 40, 48, 56px.
    await expect(SIZES.map(width)).toEqual([24, 32, 40, 48, 56]);
  },
};

/** `full` makes the tile circular. */
export const RadiusFull: Story = {
  args: { radius: "full", variant: "soft" },
};

/** `soft` and `solid` follow `currentColor`: one text color class retints the tile. */
export const Tones: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconTile {...args} variant="soft" className="text-success">
        <CircleCheckIcon />
      </IconTile>
      <IconTile {...args} variant="soft" className="text-warning">
        <TriangleAlertIcon />
      </IconTile>
      <IconTile {...args} variant="solid" className="bg-success text-background">
        <CircleCheckIcon />
      </IconTile>
      <IconTile {...args} variant="solid" className="bg-destructive text-background">
        <TriangleAlertIcon />
      </IconTile>
    </div>
  ),
};
