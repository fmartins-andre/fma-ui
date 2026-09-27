import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClockIcon, FileTextIcon, ImageIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { expect, userEvent, within } from "storybook/test";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "./attachment";
import meta from "./meta.json";

function FileAttachment({
  name = "sales-dashboard.pdf",
  description = "PDF · 2.4 MB",
  icon = <FileTextIcon />,
  ...props
}: React.ComponentProps<typeof Attachment> & {
  name?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Attachment {...props}>
      <AttachmentMedia>{icon}</AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
        <AttachmentDescription>{description}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label={`Remove ${name}`}>
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

const componentMeta = {
  title: "ui/Attachment",
  component: Attachment,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    state: { control: "select", options: ["idle", "uploading", "processing", "error", "done"] },
    size: { control: "select", options: ["default", "sm", "xs"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  args: {
    state: "done",
    size: "default",
    orientation: "horizontal",
  },
  render: (args) => (
    <div className="w-full min-w-sm max-w-md">
      <FileAttachment {...args} />
    </div>
  ),
} satisfies Meta<typeof Attachment>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Uploading: Story = {
  args: { state: "uploading" },
  render: (args) => (
    <FileAttachment {...args} name="design-system.zip" description="Uploading · 64%" />
  ),
};

export const ErrorState: Story = {
  args: { state: "error" },
  render: (args) => (
    <FileAttachment
      {...args}
      name="financial-model.xlsx"
      description="Upload failed. Try again."
      icon={<ClockIcon />}
    />
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <FileAttachment
      {...args}
      name="workspace.png"
      description="PNG · 820 KB"
      icon={<ImageIcon />}
    />
  ),
};

export const Group: Story = {
  render: () => (
    <AttachmentGroup tabIndex={0} role="group" aria-label="Attachments">
      <FileAttachment name="briefing-notes.pdf" description="PDF · 1.4 MB" />
      <FileAttachment name="workspace.png" description="PNG · 820 KB" icon={<ImageIcon />} />
      <FileAttachment name="customers.csv" description="CSV · 18 KB" />
    </AttachmentGroup>
  ),
};

export const ActionIsIndependentlyClickable: Story = {
  render: () => <FileAttachment name="handoff.md" description="Markdown · 8 KB" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Remove handoff.md" });
    await userEvent.click(button);
    expect(button).toHaveFocus();
  },
};

export const WithTrigger: Story = {
  render: () => (
    <Attachment>
      <AttachmentMedia>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>research-summary.pdf</AttachmentTitle>
        <AttachmentDescription>Click to preview</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove research-summary.pdf">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
      <AttachmentTrigger aria-label="Open research-summary.pdf" />
    </Attachment>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: "Open research-summary.pdf" })).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: "Remove research-summary.pdf" })).toBeInTheDocument();
  },
};
