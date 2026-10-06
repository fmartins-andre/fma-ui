"use client";

import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/avatar/avatar";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/core/sidebar/sidebar";
import type { AppSidebarUser, AppSidebarUserAction } from "./types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function UserSummary({ user }: { user: AppSidebarUser }) {
  return (
    <>
      <Avatar>
        {user.avatar && <AvatarImage src={user.avatar} alt="" />}
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs">{user.email}</span>
      </div>
    </>
  );
}

export function NavUser({
  user,
  onAction,
}: {
  user: AppSidebarUser;
  onAction?: (action: AppSidebarUserAction) => void;
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenuTrigger>
          <SidebarMenuButton
            size="lg"
            aria-label={`Account: ${user.name}`}
            className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
          >
            <UserSummary user={user} />
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto size-4" />
          </SidebarMenuButton>
          <DropdownMenu
            placement={isMobile ? "bottom end" : "end bottom"}
            className="w-fit min-w-56"
            onAction={(key) => onAction?.(key as AppSidebarUserAction)}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5 font-normal text-foreground">
                <UserSummary user={user} />
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem id="upgrade" textValue="Upgrade to Pro">
              <SparklesIcon aria-hidden="true" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem id="account" textValue="Account">
                <BadgeCheckIcon aria-hidden="true" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem id="billing" textValue="Billing">
                <CreditCardIcon aria-hidden="true" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem id="notifications" textValue="Notifications">
                <BellIcon aria-hidden="true" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem id="logout" textValue="Log out">
              <LogOutIcon aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
