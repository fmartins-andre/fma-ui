import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ColorPicker, ColorPickerPanel } from "./color-picker";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    value: "oklch(0.6 0.2 260)",
    onChange: () => {},
    label: "Primary color",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex items-center gap-3">
        <ColorPicker {...args} value={value} onChange={setValue} />
        <code className="text-xs">{value}</code>
      </div>
    );
  },
} satisfies Meta<typeof ColorPicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A swatch that opens the OKLCH sliders in a popover." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Primary color" }));
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Primary color" });
    await waitFor(() => expect(dialog).toBeVisible());

    const lightness = within(dialog).getByRole("slider", { name: "Lightness" });
    lightness.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByText(/^oklch\(0\.601 /)).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
  },
};

export const WithContrast: Story = {
  args: { value: "oklch(0.75 0.15 250)", contrastWith: "#ffffff", label: "Link color" },
  parameters: {
    docs: {
      description: {
        story:
          "contrastWith shows the ratio against that background, hatches the lightness that fails AA and enables the Fix buttons.",
      },
    },
  },
};

/** Inline panel, no popover. */
export const Panel: Story = {
  args: { value: "oklch(0.75 0.15 250)", contrastWith: "#ffffff" },
  parameters: {
    docs: {
      description: {
        story:
          "ColorPickerPanel renders the sliders inline. Fix to AA moves to the nearest lightness reaching 4.5:1, keeping the hue.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPickerPanel value={value} onChange={setValue} contrastWith={args.contrastWith} />
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ratio = canvasElement.querySelector("[data-slot=color-picker-ratio]");
    expect(ratio).toHaveAttribute("data-level", "Fail");
    expect(canvasElement.querySelectorAll("[data-slot=color-picker-failing]").length).toBe(1);

    await userEvent.click(canvas.getByRole("button", { name: "Fix to AA" }));
    await waitFor(() => expect(ratio).toHaveAttribute("data-level", "AA"));
    expect(Number.parseFloat(ratio?.textContent ?? "")).toBeGreaterThanOrEqual(4.5);
    expect(canvas.getByRole("button", { name: "Fix to AA" })).toBeDisabled();
    // Hue is kept.
    expect(canvas.getByText(/^oklch\(\S+ \S+ 250\)$/)).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Fix to AAA" }));
    await waitFor(() => expect(ratio).toHaveAttribute("data-level", "AAA"));

    // Presets failing AA on white are hatched; dark ones aren't.
    expect(canvas.getByRole("option", { name: /^neutral-200,/ })).toHaveAttribute("data-failing");
    expect(canvas.getByRole("option", { name: /^neutral-800,/ })).not.toHaveAttribute(
      "data-failing",
    );
  },
};

export const Swatches: Story = {
  args: { value: "oklch(0.6 0.2 260)" },
  parameters: {
    docs: {
      description: {
        story:
          "The preset grid (Tailwind's palette by default) sets the color in one click; the matching swatch shows as selected. Arrow keys move through the grid.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPickerPanel value={value} onChange={setValue} />
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("option")).toHaveLength(60);
    const teal = canvas.getByRole("option", { name: "teal-500" });
    await userEvent.click(teal);
    await waitFor(() => expect(teal).toHaveAttribute("aria-selected", "true"));
    // Out-of-sRGB chroma is clamped; lightness and hue are kept.
    expect(canvas.getByText(/^oklch\(0\.704 \S+ 182\.503\)$/)).toBeInTheDocument();

    await userEvent.keyboard("{ArrowRight}");
    expect(canvas.getByRole("option", { name: "cyan-500" })).toHaveFocus();
  },
};

export const CustomSwatches: Story = {
  args: {
    value: "#0f172a",
    label: "Brand color",
    swatches: [
      { color: "#0f172a", name: "Ink" },
      { color: "#f97316", name: "Ember" },
      { color: "#14b8a6", name: "Lagoon" },
      { color: "#e11d48", name: "Rose" },
    ],
    swatchColumns: 4,
  },
  parameters: {
    docs: {
      description: {
        story:
          "swatches takes CSS colors or { color, name } pairs (the name is the accessible label); swatchColumns sets the grid width. Pass [] to hide the grid.",
      },
    },
  },
};
