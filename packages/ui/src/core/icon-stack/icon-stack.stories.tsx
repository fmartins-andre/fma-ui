import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarIcon, InboxIcon } from "lucide-react";
import { expect } from "storybook/test";
import { Button } from "@/core/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/core/empty/empty";
import { IconStack } from "./icon-stack";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/IconStack",
  component: IconStack,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: {
    children: <CalendarIcon className="size-5" aria-hidden="true" />,
  },
} satisfies Meta<typeof IconStack>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Purely decorative: nothing in the stack is exposed to assistive tech.
    const stack = canvasElement.querySelector("[data-slot=icon-stack]");
    await expect(stack?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(stack?.querySelector("[data-slot=icon-stack-content] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
};

/** Just the three layered cards. */
export const NoGlyph: Story = {
  args: { children: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[data-slot=icon-stack-content]")).toBeNull();
  },
};

/** Any icon works as the glyph. A text color class retints the whole stack. */
export const CustomGlyph: Story = {
  args: {
    className: "text-primary",
    children: <InboxIcon className="size-5" aria-hidden="true" />,
  },
};

/** As the visual of an `Empty` state, inside `EmptyMedia`. */
export const InEmptyState: Story = {
  render: (args) => (
    <Empty className="w-96 border">
      <EmptyHeader>
        <EmptyMedia>
          <IconStack {...args} />
        </EmptyMedia>
        <EmptyTitle>No events</EmptyTitle>
        <EmptyDescription>Nothing is scheduled for this period.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">New event</Button>
      </EmptyContent>
    </Empty>
  ),
};
