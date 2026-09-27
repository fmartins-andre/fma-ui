import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    isDisabled: { control: "boolean" },
  },
  args: {
    className: "w-96",
  },
  render: (args) => (
    <Collapsible {...args}>
      <CollapsibleTrigger className="flex gap-2">
        <h3 className="font-semibold">Can I use this in my project?</h3>
        <InfoIcon className="size-6" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        Yes. Free to use for personal and commercial projects. No attribution required.
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const OpensAndCloses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");

    await userEvent.click(trigger);
    expect(canvas.queryByText(/yes\. free to use/i)).toBeVisible();

    await userEvent.click(trigger);
    // RAC's DisclosurePanel uses hidden="until-found" — it stays in the DOM,
    // just not visible, unlike a fully unmounted panel.
    expect(canvas.queryByText(/yes\. free to use/i)).not.toBeVisible();
  },
};
