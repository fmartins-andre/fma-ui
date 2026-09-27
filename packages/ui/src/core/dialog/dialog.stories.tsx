import type { Meta, StoryObj } from "@storybook/react-vite";
import { DialogTrigger } from "react-aria-components";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  // `render` builds its own JSX children below — this placeholder only
  // satisfies Dialog's required `children` prop type for CSF3.
  args: { children: null },
  render: (args) => (
    <DialogTrigger>
      <Button variant="outline">Open</Button>
      <Dialog {...args}>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button>Continue</Button>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
} satisfies Meta<typeof Dialog>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const NoCloseButton: Story = {
  args: { showCloseButton: false },
};

export const OpensAndClosesWithCancel: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvasBody.findByRole("button", { name: /open/i }));
    expect(await canvasBody.findByRole("dialog")).toBeInTheDocument();

    await userEvent.click(await canvasBody.findByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(canvasBody.queryByRole("dialog")).not.toBeInTheDocument();
    });
  },
};

export const OpensAndClosesWithX: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvasBody.findByRole("button", { name: /open/i }));
    expect(await canvasBody.findByRole("dialog")).toBeInTheDocument();

    await userEvent.click(await canvasBody.findByRole("button", { name: /close/i }));
    await waitFor(() => {
      expect(canvasBody.queryByRole("dialog")).not.toBeInTheDocument();
    });
  },
};
