import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import type { Selection } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";
import meta from "./meta.json";

const onAction = fn();

function ViewMenu() {
  const [panels, setPanels] = React.useState<Selection>(new Set(["sidebar"]));
  const [zoom, setZoom] = React.useState<Selection>(new Set(["100"]));
  return (
    <MenubarMenu>
      <MenubarTrigger>View</MenubarTrigger>
      <MenubarContent>
        <MenubarGroup
          aria-label="Panels"
          selectionMode="multiple"
          selectedKeys={panels}
          onSelectionChange={setPanels}
        >
          <MenubarItem id="sidebar">Sidebar</MenubarItem>
          <MenubarItem id="minimap">Minimap</MenubarItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarGroup selectionMode="single" selectedKeys={zoom} onSelectionChange={setZoom}>
          <MenubarLabel>Zoom</MenubarLabel>
          <MenubarItem id="75">75%</MenubarItem>
          <MenubarItem id="100">100%</MenubarItem>
          <MenubarItem id="150">150%</MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

const componentMeta = {
  title: "ui/Menubar",
  component: Menubar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { "aria-label": "Editor" },
  render: (args) => (
    <Menubar {...args}>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent onAction={onAction}>
          <MenubarItem id="new-tab">
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem id="new-window">New Window</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent onAction={onAction}>
              <MenubarItem id="email">Email link</MenubarItem>
              <MenubarItem id="messages">Messages</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem id="print" isDisabled>
            Print
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent onAction={onAction}>
          <MenubarItem id="undo">
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem id="redo">
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <ViewMenu />
    </Menubar>
  ),
} satisfies Meta<typeof Menubar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);

export const Default: Story = {
  play: async ({ canvas }) => {
    onAction.mockClear();
    await expect(canvas.getByRole("toolbar", { name: "Editor" })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "File" }));
    const menu = await body().findByRole("menu");
    await expect(within(menu).getByRole("menuitem", { name: /Print/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(within(menu).getByRole("menuitem", { name: /New Window/ }));
    await expect(onAction.mock.lastCall?.[0]).toBe("new-window");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** Arrow keys move between triggers; ArrowDown opens a menu on its first item. */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    onAction.mockClear();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "File" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Edit" })).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    const menu = await body().findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: /Undo/ })).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(onAction.mock.lastCall?.[0]).toBe("redo");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Edit" })).toHaveFocus());
  },
};

export const Submenu: Story = {
  play: async ({ canvas }) => {
    onAction.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "File" }));
    await userEvent.click(await body().findByRole("menuitem", { name: /Share/ }));
    await userEvent.click(await body().findByRole("menuitem", { name: "Messages" }));
    await expect(onAction.mock.lastCall?.[0]).toBe("messages");
  },
};

/** Groups with `selectionMode` act as checkbox ("multiple") or radio ("single") items. */
export const SelectableItems: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "View" }));
    let menu = await body().findByRole("menu");
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Sidebar" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "Minimap" }));

    // Selectable menus stay open in react-aria's multiple mode; reopen to read state.
    menu = await body().findByRole("menu");
    await expect(within(menu).getByRole("menuitemcheckbox", { name: "Minimap" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: "150%" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "View" }));
    menu = await body().findByRole("menu");
    await expect(within(menu).getByRole("menuitemradio", { name: "150%" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(within(menu).getByRole("menuitemradio", { name: "100%" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

/** With a menu open, hovering another trigger switches to its menu. */
export const HoverSwitch: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "File" }));
    await body().findByRole("menuitem", { name: /New Tab/ });

    // The open menu makes the rest of the page inert, so the pointer lands on
    // the body: move it there, over the Edit trigger (userEvent.hover refuses
    // inert targets).
    const edit = canvas.getByRole("button", { name: "Edit" }).getBoundingClientRect();
    document.body.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: edit.left + edit.width / 2,
        clientY: edit.top + edit.height / 2,
        pointerType: "mouse",
      }),
    );
    await body().findByRole("menuitem", { name: /Undo/ });
    await waitFor(() =>
      expect(document.activeElement?.closest("[role=menu]")).toHaveAttribute(
        "aria-labelledby",
        canvas.getByRole("button", { name: "Edit" }).id,
      ),
    );
    // The previous menu is gone (after its exit animation).
    await waitFor(() => expect(body().getAllByRole("menu")).toHaveLength(1));
    await expect(canvas.getByRole("button", { name: "Edit" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "File" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    // Closed: hovering a trigger does not open anything.
    await userEvent.hover(canvas.getByRole("button", { name: "View" }));
    await expect(body().queryByRole("menu")).toBeNull();
  },
};

/** With a menu open, ArrowRight/ArrowLeft move to the neighbouring menu (wrapping). */
export const ArrowsBetweenMenus: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "File" }));
    await body().findByRole("menu");
    await waitFor(() => expect(document.activeElement?.closest("[role=menu]")).not.toBeNull());
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Edit" })).toHaveAttribute("aria-expanded", "true"),
    );
    await waitFor(() => expect(document.activeElement?.closest("[role=menu]")).not.toBeNull());
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "View" })).toHaveAttribute("aria-expanded", "true"),
    );
    await waitFor(() => expect(document.activeElement?.closest("[role=menu]")).not.toBeNull());
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "File" })).toHaveAttribute("aria-expanded", "true"),
    );
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "View" })).toHaveAttribute("aria-expanded", "true"),
    );
    await waitFor(() => expect(body().getAllByRole("menu")).toHaveLength(1));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};
