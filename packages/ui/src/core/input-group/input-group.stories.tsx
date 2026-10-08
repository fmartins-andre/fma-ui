import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./input-group";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof InputGroup>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "A leading icon addon, the most common pattern (a search box)." },
    },
  },
  render: (args) => (
    <InputGroup {...args} className="w-72">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components..." />
    </InputGroup>
  ),
};

export const WithButtonAddon: Story = {
  parameters: {
    docs: { description: { story: "A trailing InputGroupButton, e.g. for a newsletter signup." } },
  },
  render: (args) => (
    <InputGroup {...args} className="w-72">
      <InputGroupInput placeholder="you@example.com" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="xs">Subscribe</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithText: Story = {
  parameters: {
    docs: { description: { story: "A static text addon (a fixed prefix like a URL scheme)." } },
  },
  render: (args) => (
    <InputGroup {...args} className="w-72">
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
};
