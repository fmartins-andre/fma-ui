import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "storybook/test";
import meta from "./meta.json";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

const componentMeta = {
  title: "ui/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: { story: "Two side-by-side panels, dragged wider/narrower via the handle." },
    },
  },
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="h-48 w-96 rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">One</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">Two</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("separator");
  },
};

export const Vertical: Story = {
  parameters: {
    docs: { description: { story: 'orientation="vertical" stacks panels top to bottom instead.' } },
  },
  render: () => (
    <ResizablePanelGroup orientation="vertical" className="h-64 w-72 rounded-lg border">
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">Header</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">Content</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
