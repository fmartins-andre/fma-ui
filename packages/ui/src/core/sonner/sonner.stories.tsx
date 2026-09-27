import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/button";
import meta from "./meta.json";
import { Toaster } from "./sonner";

const componentMeta = {
  title: "ui/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
  args: {
    position: "bottom-right",
  },
  // Toasts are triggered imperatively via sonner's own toast() — Toaster only
  // renders the portal/container that displays whatever toast() pushes.
  render: (args) => (
    <div className="flex min-h-64 items-center justify-center">
      <Button onPress={() => toast("Event has been created", { description: "Just now" })}>
        Show Toast
      </Button>
      <Toaster {...args} />
    </div>
  ),
} satisfies Meta<typeof Toaster>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "Click the button to push a toast via sonner's toast()." } },
  },
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: { story: "Verifies a toast actually appears after calling toast()." },
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = await body.findByRole("button", { name: /show toast/i });
    toast.dismiss();
    await waitFor(() => expect(body.queryByRole("listitem")).not.toBeInTheDocument());
    await userEvent.click(trigger);
    await waitFor(() => expect(body.queryByRole("listitem")).toBeInTheDocument());
  },
};
