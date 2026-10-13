import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerPanel,
  ColorPickerPreview,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "./color-picker";
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
          "ColorPickerPanel renders the sliders inline; each track hatches what fails AA against contrastWith. Fix to AA moves to the nearest lightness reaching 4.5:1, keeping the hue.",
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
    const failing = (channel: string) =>
      canvasElement.querySelectorAll(`[data-channel=${channel}] [data-slot=color-picker-failing]`);
    // Light blue on white: only the dark end of lightness passes; every track shows it.
    expect(failing("lightness").length).toBe(1);
    expect(failing("hue").length).toBeGreaterThan(0);

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

export const Composition: Story = {
  args: { value: "oklch(0.62 0.19 30)", label: "Fill" },
  parameters: {
    docs: {
      description: {
        story:
          "ColorPicker holds the color and renders no element; its parts go in any layout. Here a trigger with its own content opens vertical lightness, chroma and hue tracks beside the presets.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex flex-col items-start gap-3">
        <ColorPicker value={value} onChange={setValue} label={args.label}>
          <ColorPickerTrigger aria-label="Fill">
            <ColorPickerSwatch />
            Fill
          </ColorPickerTrigger>
          <ColorPickerContent className="w-auto">
            <ColorPickerPanel>
              <div className="flex gap-3">
                <ColorPickerSlider channel="lightness" orientation="vertical" />
                <ColorPickerSlider channel="chroma" orientation="vertical" />
                <ColorPickerSlider channel="hue" orientation="vertical" />
                <ColorPickerSwatches columns={4} className="w-36 self-start" />
              </div>
            </ColorPickerPanel>
          </ColorPickerContent>
        </ColorPicker>
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Fill" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Fill" });
    const sliders = within(dialog).getAllByRole("slider");
    expect(sliders).toHaveLength(3);
    for (const slider of sliders) expect(slider).toHaveAttribute("aria-orientation", "vertical");

    within(dialog).getByRole("slider", { name: "Hue" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(canvas.getByText(/^oklch\(0\.62 \S+ 31\)$/)).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
  },
};

export const ChannelMixer: Story = {
  args: { value: "#3b82f6", contrastWith: "#ffffff" },
  parameters: {
    docs: {
      description: {
        story:
          "Parts work inline too, with no popover. Each slider takes a channel and a colorSpace (here RGB and HSB); with contrastWith every track hatches the part that fails AA against it.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPicker value={value} onChange={setValue} contrastWith={args.contrastWith}>
          <ColorPickerPreview />
          {(["red", "green", "blue"] as const).map((channel) => (
            <ColorPickerSlider key={channel} channel={channel} colorSpace="rgb" showLabel />
          ))}
          <ColorPickerSlider channel="saturation" colorSpace="hsb" showLabel />
          <ColorPickerSlider channel="brightness" colorSpace="hsb" showLabel />
        </ColorPicker>
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("slider")).toHaveLength(5);
    // Every channel of a mid blue fails somewhere against white.
    expect(canvasElement.querySelectorAll("[data-slot=color-picker-failing]").length).toBe(5);

    const red = canvas.getByRole("slider", { name: "Red" });
    expect(red).toHaveValue("59");
    red.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(red).toHaveValue("60"));
    expect(canvas.getByText(/^oklch\(/)).toBeInTheDocument();
  },
};
