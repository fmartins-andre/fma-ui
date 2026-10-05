import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent } from "storybook/test";
import { Button } from "@/core/button/button";
import meta from "./meta.json";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "./timeline";

const STEPS = [
  {
    step: 1,
    date: "Mar 2024",
    title: "Project kickoff",
    content: "Repository and architecture set up.",
  },
  { step: 2, date: "Apr 2024", title: "Beta release", content: "Beta shipped to early testers." },
  { step: 3, date: "Jun 2024", title: "Launch", content: "Platform available to everyone." },
];

const items = STEPS.map(({ step, date, title, content }) => (
  <TimelineItem key={step} step={step}>
    <TimelineHeader>
      <TimelineDate>{date}</TimelineDate>
      <TimelineTitle>{title}</TimelineTitle>
      <TimelineIndicator />
    </TimelineHeader>
    <TimelineSeparator />
    <TimelineContent>{content}</TimelineContent>
  </TimelineItem>
));

const componentMeta = {
  title: "ui/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    orientation: { control: "radio", options: ["vertical", "horizontal"] },
    value: { control: { type: "number", min: 0, max: 3 } },
  },
  args: { value: 2, className: "w-sm", children: items },
} satisfies Meta<typeof Timeline>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const itemOf = (el: HTMLElement) => el.closest("[data-slot=timeline-item]");

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("list")).toBeInTheDocument();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(itemOf(canvas.getByText("Project kickoff"))).toHaveAttribute("data-completed");
    await expect(itemOf(canvas.getByText("Beta release"))).toHaveAttribute("aria-current", "step");
    await expect(itemOf(canvas.getByText("Launch"))).not.toHaveAttribute("data-completed");
  },
};

export const Horizontal: Story = {
  args: { orientation: "horizontal", className: "w-2xl" },
};

/** The current step comes from outside: here, a few buttons. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState(1);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {STEPS.map(({ step }) => (
            <Button key={step} size="sm" variant="outline" onPress={() => setValue(step)}>
              Step {step}
            </Button>
          ))}
        </div>
        <Timeline {...args} value={value} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(itemOf(canvas.getByText("Launch"))).not.toHaveAttribute("data-completed");
    await userEvent.click(canvas.getByRole("button", { name: "Step 3" }));
    await expect(itemOf(canvas.getByText("Launch"))).toHaveAttribute("aria-current", "step");
    await expect(canvas.getAllByRole("listitem").filter((li) => li.dataset.completed)).toHaveLength(
      3,
    );
  },
};
