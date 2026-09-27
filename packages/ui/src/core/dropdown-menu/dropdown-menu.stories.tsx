import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  render: (args) => (
    <DropdownMenuTrigger>
      <Button variant="outline">Open menu</Button>
      <DropdownMenu {...args} className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem id="profile">
          Profile
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem id="billing">
          Billing
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem id="settings">
          Settings
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  ),
} satisfies Meta<typeof DropdownMenu>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const WithSubmenu: Story = {
  render: (args) => (
    <DropdownMenuTrigger>
      <Button variant="outline">Open menu</Button>
      <DropdownMenu {...args} className="w-56">
        <DropdownMenuItem id="new-tab">
          New Tab
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger id="more-tools">More Tools</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem id="save-page">Save Page As...</DropdownMenuItem>
            <DropdownMenuItem id="create-shortcut">Create Shortcut...</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenu>
    </DropdownMenuTrigger>
  ),
};

export const OpensOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: /open menu/i }));
    expect(await canvasBody.findByRole("menu")).toBeInTheDocument();
    const items = await canvasBody.findAllByRole("menuitem");
    expect(items).toHaveLength(3);
  },
};
