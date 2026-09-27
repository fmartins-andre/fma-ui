import type { Meta, StoryObj } from "@storybook/react-vite";
import { DirectionProvider } from "./direction";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/DirectionProvider",
  component: DirectionProvider,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    direction: "ltr",
    // `render` builds its own JSX children below — this placeholder only
    // satisfies DirectionProvider's required `children` prop type for CSF3.
    children: null,
  },
  render: (args) => (
    <DirectionProvider {...args}>
      <p dir={args.direction} className="max-w-sm text-sm">
        This text and any react-aria-components descendants (menus, sliders, etc.) read their text
        direction from this provider.
      </p>
    </DirectionProvider>
  ),
} satisfies Meta<typeof DirectionProvider>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const LeftToRight: Story = {};

export const RightToLeft: Story = {
  args: { direction: "rtl" },
};
