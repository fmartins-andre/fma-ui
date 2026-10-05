"use client";

import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/core/dropdown-menu/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/core/sidebar/sidebar";
import type { AppSidebarLogo, AppSidebarTeam } from "./types";

export function TeamSwitcher({
  teams,
  logo,
  onTeamChange,
  onAddTeam,
}: {
  teams?: AppSidebarTeam[];
  logo?: AppSidebarLogo;
  onTeamChange?: (team: AppSidebarTeam) => void;
  onAddTeam?: () => void;
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams?.[0]);

  if (!teams?.length || !activeTeam) {
    // Same footprint as the switcher button, so collapsing behaves alike.
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            data-slot="app-sidebar-logo"
            className="flex h-12 w-full items-center justify-center overflow-hidden rounded-md group-data-[collapsible=icon]:size-8!"
          >
            <div className="flex size-full items-center justify-center group-data-[collapsible=icon]:hidden">
              {logo?.full}
            </div>
            <div className="hidden size-full items-center justify-center group-data-[collapsible=icon]:flex">
              {logo?.collapsed}
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenuTrigger>
          <SidebarMenuButton
            size="lg"
            aria-label={`Team: ${activeTeam.name}`}
            className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {activeTeam.logo}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </SidebarMenuButton>
          <DropdownMenu
            placement={isMobile ? "bottom start" : "end top"}
            className="w-fit min-w-56"
            onAction={(key) => {
              if (key === "add-team") return onAddTeam?.();
              const team = teams.find((candidate) => candidate.name === key);
              if (!team) return;
              setActiveTeam(team);
              onTeamChange?.(team);
            }}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Teams</DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem key={team.name} id={team.name} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    {team.logo}
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {onAddTeam && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem id="add-team" textValue="Add team" className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <PlusIcon aria-hidden="true" className="size-4" />
                  </div>
                  <span className="font-medium text-muted-foreground">Add team</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenu>
        </DropdownMenuTrigger>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
