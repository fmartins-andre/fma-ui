import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
  },
  // `render` builds its own JSX children below — this placeholder only
  // satisfies AlertDialog's required `children` prop type for CSF3.
  args: { children: null },
  render: (args) => (
    <AlertDialogTrigger>
      <Button variant="outline">Open</Button>
      <AlertDialog {...args}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  ),
} satisfies Meta<typeof AlertDialog>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "The default confirmation dialog composition." } },
  },
};

export const OpenAndCancel: Story = {
  parameters: {
    docs: {
      description: { story: "Verifies the dialog opens on trigger click and closes via Cancel." },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(body.getByRole("alertdialog")).toBeVisible());

    await userEvent.click(body.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};
