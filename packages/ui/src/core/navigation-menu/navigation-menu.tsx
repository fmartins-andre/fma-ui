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

type ItemContextValue = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

// Set by an item that has a dropdown; null for plain link items.
const ItemContext = React.createContext<ItemContextValue | null>(null);

function useItem(part: string) {
  const context = React.useContext(ItemContext);
  if (!context) throw new Error(`${part} must be used within a NavigationMenuItem`);
  return context;
}

function NavigationMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="navigation-menu"
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    />
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
  const [isOpen, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const context = React.useMemo(() => ({ isOpen, setOpen, triggerRef }), [isOpen]);
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
  const { isOpen, setOpen, triggerRef } = useItem("NavigationMenuTrigger");
  return (
    <Button
      ref={triggerRef}
      data-slot="navigation-menu-trigger"
      aria-expanded={isOpen}
      onPress={() => setOpen(!isOpen)}
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
 * focus to the trigger; following a link inside closes it too.
 */
function NavigationMenuContent({
  className,
  children,
  "aria-label": ariaLabel,
  placement = "bottom start",
  offset = 8,
  ...props
}: NavigationMenuContentProps) {
  const { isOpen, setOpen, triggerRef } = useItem("NavigationMenuContent");
  return (
    <Popover
      data-slot="navigation-menu-content"
      triggerRef={triggerRef}
      isOpen={isOpen}
      onOpenChange={setOpen}
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
      <Dialog
        aria-label={ariaLabel ?? triggerRef.current?.textContent ?? undefined}
        className="outline-none"
      >
        {children}
      </Dialog>
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

export type { NavigationMenuContentProps };
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
