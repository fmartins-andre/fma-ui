import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    allowsMultipleExpanded: { control: "boolean" },
    isDisabled: { control: "boolean" },
  },
  args: {
    allowsMultipleExpanded: false,
    isDisabled: false,
  },
  render: (args) => (
    <div className="w-96">
      <Accordion {...args}>
        <AccordionItem id="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that match the other components' aesthetic.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-3">
          <AccordionTrigger>Is it animated?</AccordionTrigger>
          <AccordionContent>
            Yes. It's animated by default via CSS height transitions.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
} satisfies Meta<typeof Accordion>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "The default single-open accordion with three items." } },
  },
};

export const OpensOnlyOneAtATime: Story = {
  args: { allowsMultipleExpanded: false },
  parameters: {
    docs: {
      description: { story: "Only one item can be open at a time — opening one closes the rest." },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");
    const expandedCount = () =>
      triggers.filter((t) => t.getAttribute("aria-expanded") === "true").length;

    for (const trigger of triggers) {
      await userEvent.click(trigger);
      await waitFor(() => expect(expandedCount()).toBe(1));
    }

    await userEvent.click(triggers[triggers.length - 1]);
    await waitFor(() => expect(expandedCount()).toBe(0));
  },
};

export const AllowsMultipleExpanded: Story = {
  args: { allowsMultipleExpanded: true },
  parameters: {
    docs: {
      description: { story: "allowsMultipleExpanded lets several items stay open at once." },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");
    const expandedCount = () =>
      triggers.filter((t) => t.getAttribute("aria-expanded") === "true").length;

    for (let i = 0; i < triggers.length; i++) {
      await userEvent.click(triggers[i]);
      await waitFor(() => expect(expandedCount()).toBe(i + 1));
    }
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  parameters: {
    docs: { description: { story: "isDisabled blocks the trigger from expanding." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getAllByRole("button")[0];
    await userEvent.click(trigger, { pointerEventsCheck: 0 });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
