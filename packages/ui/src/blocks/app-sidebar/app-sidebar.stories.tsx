import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookOpenIcon,
  BotIcon,
  BuildingIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  HomeIcon,
  Settings2Icon,
} from "lucide-react";
import { RouterProvider } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/core/sidebar/sidebar";
import { AppSidebar, type AppSidebarData } from "./app-sidebar";
import meta from "./meta.json";

const NAV: AppSidebarData["nav"] = [
  {
    title: "Platform",
    items: [
      { title: "Home", url: "/home", icon: <HomeIcon />, isActive: true },
      {
        title: "Models",
        url: "/models",
        icon: <BotIcon />,
        isActive: true,
        items: [
          { title: "Genesis", url: "/models/genesis" },
          { title: "Explorer", url: "/models/explorer" },
        ],
      },
      {
        title: "Docs",
        url: "/docs",
        icon: <BookOpenIcon />,
        variant: "dropdown",
        items: [
          { title: "Introduction", url: "/docs/intro" },
          { title: "Changelog", url: "/docs/changelog" },
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: <Settings2Icon />,
        items: [
          { title: "General", url: "/settings/general" },
          { title: "Billing", url: "/settings/billing" },
        ],
      },
    ],
  },
  {
    title: "Projects",
    items: [{ title: "Design Engineering", url: "/projects/design", icon: <FrameIcon /> }],
  },
];

const USER = { name: "Ada Lovelace", email: "ada@example.com", avatar: "" };

const TEAMS_DATA: AppSidebarData = {
  user: USER,
  nav: NAV,
  teams: [
    { name: "Acme Inc", plan: "Enterprise", logo: <GalleryVerticalEndIcon className="size-4" /> },
    { name: "Acme Corp.", plan: "Startup", logo: <BuildingIcon className="size-4" /> },
  ],
};

const navigate = fn();

const componentMeta = {
  title: "blocks/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
  args: {
    data: TEAMS_DATA,
    onTeamChange: fn(),
    onAddTeam: fn(),
    onUserAction: fn(),
  },
  render: (args) => (
    <RouterProvider navigate={navigate}>
      <SidebarProvider className="h-[560px] min-h-0">
        <AppSidebar {...args} />
        <SidebarInset className="p-4">
          <SidebarTrigger />
          <p className="mt-4 text-sm text-muted-foreground">Page content goes here.</p>
        </SidebarInset>
      </SidebarProvider>
    </RouterProvider>
  ),
} satisfies Meta<typeof AppSidebar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);

export const Default: Story = {
  play: async ({ canvas }) => {
    navigate.mockClear();
    await expect(canvas.getByText("Platform")).toBeInTheDocument();
    const home = canvas.getByRole("link", { name: "Home" });
    await expect(home).toHaveAttribute("aria-current", "page");
    await userEvent.click(home);
    await expect(navigate).toHaveBeenLastCalledWith("/home", undefined);

    // An active collapse item starts expanded; the others start collapsed.
    await expect(canvas.getByRole("link", { name: "Genesis" })).toBeVisible();
    const settings = canvas.getByRole("button", { name: "Settings" });
    await expect(settings).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(settings);
    await expect(settings).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Billing" })).toHaveAttribute(
      "href",
      "/settings/billing",
    );
  },
};

/** `variant: "dropdown"` opens the sub-items in a menu beside the item. */
export const DropdownItem: Story = {
  play: async ({ canvas }) => {
    navigate.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Docs" }));
    const menu = await body().findByRole("menu", { name: "Docs" });
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Changelog" }));
    await expect(navigate).toHaveBeenLastCalledWith("/docs/changelog", undefined);
  },
};

export const TeamSwitcher: Story = {
  // Menus are named by their trigger.
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Team: Acme Inc" }));
    let menu = await body().findByRole("menu", { name: /^Team:/ });
    await userEvent.click(within(menu).getByRole("menuitem", { name: /Acme Corp\./ }));
    await expect(args.onTeamChange).toHaveBeenLastCalledWith(TEAMS_DATA.teams?.[1]);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Team: Acme Corp." })).toBeInTheDocument(),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Team: Acme Corp." }));
    menu = await body().findByRole("menu", { name: /^Team:/ });
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Add team" }));
    await expect(args.onAddTeam).toHaveBeenCalledOnce();
  },
};

export const UserMenu: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Account: Ada Lovelace" }));
    const menu = await body().findByRole("menu", { name: "Account: Ada Lovelace" });
    await expect(within(menu).getByText("ada@example.com")).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Log out" }));
    await expect(args.onUserAction).toHaveBeenLastCalledWith("logout");
  },
};

/** Collapsed to icons, items with sub-items open as menus labelled with their title. */
export const CollapsedToIcons: Story = {
  play: async ({ canvasElement, canvas }) => {
    // The rail is also a "Toggle Sidebar" button; use the trigger.
    const trigger = canvasElement.querySelector<HTMLElement>("[data-slot=sidebar-trigger]");
    const sidebar = canvasElement.querySelector("[data-slot=sidebar]");
    if (!trigger) throw new Error("No sidebar trigger");
    await userEvent.click(trigger);
    await waitFor(() => expect(sidebar).toHaveAttribute("data-collapsible", "icon"));

    await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
    const menu = await body().findByRole("menu", { name: "Settings" });
    await expect(within(menu).getByText("Settings")).toBeInTheDocument();
    await expect(within(menu).getByRole("menuitem", { name: "General" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    // Leave the sidebar expanded for the next story.
    await userEvent.click(trigger);
  },
};

/** Without teams, a static logo fills the header (full, or compact when collapsed). */
export const WithLogo: Story = {
  args: {
    data: {
      user: USER,
      nav: NAV,
      logo: {
        full: <span className="text-base font-semibold">fma-ui</span>,
        collapsed: <span className="text-base font-semibold">f</span>,
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("fma-ui")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /^Team:/ })).toBeNull();
  },
};
