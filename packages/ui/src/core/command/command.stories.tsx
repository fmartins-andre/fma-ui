import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Command",
  component: Command,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    className: "w-96 rounded-lg border shadow-md",
    // `render` builds its own JSX children below — this placeholder only
    // satisfies Command's required `children` prop type for CSF3.
    children: null,
  },
  render: (args) => (
    <Command {...args}>
      <CommandInput placeholder="Type a command or search..." />
      {/* The empty state goes through renderEmptyState: a plain child in the
          collection would empty the whole list. */}
      <CommandList renderEmptyState={() => <CommandEmpty>No results found.</CommandEmpty>}>
        <CommandGroup heading="Suggestions">
          <CommandItem id="calendar">Calendar</CommandItem>
          <CommandItem id="search-emoji">Search Emoji</CommandItem>
          <CommandItem id="calculator" isDisabled>
            Calculator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem id="profile">Profile</CommandItem>
          <CommandItem id="billing">Billing</CommandItem>
          <CommandItem id="settings">Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
} satisfies Meta<typeof Command>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("menuitem")).toHaveLength(6);
    await expect(canvas.queryByText(/no results/i)).toBeNull();
  },
};

export const FiltersResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // CommandInput renders inside react-aria-components' SearchField, whose
    // input has role "searchbox" — not "combobox".
    const input = canvas.getByRole("searchbox");

    // CommandList/CommandItem render react-aria-components' Menu/MenuItem
    // (role="menu"/"menuitem") — not a listbox, so items are "menuitem", not
    // "option".
    await userEvent.type(input, "calen");
    await waitFor(() => expect(canvas.getAllByRole("menuitem")).toHaveLength(1));
    await expect(canvas.getByRole("menuitem", { name: /calendar/i })).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, "story");
    // The empty state itself renders in a "menuitem" wrapper, so check the
    // menu's empty flag instead of counting items.
    await waitFor(() => expect(canvas.getByRole("menu")).toHaveAttribute("data-empty", "true"));
    await expect(canvas.getByText(/no results/i)).toBeVisible();
  },
};
