import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  args: {
    orientation: "horizontal",
  },
} satisfies Meta<typeof ButtonGroup>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Paste</Button>
      <Button variant="outline">Cut</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Paste</Button>
      <Button variant="outline">Cut</Button>
    </ButtonGroup>
  ),
};

export const WithSeparatorAndText: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Bold</Button>
      <Button variant="outline">Italic</Button>
      <ButtonGroupSeparator />
      <ButtonGroupText>Aa</ButtonGroupText>
    </ButtonGroup>
  ),
};
