import type { Meta, StoryObj } from "@storybook/react-vite";
import meta from "./meta.json";
import { Skeleton } from "./skeleton";

const componentMeta = {
  title: "ui/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Skeleton>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "An avatar + two text-line skeleton, a common loading-card shape." },
    },
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <Skeleton {...args} className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton {...args} className="h-4 w-[250px]" />
        <Skeleton {...args} className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};
