import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./aspect-ratio";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  render: (args) => (
    <div className="w-80">
      <AspectRatio {...args} className="overflow-hidden rounded-md bg-muted">
        <img
          src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
          alt="Landscape"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
} satisfies Meta<typeof AspectRatio>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  args: { ratio: 16 / 9 },
};

export const Square: Story = {
  args: { ratio: 1 },
};

export const Landscape4x3: Story = {
  args: { ratio: 4 / 3 },
};

export const Cinemascope: Story = {
  args: { ratio: 2.35 / 1 },
};
