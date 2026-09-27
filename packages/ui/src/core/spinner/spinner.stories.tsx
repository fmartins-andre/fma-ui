import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import meta from "./meta.json";
import { Spinner } from "./spinner";

const componentMeta = {
  title: "ui/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Spinner>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "The bare spinning icon at its default size." } },
  },
};

export const WithButton: Story = {
  parameters: {
    docs: { description: { story: "A disabled button showing a loading state." } },
  },
  render: (args) => (
    <Button isDisabled size="sm">
      <Spinner {...args} />
      Loading...
    </Button>
  ),
};
