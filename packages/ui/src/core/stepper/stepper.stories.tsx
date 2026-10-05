import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, type within } from "storybook/test";
import { Button } from "@/core/button/button";
import meta from "./meta.json";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./stepper";

const STEPS = [
  { step: 1, title: "Account", description: "Create your account" },
  { step: 2, title: "Profile", description: "Set up your profile" },
  { step: 3, title: "Review", description: "Confirm your details" },
];

const nav = (
  <StepperNav aria-label="Sign-up steps">
    {STEPS.map(({ step, title, description }) => (
      <StepperItem key={step} step={step}>
        <StepperTrigger className="flex flex-col">
          <StepperIndicator>{step}</StepperIndicator>
          <StepperTitle>{title}</StepperTitle>
          <StepperDescription>{description}</StepperDescription>
        </StepperTrigger>
        {step < STEPS.length && <StepperSeparator />}
      </StepperItem>
    ))}
  </StepperNav>
);

const componentMeta = {
  title: "ui/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
  },
  args: { defaultValue: 2, className: "w-md", onValueChange: fn(), children: nav },
} satisfies Meta<typeof Stepper>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const tab = (canvas: ReturnType<typeof within>, name: RegExp) => canvas.getByRole("tab", { name });

export const Default: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
    await expect(tab(canvas, /Account/)).toHaveAttribute("data-state", "completed");
    await expect(tab(canvas, /Profile/)).toHaveAttribute("aria-selected", "true");
    await expect(tab(canvas, /Profile/)).toHaveAttribute("data-state", "active");
    await expect(tab(canvas, /Review/)).toHaveAttribute("data-state", "inactive");

    await userEvent.click(tab(canvas, /Review/));
    await expect(tab(canvas, /Review/)).toHaveAttribute("aria-selected", "true");
    await expect(tab(canvas, /Profile/)).toHaveAttribute("data-state", "completed");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(3);
  },
};

/** Arrow keys move focus only; Enter or Space selects the focused step. */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(tab(canvas, /Profile/)).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect(tab(canvas, /Review/)).toHaveFocus();
    await expect(tab(canvas, /Profile/)).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Enter}");
    await expect(tab(canvas, /Review/)).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Home}");
    await expect(tab(canvas, /Account/)).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(tab(canvas, /Account/)).toHaveAttribute("aria-selected", "true");
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    className: undefined,
    children: (
      <StepperNav aria-label="Sign-up steps">
        {STEPS.map(({ step, title, description }) => (
          <StepperItem key={step} step={step}>
            <StepperTrigger className="items-start">
              <StepperIndicator>{step}</StepperIndicator>
              <div className="flex flex-col items-start gap-0.5 text-left">
                <StepperTitle>{title}</StepperTitle>
                <StepperDescription>{description}</StepperDescription>
              </div>
            </StepperTrigger>
            {step < STEPS.length && <StepperSeparator />}
          </StepperItem>
        ))}
      </StepperNav>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    await userEvent.click(tab(canvas, /Profile/));
    await userEvent.keyboard("{ArrowDown}");
    await expect(tab(canvas, /Review/)).toHaveFocus();
  },
};

/** Each step reveals its own panel. */
export const WithContent: Story = {
  args: {
    defaultValue: 1,
    className: "w-md space-y-8",
    children: (
      <>
        {nav}
        <StepperPanel className="text-sm">
          {STEPS.map(({ step, title }) => (
            <StepperContent key={step} value={step}>
              Content of the “{title}” step.
            </StepperContent>
          ))}
        </StepperPanel>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Account");
    await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName(/Account/);
    await userEvent.click(tab(canvas, /Profile/));
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Profile");
    await expect(canvas.queryByText(/Content of the “Account”/)).toBeNull();
  },
};

/** Back/Next buttons drive the current step from outside. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState(1);
    return (
      <div className="flex w-md flex-col gap-6">
        <Stepper {...args} value={value} onValueChange={setValue} />
        <div className="flex justify-between">
          <Button variant="outline" isDisabled={value === 1} onPress={() => setValue(value - 1)}>
            Back
          </Button>
          <Button isDisabled={value === STEPS.length} onPress={() => setValue(value + 1)}>
            Next
          </Button>
        </div>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(tab(canvas, /Account/)).toHaveAttribute("aria-selected", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(tab(canvas, /Review/)).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("button", { name: "Next" })).toBeDisabled();
    await userEvent.click(tab(canvas, /Account/));
    await expect(tab(canvas, /Account/)).toHaveAttribute("aria-selected", "true");
  },
};

/** Per-state indicators, a loading current step, a forced-completed step and a disabled one. */
export const IndicatorsAndStates: Story = {
  args: {
    indicators: {
      completed: <CheckIcon className="size-3.5" aria-hidden="true" />,
      loading: <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden="true" />,
    },
    children: (
      <StepperNav aria-label="Checkout steps">
        <StepperItem step={1}>
          <StepperTrigger className="flex flex-col">
            <StepperIndicator>1</StepperIndicator>
            <StepperTitle>Cart</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={2} isLoading>
          <StepperTrigger className="flex flex-col">
            <StepperIndicator>2</StepperIndicator>
            <StepperTitle>Payment</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={3} isCompleted>
          <StepperTrigger className="flex flex-col">
            <StepperIndicator>3</StepperIndicator>
            <StepperTitle>Address</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem step={4} isDisabled>
          <StepperTrigger className="flex flex-col">
            <StepperIndicator>4</StepperIndicator>
            <StepperTitle>Done</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </StepperNav>
    ),
  },
  play: async ({ canvasElement, canvas }) => {
    const indicator = (name: RegExp) =>
      tab(canvas, name).querySelector("[data-slot=stepper-indicator]");
    await expect(indicator(/Cart/)?.querySelector("svg")).not.toBeNull();
    await expect(tab(canvas, /Payment/)).toHaveAttribute("data-loading", "true");
    await expect(indicator(/Payment/)?.querySelector("svg.animate-spin")).not.toBeNull();
    await expect(tab(canvas, /Address/)).toHaveAttribute("data-state", "completed");

    const done = tab(canvas, /Done/);
    await expect(done).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(done);
    await expect(done).toHaveAttribute("aria-selected", "false");

    // Keyboard navigation skips the disabled step.
    await userEvent.click(tab(canvas, /Address/));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvasElement.ownerDocument.activeElement).not.toBe(done));
  },
};
