"use client";

import { cn } from "cn";
import * as React from "react";
import {
  Button,
  type ButtonProps,
  composeRenderProps,
  MenuTrigger,
  type MenuTriggerProps,
  Toolbar,
  type ToolbarProps,
  useLocale,
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

type MenubarState = {
  openId: string | null;
  setOpenId: React.Dispatch<React.SetStateAction<string | null>>;
};

const MenubarContext = React.createContext<MenubarState | null>(null);
const MenubarMenuContext = React.createContext<string | undefined>(undefined);

const TRIGGER = "[data-slot=menubar-trigger][data-menu-id]";

/**
 * A react-aria `Toolbar`: arrow keys move between the menus' triggers. While a
 * menu is open, hovering another trigger or pressing ArrowLeft/ArrowRight in
 * the menu opens the neighbouring menu instead, like a desktop menu bar.
 */
function Menubar({ className, ...props }: ToolbarProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  // How the open menu was reached by switching: focus its first item
  // (keyboard) or the menu itself (pointer). Null when opened normally.
  const switchedBy = React.useRef<"keyboard" | "pointer" | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const { direction } = useLocale();

  React.useEffect(() => {
    if (openId === null) {
      switchedBy.current = null;
      return;
    }
    const triggers = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>(TRIGGER) ?? []).filter(
        (el) => !el.hasAttribute("data-disabled"),
      );
    const switchTo = (id: string | undefined, by: "keyboard" | "pointer") => {
      if (!id || id === openId) return;
      switchedBy.current = by;
      setOpenId(id);
    };

    // A modal popover makes everything outside it inert, which also drops the
    // previously focused menu's focus on the body. Put focus in the open menu.
    const focusOpenMenu = () => {
      if (!switchedBy.current) return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const trigger = triggers().find((el) => el.dataset.menuId === openId);
      const menu = document.getElementById(trigger?.getAttribute("aria-controls") ?? "");
      const first = menu?.querySelector<HTMLElement>("[role^=menuitem]:not([aria-disabled=true])");
      (switchedBy.current === "keyboard" ? (first ?? menu) : menu)?.focus();
    };
    const onFocusOut = () => requestAnimationFrame(focusOpenMenu);
    const frame = requestAnimationFrame(focusOpenMenu);

    // Inert content is skipped by hit-testing, so hovering another trigger
    // never reaches it: compare the pointer with the triggers' boxes instead.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const hit = triggers().find((el) => {
        const box = el.getBoundingClientRect();
        return (
          event.clientX >= box.left &&
          event.clientX <= box.right &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom
        );
      });
      switchTo(hit?.dataset.menuId, "pointer");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!(event.target instanceof Element)) return;
      // Only from the menu itself: submenus use these keys to open and close.
      const surface = event.target.closest(
        "[data-slot=menubar-content], [data-slot=dropdown-menu-sub-content]",
      );
      if (surface?.getAttribute("data-slot") !== "menubar-content") return;
      const forward = (event.key === "ArrowRight") === (direction === "ltr");
      if (forward && event.target.closest("[aria-haspopup]")) return;
      const list = triggers();
      const index = list.findIndex((el) => el.dataset.menuId === openId);
      if (index === -1 || list.length < 2) return;
      event.preventDefault();
      event.stopPropagation();
      switchTo(
        list[(index + (forward ? 1 : -1) + list.length) % list.length]?.dataset.menuId,
        "keyboard",
      );
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [openId, direction]);

  const state = React.useMemo(() => ({ openId, setOpenId }), [openId]);

  return (
    <MenubarContext.Provider value={state}>
      <Toolbar
        ref={ref}
        data-slot="menubar"
        className={composeRenderProps(className, (className) =>
          cn("flex h-8 items-center gap-0.5 rounded-lg border p-[3px]", className),
        )}
        {...props}
      />
    </MenubarContext.Provider>
  );
}

/**
 * One menu: a `MenubarTrigger` followed by its `MenubarContent`. Inside a
 * `Menubar` its open state is shared with the other menus, so only one is
 * open at a time; `isOpen` still controls it when given.
 */
function MenubarMenu({ isOpen, defaultOpen, onOpenChange, ...props }: MenuTriggerProps) {
  const id = React.useId();
  const bar = React.useContext(MenubarContext);
  const setOpenId = bar?.setOpenId;

  React.useEffect(() => {
    if (defaultOpen) setOpenId?.(id);
  }, [defaultOpen, id, setOpenId]);

  if (!bar) {
    return (
      <MenuTrigger
        isOpen={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        {...props}
      />
    );
  }

  return (
    <MenubarMenuContext.Provider value={id}>
      <MenuTrigger
        isOpen={isOpen ?? bar.openId === id}
        onOpenChange={(open) => {
          bar.setOpenId((current) => (open ? id : current === id ? null : current));
          onOpenChange?.(open);
        }}
        {...props}
      />
    </MenubarMenuContext.Provider>
  );
}

function MenubarTrigger({ className, ...props }: ButtonProps) {
  const menuId = React.useContext(MenubarMenuContext);
  return (
    <Button
      data-slot="menubar-trigger"
      data-menu-id={menuId}
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
