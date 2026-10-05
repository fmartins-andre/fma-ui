"use client";

import { cn } from "cn";
import type * as React from "react";
import {
  Button,
  type ButtonProps,
  composeRenderProps,
  MenuTrigger,
  type MenuTriggerProps,
  Toolbar,
  type ToolbarProps,
} from "react-aria-components";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/core/dropdown-menu/dropdown-menu";

/** A react-aria `Toolbar`: arrow keys move between the menus' triggers. */
function Menubar({ className, ...props }: ToolbarProps) {
  return (
    <Toolbar
      data-slot="menubar"
      className={composeRenderProps(className, (className) =>
        cn("flex h-8 items-center gap-0.5 rounded-lg border p-[3px]", className),
      )}
      {...props}
    />
  );
}

/** One menu: a `MenubarTrigger` followed by its `MenubarContent`. */
function MenubarMenu(props: MenuTriggerProps) {
  return <MenuTrigger {...props} />;
}

function MenubarTrigger({ className, ...props }: ButtonProps) {
  return (
    <Button
      data-slot="menubar-trigger"
      className={composeRenderProps(className, (className) =>
        cn(
          "flex items-center rounded-sm px-1.5 py-[2px] text-sm font-medium outline-hidden select-none data-focus-visible:ring-3 data-focus-visible:ring-ring/50 data-hovered:bg-muted data-pressed:bg-muted aria-expanded:bg-muted",
          className,
        ),
      )}
      {...props}
    />
  );
}

function MenubarContent({
  className,
  placement = "bottom start",
  offset = 8,
  crossOffset = -4,
  ...props
}: React.ComponentProps<typeof DropdownMenu>) {
  return (
    <DropdownMenu
      data-slot="menubar-content"
      placement={placement}
      offset={offset}
      crossOffset={crossOffset}
      className={cn("w-auto min-w-36", className)}
      {...props}
    />
  );
}

/**
 * Groups items under an optional `MenubarLabel`. Set `selectionMode` ("single"
 * for radio-like, "multiple" for checkbox-like items) with
 * `selectedKeys`/`onSelectionChange` to make its items selectable.
 */
const MenubarGroup = DropdownMenuGroup;
const MenubarItem = DropdownMenuItem;
const MenubarLabel = DropdownMenuLabel;
const MenubarSeparator = DropdownMenuSeparator;
const MenubarShortcut = DropdownMenuShortcut;
const MenubarSub = DropdownMenuSub;
const MenubarSubTrigger = DropdownMenuSubTrigger;
const MenubarSubContent = DropdownMenuSubContent;

export {
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
};
