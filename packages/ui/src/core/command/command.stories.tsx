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
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
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

export const Default: Story = {};

export const FiltersResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // CommandInput renders inside react-aria-components' SearchField, whose
    // input has role "searchbox" — not "combobox".
    const input = canvas.getByRole("searchbox");

    // CommandList/CommandItem render react-aria-components' Menu/MenuItem
    // (role="menu"/"menuitem") — not a listbox, so items are "menuitem", not
    // "option".
    // Filtering runs off Autocomplete's async state — findBy*/waitFor retry
    // instead of asserting synchronously right after typing.
    await userEvent.type(input, "calen", { delay: 100 });
    expect(
      await canvas.findAllByRole("menuitem", { name: /calendar/i }, { timeout: 5000 }),
    ).toHaveLength(1);

    await userEvent.clear(input);
    await userEvent.type(input, "story", { delay: 100 });
    await waitFor(() => expect(canvas.queryAllByRole("menuitem")).toHaveLength(0), {
      timeout: 5000,
    });
    expect(canvas.getByText(/no results/i)).toBeVisible();
  },
};
