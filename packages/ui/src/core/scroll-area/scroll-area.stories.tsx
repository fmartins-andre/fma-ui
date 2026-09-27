import type { Meta, StoryObj } from "@storybook/react-vite";
import meta from "./meta.json";
import { ScrollArea } from "./scroll-area";

const componentMeta = {
  title: "ui/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof ScrollArea>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "A long list clipped to a fixed height, scrollable within it." },
    },
  },
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </ScrollArea>
  ),
};
