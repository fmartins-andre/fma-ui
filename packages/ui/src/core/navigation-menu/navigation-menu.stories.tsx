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

// In the test runner, userEvent.hover's events carry (0, 0) and the runner's
// real pointer fires its own pointerover elsewhere, which ends react-aria's
// hover at once. Fire the pointer events a mouse would, at the element's centre.
let lastHovered: Element | null = null;
function pointTo(el: Element) {
  const box = el.getBoundingClientRect();
  const init = {
    bubbles: true,
    pointerType: "mouse",
    clientX: box.left + box.width / 2,
    clientY: box.top + box.height / 2,
  };
  lastHovered?.dispatchEvent(new PointerEvent("pointerout", { ...init, relatedTarget: el }));
  el.dispatchEvent(new PointerEvent("pointerover", { ...init, relatedTarget: lastHovered }));
  el.dispatchEvent(new PointerEvent("pointermove", init));
  lastHovered = el;
}

/**
 * With `openOnHover`, resting on a trigger opens a non-modal dropdown that
 * leaves focus alone and closes when the pointer leaves; moving to another
 * trigger switches at once. Pressing the trigger keeps it open as a dialog.
 */
export const OpenOnHover: Story = {
  args: { openOnHover: true },
  play: async ({ canvas }) => {
    // Park the runner's real pointer first, so a late pointerover from it
    // doesn't end the synthetic hovers below.
    await userEvent.hover(canvas.getByRole("link", { name: "Overview" }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    lastHovered = null;
    const docs = canvas.getByRole("button", { name: "Documentation" });
    const company = canvas.getByRole("button", { name: "Company" });

    pointTo(docs);
    const peek = await body().findByRole("group", { name: "Documentation" });
    await expect(docs).toHaveAttribute("aria-expanded", "true");
    await expect(peek).not.toContainElement(document.activeElement as HTMLElement);

    pointTo(company);
    await body().findByRole("group", { name: "Company" });
    await expect(docs).toHaveAttribute("aria-expanded", "false");

    // Resting on the dropdown keeps it open; leaving it closes it.
    pointTo(body().getByRole("link", { name: "Careers" }));
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(company).toHaveAttribute("aria-expanded", "true");
    pointTo(canvas.getByRole("link", { name: "Overview" }));
    await waitFor(() => expect(company).toHaveAttribute("aria-expanded", "false"));

    // Escape closes a hover-opened dropdown too.
    pointTo(company);
    await body().findByRole("group", { name: "Company" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(company).toHaveAttribute("aria-expanded", "false"));

    // Pressing turns the peek into a regular dropdown that takes focus.
    pointTo(canvas.getByRole("link", { name: "Overview" }));
    pointTo(docs);
    await body().findByRole("group", { name: "Documentation" });
    await userEvent.click(docs);
    const dialog = await body().findByRole("dialog", { name: "Documentation" });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(docs).toHaveFocus());
  },
};
