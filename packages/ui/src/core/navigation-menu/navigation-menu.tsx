"use client";

import { cva } from "class-variance-authority";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import {
  Button,
  type ButtonProps,
  composeRenderProps,
  Dialog,
  Link,
  type LinkProps,
  Popover,
  type PopoverProps,
} from "react-aria-components";

type MenuContextValue = {
  openId: string | null;
  /** The open item was opened by hover: a non-modal "peek" that keeps focus where it was. */
  isPeek: boolean;
  open: (id: string | null, options?: { peek?: boolean }) => void;
  openOnHover: boolean;
  delay: number;
  closeDelay: number;
  timer: React.RefObject<ReturnType<typeof setTimeout> | undefined>;
  /** Latest open state, for handlers react-aria may hold from an earlier render. */
  current: React.RefObject<{ openId: string | null; isPeek: boolean }>;
};

const MenuContext = React.createContext<MenuContextValue | null>(null);

type ItemContextValue = {
  isOpen: boolean;
  isPeek: boolean;
  setOpen: (isOpen: boolean) => void;
  /** Pointer entered/left the trigger (hover mode only). */
  hover: (isHovered: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

// Set by an item that has a dropdown; null for plain link items.
const ItemContext = React.createContext<ItemContextValue | null>(null);

function useItem(part: string) {
  const context = React.useContext(ItemContext);
  if (!context) throw new Error(`${part} must be used within a NavigationMenuItem`);
  return context;
}

type NavigationMenuProps = React.ComponentProps<"nav"> & {
  /**
   * Also open dropdowns when the pointer rests on a trigger. A hover-opened
   * dropdown is non-modal and leaves focus alone; pressing the trigger then
   * keeps it open as a regular (modal) dropdown. Pressing still works as
   * without this prop, so hover is never the only way in.
   */
  openOnHover?: boolean;
  /** Milliseconds the pointer rests on a trigger before it opens. @default 150 */
  delay?: number;
  /** Milliseconds before a hover-opened dropdown closes once the pointer leaves. @default 300 */
  closeDelay?: number;
};

function NavigationMenu({
  className,
  openOnHover = false,
  delay = 150,
  closeDelay = 300,
  ...props
}: NavigationMenuProps) {
  const [state, setState] = React.useState<{ openId: string | null; isPeek: boolean }>({
    openId: null,
    isPeek: false,
  });
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = React.useRef(state);
  current.current = state;

  React.useEffect(() => () => clearTimeout(timer.current), []);

  // A peek never holds focus, so react-aria's Escape handling never sees it;
  // and it closes once the pointer is neither on its trigger nor its content.
  const navRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (!state.isPeek) return;
    let closing = false;
    const close = () => setState({ openId: null, isPeek: false });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !(event.target instanceof Element)) return;
      const inside =
        event.target.closest("[data-slot=navigation-menu-content][data-peek]") ||
        (event.target.closest("[data-slot=navigation-menu-trigger][aria-expanded=true]") &&
          navRef.current?.contains(event.target));
      if (inside) {
        if (closing) clearTimeout(timer.current);
        closing = false;
      } else if (!closing) {
        closing = true;
        clearTimeout(timer.current);
        timer.current = setTimeout(close, closeDelay);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointermove", onPointerMove);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, [state.isPeek, closeDelay]);

  const context = React.useMemo<MenuContextValue>(
    () => ({
      ...state,
      open: (openId, options) => {
        clearTimeout(timer.current);
        setState({ openId, isPeek: openId !== null && !!options?.peek });
      },
      openOnHover,
      delay,
      closeDelay,
      timer,
      current,
    }),
    [state, openOnHover, delay, closeDelay],
  );

  return (
    <MenuContext.Provider value={context}>
      <nav
        ref={navRef}
        data-slot="navigation-menu"
        className={cn(
          "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
          className,
        )}
        {...props}
      />
    </MenuContext.Provider>
  );
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="navigation-menu-list"
      className={cn("flex flex-1 list-none items-center justify-center gap-0", className)}
      {...props}
    />
  );
}

/** A top-level entry: a plain `NavigationMenuLink`, or a trigger with its content. */
function NavigationMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  const id = React.useId();
  const menu = React.useContext(MenuContext);
  // Standalone items (outside a NavigationMenu) keep their own state.
  const [ownOpen, setOwnOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const isOpen = menu ? menu.openId === id : ownOpen;
  const isPeek = isOpen && !!menu?.isPeek;

  const context = React.useMemo<ItemContextValue>(
    () => ({
      isOpen,
      isPeek,
      triggerRef,
      setOpen: (open) => {
        if (!menu) return setOwnOpen(open);
        if (open) menu.open(id);
        else if (menu.openId === id) menu.open(null);
      },
      hover: (isHovered) => {
        if (!menu?.openOnHover) return;
        const { openId, isPeek } = menu.current.current;
        if (openId === id) return;
        clearTimeout(menu.timer.current);
        if (!isHovered) return;
        // Moving from one open dropdown to another trigger switches at once.
        if (openId !== null && isPeek) menu.open(id, { peek: true });
        else if (openId === null)
          menu.timer.current = setTimeout(() => menu.open(id, { peek: true }), menu.delay);
      },
    }),
    [id, menu, isOpen, isPeek],
  );

  return (
    <ItemContext.Provider value={context}>
      <li data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />
    </ItemContext.Provider>
  );
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-focus-visible:bg-muted data-focus-visible:ring-3 data-focus-visible:ring-ring/50 data-hovered:bg-muted aria-expanded:bg-muted/50 aria-expanded:data-hovered:bg-muted",
);

function NavigationMenuTrigger({ className, children, ...props }: ButtonProps) {
  const { isOpen, isPeek, setOpen, hover, triggerRef } = useItem("NavigationMenuTrigger");
  return (
    <Button
      ref={triggerRef}
      data-slot="navigation-menu-trigger"
      aria-expanded={isOpen}
      // Pressing a hover-opened dropdown keeps it open (now modal) instead of closing it.
      onPress={() => setOpen(isPeek || !isOpen)}
      onHoverChange={hover}
      className={composeRenderProps(className, (className) =>
        cn(navigationMenuTriggerStyle(), className),
      )}
      {...props}
    >
      {composeRenderProps(children, (children) => (
        <>
          {children}
          <ChevronDownIcon
            aria-hidden="true"
            className="relative top-px ml-1 size-3 transition duration-300 group-aria-expanded/navigation-menu-trigger:rotate-180"
          />
        </>
      ))}
    </Button>
  );
}

type NavigationMenuContentProps = Omit<
  PopoverProps,
  "triggerRef" | "isOpen" | "onOpenChange" | "children"
> & {
  children?: React.ReactNode;
  /** Names the dropdown for assistive tech; defaults to the trigger's text. */
  "aria-label"?: string;
};

/**
 * The dropdown of an item. Escape or a click outside closes it and returns
 * focus to the trigger; following a link inside closes it too. Opened by
 * hover (`openOnHover`), it is non-modal and closes when the pointer leaves.
 */
function NavigationMenuContent({
  className,
  children,
  "aria-label": ariaLabel,
  placement = "bottom start",
  offset = 8,
  ...props
}: NavigationMenuContentProps) {
  const { isOpen, isPeek, setOpen, triggerRef } = useItem("NavigationMenuContent");
  const label = ariaLabel ?? triggerRef.current?.textContent ?? undefined;
  return (
    <Popover
      // Remount when a peek turns modal: switching modality in place makes
      // react-aria dismiss the popover.
      key={isPeek ? "peek" : "modal"}
      data-slot="navigation-menu-content"
      data-peek={isPeek || undefined}
      triggerRef={triggerRef}
      isOpen={isOpen}
      onOpenChange={setOpen}
      isNonModal={isPeek}
      placement={placement}
      offset={offset}
      className={composeRenderProps(className, (className) =>
        cn(
          "z-50 overflow-auto rounded-lg bg-popover p-1 text-popover-foreground shadow ring-1 ring-foreground/10 outline-none data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95",
          className,
        ),
      )}
      {...props}
    >
      {isPeek ? (
        // A peek must not take focus, which a Dialog does on mount.
        <div role="group" aria-label={label}>
          {children}
        </div>
      ) : (
        <Dialog aria-label={label} className="outline-none">
          {children}
        </Dialog>
      )}
    </Popover>
  );
}

function NavigationMenuLink({ className, onPress, ...props }: LinkProps) {
  const item = React.useContext(ItemContext);
  return (
    <Link
      data-slot="navigation-menu-link"
      onPress={(event) => {
        item?.setOpen(false);
        onPress?.(event);
      }}
      className={composeRenderProps(className, (className) =>
        cn(
          "flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none in-data-[slot=navigation-menu-content]:rounded-md data-current:bg-muted/50 data-focus-visible:bg-muted data-focus-visible:ring-3 data-focus-visible:ring-ring/50 data-hovered:bg-muted [&_svg:not([class*='size-'])]:size-4",
          className,
        ),
      )}
      {...props}
    />
  );
}

export type { NavigationMenuContentProps, NavigationMenuProps };
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
