"use client";

import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/core/collapsible/collapsible";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/core/sidebar/sidebar";
import type { AppSidebarNavItem, AppSidebarNavSection } from "./types";

export function NavSection({ section }: { section: AppSidebarNavSection }) {
  const { isMobile, state } = useSidebar();
  const isIconCollapsed = state === "collapsed" && !isMobile;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
      <SidebarMenu>
        {section.items.map((item) => {
          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  href={item.url}
                  isActive={item.isActive}
                  aria-current={item.isActive ? "page" : undefined}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          // Icon-only sidebars have no room for inline sub-items.
          const variant = isIconCollapsed ? "dropdown" : (item.variant ?? "collapse");
          return variant === "dropdown" ? (
            <DropdownItem key={item.title} item={item} withLabel={isIconCollapsed} />
          ) : (
            <CollapseItem key={item.title} item={item} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function CollapseItem({ item }: { item: AppSidebarNavItem }) {
  return (
    <SidebarMenuItem>
      <Collapsible defaultExpanded={item.isActive} className="group/collapsible">
        <SidebarMenuButton slot="trigger" tooltip={item.title}>
          {item.icon}
          <span>{item.title}</span>
          <ChevronRightIcon
            aria-hidden="true"
            className="ml-auto transition-transform duration-200 group-data-expanded/collapsible:rotate-90"
          />
        </SidebarMenuButton>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton href={subItem.url} className="w-full">
                  {subItem.icon}
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

function DropdownItem({ item, withLabel }: { item: AppSidebarNavItem; withLabel: boolean }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <DropdownMenuTrigger>
        <SidebarMenuButton
          tooltip={item.title}
          className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
        >
          {item.icon}
          <span>{item.title}</span>
          <MoreHorizontalIcon aria-hidden="true" className="ml-auto" />
        </SidebarMenuButton>
        <DropdownMenu
          aria-label={item.title}
          placement={isMobile ? "bottom start" : "end top"}
          className="w-fit min-w-40"
        >
          {withLabel && (
            <>
              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {item.items?.map((subItem) => (
            <DropdownMenuItem key={subItem.title} id={subItem.title} href={subItem.url}>
              {subItem.icon}
              <span>{subItem.title}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      </DropdownMenuTrigger>
    </SidebarMenuItem>
  );
}
