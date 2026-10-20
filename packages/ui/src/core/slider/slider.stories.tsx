import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import { Slider } from "./slider";

const componentMeta = {
  title: "ui/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    minValue: { control: "number" },
    maxValue: { control: "number" },
    step: { control: "number" },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    isDisabled: { control: "boolean" },
  },
  args: {
    defaultValue: 33,
  },
  render: (args) => (
    <div className="w-64">
      <Slider {...args} />
    </div>
  ),
} satisfies Meta<typeof Slider>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A single-thumb slider with one draggable value." } },
  },
};

// A multi-value array renders one thumb per value, not a separate "range" prop.
export const Range: Story = {
  args: { defaultValue: [20, 80] },
  parameters: {
    docs: {
      description: { story: "A defaultValue array renders two thumbs for a min/max range." },
    },
  },
};

export const Vertical: Story = {
  args: { orientation: "vertical", marks: [0, 50, 100] },
  parameters: {
    docs: {
      description: {
        story: 'orientation="vertical" for a top-to-bottom slider; marks sit beside the track.',
      },
    },
  },
  render: (args) => (
    <div className="h-40">
      <Slider {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  parameters: {
    docs: { description: { story: "isDisabled prevents dragging and dims the track/thumb." } },
  },
};

/**
 * Stops for common amounts: `marks` under the track (a click moves the thumb
 * there), a `label` and the value shown with `formatValue`.
 */
export const WithMarks: Story = {
  args: {
    label: "Notas fiscais por mês",
    showValue: true,
    formatValue: (value) => `${value} notas`,
    minValue: 0,
    maxValue: 500,
    step: 50,
    defaultValue: 100,
    marks: [0, 100, 200, 300, 400, 500],
    onChangeEnd: fn(),
  },
  render: (args) => (
    <div className="w-80">
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Notas fiscais por mês" });
    await expect(canvas.getByText("100 notas")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "300" }));
    await expect(slider).toHaveValue("300");
    await expect(canvas.getByText("300 notas")).toBeInTheDocument();
    await expect(args.onChangeEnd).toHaveBeenLastCalledWith(300);

    // Focus lands on the thumb, so the arrow keys continue from the mark.
    await expect(slider).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByText("350 notas")).toBeInTheDocument();
  },
};

/** A range with currency formatting and custom mark labels; a mark moves the nearest thumb. */
export const RangeWithMarks: Story = {
  args: {
    label: "Faturamento mensal",
    showValue: true,
    minValue: 0,
    maxValue: 100_000,
    step: 5_000,
    defaultValue: [20_000, 60_000],
    formatOptions: { style: "currency", currency: "BRL", maximumFractionDigits: 0 },
    marks: [
      { value: 0, label: "R$ 0" },
      { value: 50_000, label: "R$ 50 mil" },
      { value: 100_000, label: "R$ 100 mil" },
    ],
  },
  render: (args) => (
    <div className="w-80">
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "R$ 100 mil" }));
    const [min, max] = canvas.getAllByRole("slider");
    await expect(min).toHaveValue("20000");
    await expect(max).toHaveValue("100000");
  },
};

/**
 * `limit` caps the value below `maxValue`: the scale keeps its marks, the
 * track above the limit is drawn as unavailable and its marks are disabled.
 * `description` says why, and screen readers hear it with the value.
 */
export const Limit: Story = {
  args: {
    label: "Notas adicionais",
    showValue: true,
    formatValue: (value) => `${value} notas`,
    minValue: 0,
    maxValue: 60,
    step: 10,
    defaultValue: 10,
    limit: 20,
    description: "Só 20 disponíveis neste ciclo.",
    marks: [0, 10, 20, 30, 40, 50, 60],
    onChange: fn(),
    onChangeEnd: fn(),
  },
  render: (args) => (
    <div className="w-80">
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", { name: "Notas adicionais" });
    await expect(slider).toHaveAccessibleDescription("Só 20 disponíveis neste ciclo.");
    await expect(canvas.getByRole("button", { name: "30" })).toBeDisabled();

    // The keyboard stops at the limit, not at maxValue.
    await userEvent.click(canvas.getByRole("button", { name: "20" }));
    await expect(slider).toHaveValue("20");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{End}");
    await expect(slider).toHaveValue("20");
    await expect(canvas.getByText("20 notas")).toBeInTheDocument();
    await expect(args.onChangeEnd).toHaveBeenLastCalledWith(20);
    await expect(args.onChange).not.toHaveBeenCalledWith(30);

    await userEvent.keyboard("{Home}");
    await expect(slider).toHaveValue("0");
  },
};
