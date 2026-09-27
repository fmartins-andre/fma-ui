import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "./marker";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Marker",
  component: Marker,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "separator", "border"] },
  },
  args: {
    variant: "default",
  },
} satisfies Meta<typeof Marker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "An icon-prefixed status note in a timeline." } },
  },
  render: (args) => (
    <Marker {...args}>
      <MarkerIcon>
        <CheckIcon />
      </MarkerIcon>
      <MarkerContent>Deployed 2 minutes ago</MarkerContent>
    </Marker>
  ),
};

export const Separator: Story = {
  args: { variant: "separator" },
  parameters: {
    docs: {
      description: { story: 'variant="separator" draws rules on both sides, e.g. a date divider.' },
    },
  },
  render: (args) => (
    <Marker {...args}>
      <MarkerContent>Today</MarkerContent>
    </Marker>
  ),
};
