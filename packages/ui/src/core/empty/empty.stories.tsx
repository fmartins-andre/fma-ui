import type { Meta, StoryObj } from "@storybook/react-vite";
import { InboxIcon } from "lucide-react";
import { Button } from "../button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Empty",
  component: Empty,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Empty>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>Get started by creating your first project.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create project</Button>
      </EmptyContent>
    </Empty>
  ),
};
