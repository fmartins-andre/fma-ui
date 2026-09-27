import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pressable } from "react-aria-components";
import { expect, fireEvent, within } from "storybook/test";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";
import meta from "./meta.json";

// ContextMenu IS the popover+menu (unlike some libraries there's no separate
// "Content" component) — ContextMenuTrigger's children are [trigger region,
// ContextMenu], matching react-aria's MenuTrigger pattern. The trigger region
// must be a component that calls usePress() (or be wrapped in <Pressable>) —
// a plain <div> never consumes the PressResponder context, so its
// onContextMenu handler is silently never attached.
const componentMeta = {
  title: "ui/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  render: (args) => (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex h-48 w-96 items-center justify-center rounded-md border border-dashed bg-accent text-sm"
        >
          Right click here
        </div>
      </Pressable>
      <ContextMenu {...args} className="w-32">
        <ContextMenuItem id="profile">Profile</ContextMenuItem>
        <ContextMenuItem id="billing">Billing</ContextMenuItem>
        <ContextMenuItem id="team">Team</ContextMenuItem>
        <ContextMenuItem id="subscription">Subscription</ContextMenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  ),
} satisfies Meta<typeof ContextMenu>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const WithShortcuts: Story = {
  render: (args) => (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex h-48 w-96 items-center justify-center rounded-md border border-dashed bg-accent text-sm"
        >
          Right click here
        </div>
      </Pressable>
      <ContextMenu {...args} className="w-32">
        <ContextMenuItem id="back">
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem id="forward" isDisabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem id="reload">
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  ),
};

export const WithSubmenu: Story = {
  render: (args) => (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex h-48 w-96 items-center justify-center rounded-md border border-dashed bg-accent text-sm"
        >
          Right click here
        </div>
      </Pressable>
      <ContextMenu {...args} className="w-32">
        <ContextMenuItem id="new-tab">
          New Tab
          <ContextMenuShortcut>⌘N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger id="more-tools">More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem id="save-page">
              Save Page As...
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem id="create-shortcut">Create Shortcut...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem id="dev-tools">Developer Tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenu>
    </ContextMenuTrigger>
  ),
};

export const OpensOnRightClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const canvasBody = within(canvasElement.ownerDocument.body);
    const trigger = await canvas.findByText(/right click here/i);

    fireEvent.contextMenu(trigger);

    expect(await canvasBody.findByRole("menu")).toBeInTheDocument();
    const items = await canvasBody.findAllByRole("menuitem");
    expect(items).toHaveLength(4);
  },
};
