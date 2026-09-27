import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import meta from "./meta.json";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

const componentMeta = {
  title: "ui/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  render: (args) => (
    <Combobox {...args}>
      <ComboboxInput placeholder="Select a framework" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList items={frameworks.map((item) => ({ id: item, name: item }))}>
          {(item) => <ComboboxItem id={item.id}>{item.name}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
} satisfies Meta<typeof Combobox>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const FiltersAndSelects: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);
    const input = await canvasBody.findByRole("combobox");

    await userEvent.type(input, "nex", { delay: 50 });
    const options = await canvasBody.findAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(/next\.js/i);

    await userEvent.click(await canvasBody.findByRole("option", { name: /next\.js/i }));
    expect(input).toHaveValue("Next.js");

    // Storybook's addon-vitest runs multiple story files in the same
    // browser context — leaving this input focused with a value bled into
    // an unrelated later test (command.stories.tsx's Autocomplete).
    input.blur();
  },
};
