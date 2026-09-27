import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertCircle, Info } from "lucide-react";
import { expect, within } from "storybook/test";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "radio", options: ["default", "destructive"] },
  },
  args: {
    variant: "default",
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "The default informational alert." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toBeVisible();
  },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  parameters: {
    docs: { description: { story: 'variant="destructive" for errors or warnings.' } },
  },
  render: (args) => (
    <Alert {...args}>
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  parameters: {
    docs: { description: { story: "A leading icon placed before the title." } },
  },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Info</AlertTitle>
      <AlertDescription>
        Your profile is visible to other members of your organization.
      </AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  parameters: {
    docs: {
      description: { story: "AlertAction adds an inline control (link/button) to the alert." },
    },
  },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>Version 2.0 is ready to install. Restart to apply.</AlertDescription>
      <AlertAction>
        <button type="button" className="text-sm font-medium underline underline-offset-4">
          Restart now
        </button>
      </AlertAction>
    </Alert>
  ),
};
