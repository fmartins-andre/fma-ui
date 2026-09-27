import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { HoverCard, HoverCardTrigger } from "./hover-card";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
  },
  args: {
    placement: "bottom",
  },
} satisfies Meta<typeof HoverCard>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "Hover or focus the trigger to reveal the preview card." } },
  },
  render: (args) => (
    <HoverCardTrigger>
      <Button variant="link">@fmartinsandre</Button>
      <HoverCard {...args}>
        <div className="flex flex-col gap-1">
          <p className="font-medium">@fmartinsandre</p>
          <p className="text-muted-foreground">Personal shadcn-compatible component registry.</p>
        </div>
      </HoverCard>
    </HoverCardTrigger>
  ),
};
