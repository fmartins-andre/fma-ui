import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, SearchIcon, TerminalIcon } from "lucide-react";
import { expect, userEvent } from "storybook/test";
import meta from "./meta.json";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "./trace";

const componentMeta = {
  title: "ui/Trace",
  component: Trace,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof Trace>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: (args) => (
    <Trace {...args} className="max-w-md">
      <TraceLine>
        <TraceIcon>
          <SearchIcon />
        </TraceIcon>
        <TraceTitle>Searched the codebase</TraceTitle>
        <TraceDescription>12 results</TraceDescription>
      </TraceLine>
      <TraceLine status="running">
        <TraceIcon>
          <FileTextIcon />
        </TraceIcon>
        <TraceTitle>Reading badge.tsx</TraceTitle>
      </TraceLine>
      <TraceLine status="pending">
        <TraceIcon>
          <TerminalIcon />
        </TraceIcon>
        <TraceTitle>Running tests</TraceTitle>
      </TraceLine>
      <TraceLine status="error">
        <TraceIcon>
          <TerminalIcon />
        </TraceIcon>
        <TraceTitle>Type check failed</TraceTitle>
      </TraceLine>
    </Trace>
  ),
};

export const Collapsible: Story = {
  render: (args) => (
    <Trace {...args} className="max-w-md">
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <TerminalIcon />
            </TraceIcon>
            <TraceTitle>Ran pnpm test</TraceTitle>
            <TraceDescription>3.2s</TraceDescription>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>All 142 tests passed.</TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Ran pnpm test/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("All 142 tests passed.")).toBeVisible();
  },
};
