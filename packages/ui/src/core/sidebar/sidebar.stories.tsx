import type { Meta, StoryObj } from "@storybook/react-vite";
import { HomeIcon, SettingsIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";

// Composed as one example rather than one story per sub-part — this is a
// compound component (provider + many slot pieces), not a single primitive.
const componentMeta = {
  title: "ui/Sidebar",
  component: SidebarProvider,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof SidebarProvider>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "A full provider + sidebar + inset composition, with a trigger to collapse it.",
      },
    },
  },
  render: () => (
    <SidebarProvider className="h-96">
      <Sidebar>
        <SidebarHeader>fma-ui</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <HomeIcon />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <SettingsIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>v0.1.0</SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4">
        <SidebarTrigger />
        <p className="mt-4 text-sm text-muted-foreground">Page content goes here.</p>
      </SidebarInset>
    </SidebarProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /toggle sidebar/i });
    await userEvent.click(trigger);
    expect(trigger).toBeVisible();
  },
};
