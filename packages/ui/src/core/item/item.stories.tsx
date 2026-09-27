import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserIcon } from "lucide-react";
import { Button } from "../button/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Item",
  component: Item,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "muted"] },
    size: { control: "select", options: ["default", "sm", "xs"] },
  },
  args: {
    variant: "outline",
  },
} satisfies Meta<typeof Item>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "Media, title/description, and a trailing action button." } },
  },
  render: (args) => (
    <Item {...args} className="w-96">
      <ItemMedia variant="icon">
        <UserIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>André Martins</ItemTitle>
        <ItemDescription>fmartins.andre@gmail.com</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </ItemActions>
    </Item>
  ),
};

export const AsLink: Story = {
  parameters: {
    docs: { description: { story: "Passing href renders the item as a real link, not a div." } },
  },
  render: (args) => (
    <Item {...args} href="https://ui.fmartinsandre.dev" className="w-96">
      <ItemContent>
        <ItemTitle>Visit the registry</ItemTitle>
        <ItemDescription>ui.fmartinsandre.dev</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const Group: Story = {
  parameters: {
    docs: { description: { story: "ItemGroup + ItemSeparator stack several items into a list." } },
  },
  render: (args) => (
    <ItemGroup className="w-96">
      <Item {...args}>
        <ItemContent>
          <ItemTitle>Profile</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item {...args}>
        <ItemContent>
          <ItemTitle>Settings</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
