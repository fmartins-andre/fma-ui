import type * as React from "react";

/**
 * Data contract for the `app-sidebar` block: adding or removing a team,
 * section, item or sub-item is a change to this data, not to the block.
 */

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

export type AppSidebarTeam = {
  name: string;
  logo: React.ReactNode;
  plan: string;
};

/**
 * `full` shows while the sidebar is expanded (and on mobile); `collapsed`
 * while it's retracted to icons. Swapped with CSS only.
 */
export type AppSidebarLogo = {
  full: React.ReactNode;
  collapsed: React.ReactNode;
};

/** Either a team switcher or a static logo fills the header. */
export type AppSidebarBranding =
  | { teams: AppSidebarTeam[]; logo?: never }
  | { teams?: never; logo: AppSidebarLogo };

/**
 * Links are react-aria `Link`s: wrap the app in react-aria's `RouterProvider`
 * to route them client-side.
 */
export type AppSidebarNavSubItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
};

/**
 * `variant` picks how an item with sub-items opens: `"collapse"` (default)
 * expands them inline, `"dropdown"` opens a menu beside the item. While the
 * sidebar is collapsed to icons every item uses the dropdown.
 */
export type AppSidebarNavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  /** Marks the current page and starts a collapse item expanded. */
  isActive?: boolean;
  variant?: "collapse" | "dropdown";
  items?: AppSidebarNavSubItem[];
};

/** A sidebar section, rendered as a `SidebarGroup`. */
export type AppSidebarNavSection = {
  title: string;
  items: AppSidebarNavItem[];
};

export type AppSidebarData = {
  user: AppSidebarUser;
  nav: AppSidebarNavSection[];
} & AppSidebarBranding;

/** Ids of the entries in the user menu, passed to `onUserAction`. */
export type AppSidebarUserAction = "upgrade" | "account" | "billing" | "notifications" | "logout";
