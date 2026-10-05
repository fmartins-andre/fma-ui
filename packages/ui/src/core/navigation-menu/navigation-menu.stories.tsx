import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpenIcon, CodeIcon, RocketIcon } from "lucide-react";
import { RouterProvider } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import meta from "./meta.json";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

const DOCS = [
  {
    href: "#getting-started",
    title: "Getting started",
    icon: RocketIcon,
    text: "Install and set up.",
  },
  { href: "#guides", title: "Guides", icon: BookOpenIcon, text: "Step-by-step walkthroughs." },
  { href: "#api", title: "API reference", icon: CodeIcon, text: "Every prop, documented." },
];

// Links go through react-aria's router instead of navigating the preview.
const navigate = fn();

const componentMeta = {
  title: "ui/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { "aria-label": "Main" },
  decorators: [
    (Story) => (
      <RouterProvider navigate={navigate}>
        <Story />
      </RouterProvider>
    ),
  ],
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="#overview"
            aria-current="page"
            className={navigationMenuTriggerStyle()}
          >
            Overview
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Documentation</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-1">
              {DOCS.map(({ href, title, icon: Icon, text }) => (
                <li key={href}>
                  <NavigationMenuLink href={href} className="items-start">
                    <Icon className="mt-0.5" aria-hidden="true" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{title}</span>
                      <span className="text-muted-foreground">{text}</span>
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1">
              <li>
                <NavigationMenuLink href="#about">About</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#careers">Careers</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="https://react-spectrum.adobe.com/react-aria/"
            target="_blank"
            className={navigationMenuTriggerStyle()}
          >
            External
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
} satisfies Meta<typeof NavigationMenu>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Plain links aren't disclosure buttons.
    await expect(canvas.getByRole("link", { name: "External" })).not.toHaveAttribute(
      "aria-expanded",
    );

    const trigger = canvas.getByRole("button", { name: "Documentation" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dropdown = await body().findByRole("dialog", { name: "Documentation" });
    await expect(within(dropdown).getAllByRole("link")).toHaveLength(3);

    // Pressing the trigger again closes it.
    await userEvent.click(trigger);
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Escape closes the dropdown and returns focus to its trigger. */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Documentation" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dropdown = await body().findByRole("dialog", { name: "Documentation" });
    await waitFor(() => expect(dropdown).toContainElement(document.activeElement as HTMLElement));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    // Focus comes back once the exit animation ends.
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

/** Following a link inside a dropdown closes it. */
export const ClosesOnNavigate: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Company" }));
    const dropdown = await body().findByRole("dialog", { name: "Company" });
    await userEvent.click(within(dropdown).getByRole("link", { name: "Careers" }));
    await expect(navigate).toHaveBeenLastCalledWith("#careers", undefined);
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Company" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};
