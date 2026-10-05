"use client";

import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/core/sidebar/sidebar";
import { NavSection } from "./nav-section";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import type { AppSidebarData, AppSidebarTeam, AppSidebarUserAction } from "./types";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  data: AppSidebarData;
  onTeamChange?: (team: AppSidebarTeam) => void;
  /** Shows an "Add team" entry in the team switcher. */
  onAddTeam?: () => void;
  onUserAction?: (action: AppSidebarUserAction) => void;
};

/**
 * App-shell sidebar (shadcn "sidebar-07"): collapsible to icons, with a team
 * switcher or logo, one section per `data.nav` entry and a user menu.
 * Render it inside a `SidebarProvider`.
 */
export function AppSidebar({
  data,
  onTeamChange,
  onAddTeam,
  onUserAction,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={data.teams}
          logo={data.logo}
          onTeamChange={onTeamChange}
          onAddTeam={onAddTeam}
        />
      </SidebarHeader>
      <SidebarContent>
        {data.nav.map((section) => (
          <NavSection key={section.title} section={section} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onAction={onUserAction} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export type * from "./types";
export type { AppSidebarProps };
