import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerCopy,
  ColorPickerEyeDropper,
  ColorPickerFixContrast,
  ColorPickerInput,
  ColorPickerPanel,
  ColorPickerPreview,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
  ColorPickerValue,
  ColorPickerWheel,
  DEFAULT_SWATCHES,
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
    docs: {
      description: {
        story:
          "A swatch that opens the default panel: an OKLCH area (chroma × lightness at the hue), hue slider, format fields and presets.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Primary color" }));
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "Primary color" });
    await waitFor(() => expect(dialog).toBeVisible());

    const area = within(dialog).getByRole("slider", { name: "Chroma and lightness" });
    area.focus();
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(canvas.getByText(/^oklch\(0\.61 /)).toBeInTheDocument());
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
          "ColorPickerPanel renders the controls inline; the area and tracks hatch what fails AA against contrastWith, with the AA (solid) and AAA (dashed) thresholds drawn across the area. Fix to AA moves to the nearest lightness reaching 4.5:1, keeping the hue.",
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
    // Light blue on white: the area hatches its light part; the hue track shows it too.
    const area = canvasElement.querySelector("[data-slot=color-picker-area]");
    expect(area?.querySelectorAll("[data-slot=color-picker-failing]").length).toBeGreaterThan(0);
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
                <ColorPickerSwatches
                  colors={DEFAULT_SWATCHES.filter(
                    (swatch) => typeof swatch !== "string" && swatch.name.endsWith("-500"),
                  )}
                  columns={4}
                  className="w-36 self-start"
                />
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

export const Areas: Story = {
  args: { value: "oklch(0.55 0.15 260)", contrastWith: "#ffffff" },
  parameters: {
    docs: {
      description: {
        story: `ColorPickerArea in OKLCH (chroma across, lightness up, at the current hue) and in HSB (saturation × brightness). Both show the contrast against contrastWith.

**Why the OKLCH area is a triangle.** It only paints the colors an sRGB screen can show, and in the chroma × lightness plane those form a rough triangle:

- At lightness 0 the color is black and at 1 it is white, both with no chroma, so the edges meet at the left (chroma 0, the grays) at the top and bottom.
- In between, the most chroma sRGB reaches grows to a peak (the *cusp*) and falls again: the tip of the triangle.
- Each hue peaks at its own lightness (yellow near the top, L ≈ 0.97; blue low, L ≈ 0.45), so the shape changes as the hue moves.

The blank part holds colors OKLCH can describe but sRGB can't display; the browser would clip them. It is left blank instead of painting the clipped color, so the point you pick is the color you get, and dragging into it stops chroma at the edge.

**Why the HSB area is a square.** HSB is derived from the RGB cube itself, so every point is a displayable color. The cost is that it isn't perceptual: equal brightness doesn't look equally light across hues, so contrast thresholds curve through it and are harder to reason about for tokens.

The OKLCH area keeps its axes as the literal values written to a token (as on oklch.com). A square, perceptual alternative would be Okhsv (all in gamut, but its axes are no longer OKLCH chroma), or scaling chroma to the maximum at each lightness (the same x then means different chroma at different heights).`,
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-[34rem] max-w-full flex-col gap-3">
        <ColorPicker value={value} onChange={setValue} contrastWith={args.contrastWith}>
          <div className="grid grid-cols-2 gap-3">
            <ColorPickerArea />
            <ColorPickerArea colorSpace="hsb" />
          </div>
          <ColorPickerSlider channel="hue" />
        </ColorPicker>
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const oklch = canvas.getByRole("slider", { name: "Chroma and lightness" });
    const hsb = canvas.getByRole("slider", { name: "Saturation and brightness" });
    // Thresholds are drawn across both areas.
    for (const area of [oklch, hsb]) {
      const threshold = area.querySelector("[data-slot=color-picker-aa-threshold] path");
      expect(threshold?.getAttribute("d")).toMatch(/^M/);
    }

    oklch.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByText(/^oklch\(0\.54 /)).toBeInTheDocument());

    hsb.focus();
    await userEvent.keyboard("{End}");
    expect(hsb.getAttribute("aria-valuetext")).toMatch(/Saturation 100%$/);
  },
};

export const AlphaAndFormat: Story = {
  args: { value: "#3b82f6", alpha: true, format: "hex" },
  parameters: {
    docs: {
      description: {
        story:
          "alpha adds an opacity slider and field; format sets what onChange emits (here hex, #rrggbbaa when translucent). The fields edit any format from their menu.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPickerPanel
          value={value}
          onChange={setValue}
          alpha={args.alpha}
          format={args.format}
          swatches={[]}
        />
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alpha = canvas.getByRole("slider", { name: "Alpha" });
    alpha.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(canvas.getByText("#3b82f6fc")).toBeInTheDocument());

    const hex = canvas.getByRole("textbox", { name: "Hex" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "e11d48{Enter}");
    await waitFor(() => expect(canvas.getByText("#e11d48fc")).toBeInTheDocument());

    await userEvent.click(canvas.getByRole("button", { name: /Color format/ }));
    await userEvent.click(await within(document.body).findByRole("option", { name: "RGB" }));
    const red = await canvas.findByRole("textbox", { name: "Red" });
    expect(red).toHaveValue("225");
  },
};

export const ColorInput: Story = {
  args: { value: "#0ea5e9", format: "hex", label: "Canvas background" },
  parameters: {
    docs: {
      description: {
        story:
          "ColorPickerInput takes any CSS color (hex, rgb(), hsl(), oklch(), names) on Enter or blur, and Escape reverts what was typed. Its swatch opens ColorPickerContent, placed against the field.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-64 flex-col gap-3">
        <ColorPicker value={value} onChange={setValue} format={args.format} label={args.label}>
          <ColorPickerInput aria-label="Canvas background" />
          <ColorPickerContent />
        </ColorPicker>
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Canvas background" });
    await userEvent.clear(input);
    await userEvent.type(input, "tomato{Enter}");
    await waitFor(() => expect(canvas.getByText("#ff6347")).toBeInTheDocument());

    await userEvent.clear(input);
    await userEvent.type(input, "not a color");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveValue("#ff6347");

    await userEvent.click(canvas.getByRole("button", { name: "Canvas background" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Canvas background" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.keyboard("{Escape}");
  },
};

export const RecentColors: Story = {
  args: { value: "oklch(0.6 0.15 160)" },
  parameters: {
    docs: {
      description: {
        story:
          "onChange fires while dragging; onChangeEnd once the interaction ends (a drag released, a key, a preset, a committed field). Here each finished pick is kept under Recent. ColorPickerValue, ColorPickerCopy and ColorPickerEyeDropper (where the browser has one) sit beside the controls.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    const [recent, setRecent] = useState<string[]>([]);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPicker
          value={value}
          onChange={setValue}
          onChangeEnd={(next) =>
            setRecent((list) => [next, ...list.filter((item) => item !== next)].slice(0, 12))
          }
        >
          <ColorPickerArea />
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <ColorPickerSlider channel="hue" className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerValue className="flex-1 truncate font-mono text-xs" />
            <ColorPickerCopy />
          </div>
          <span id="recent-label" className="text-xs text-muted-foreground">
            Recent
          </span>
          <ColorPickerSwatches colors={recent} columns={12} aria-labelledby="recent-label" />
        </ColorPicker>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByRole("slider", { name: "Chroma and lightness" });
    const { left, top, width, height } = area.getBoundingClientRect();
    const at = (x: number, y: number) => ({
      clientX: left + width * x,
      clientY: top + height * y,
    });
    // One drag across the area: many changes, one recent color.
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: area, coords: at(0.1, 0.2) },
      { target: area, coords: at(0.15, 0.3) },
      { target: area, coords: at(0.2, 0.4) },
      { keys: "[/MouseLeft]", target: area, coords: at(0.2, 0.4) },
    ]);
    const recent = canvas.getByRole("listbox", { name: "Recent" });
    await waitFor(() => expect(within(recent).getAllByRole("option")).toHaveLength(1));

    // Each key press is a finished change.
    canvas.getByRole("slider", { name: "Hue" }).focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await waitFor(() => expect(within(recent).getAllByRole("option")).toHaveLength(3));

    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await userEvent.click(canvas.getByRole("button", { name: "Copy color" }));
    expect(writeText).toHaveBeenCalledWith(
      canvasElement.querySelector("[data-slot=color-picker-value]")?.textContent,
    );
    await waitFor(() => expect(canvas.getByRole("button", { name: "Copied" })).toBeInTheDocument());
    writeText.mockRestore();
  },
};

export const Wheel: Story = {
  args: { value: "oklch(0.75 0.15 250)", contrastWith: "#ffffff" },
  parameters: {
    docs: {
      description: {
        story:
          "ColorPickerWheel turns the hue around a ring; its children fill the square inside, here the OKLCH area. With contrastWith, the hues failing AA are hatched on the ring too.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex flex-col items-start gap-3">
        <ColorPicker value={value} onChange={setValue} contrastWith={args.contrastWith}>
          <ColorPickerWheel>
            <ColorPickerArea className="size-full" />
          </ColorPickerWheel>
        </ColorPicker>
        <code className="text-xs">{value}</code>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wheel = canvas.getByRole("slider", { name: "Hue" });
    expect(wheel).toHaveAttribute("aria-valuenow", "250");
    // A light blue fails AA on white at every hue: the whole ring is hatched.
    const ring = canvasElement.querySelector("[data-slot=color-picker-wheel]");
    expect(ring?.querySelectorAll("path[data-slot=color-picker-failing]").length).toBe(1);

    wheel.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(canvas.getByText(/^oklch\(0\.75 \S+ 251\)$/)).toBeInTheDocument());

    // Pressing the right edge of the ring picks the hue at 90°.
    const { left, top, width, height } = wheel.getBoundingClientRect();
    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: wheel,
        coords: { clientX: left + width * 0.97, clientY: top + height / 2 },
      },
      { keys: "[/MouseLeft]", target: wheel },
    ]);
    await waitFor(() => expect(wheel).toHaveAttribute("aria-valuenow", "90"));
  },
};

export const Localized: Story = {
  args: { value: "oklch(0.75 0.15 250)", contrastWith: "#ffffff" },
  parameters: {
    docs: {
      description: {
        story:
          "labels overrides any text the picker shows or announces (DEFAULT_COLOR_PICKER_LABELS lists them); numbers already follow the locale of react-aria's I18nProvider.",
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-72 flex-col gap-3">
        <ColorPicker
          value={value}
          onChange={setValue}
          contrastWith={args.contrastWith}
          labels={{
            hue: "Matiz",
            oklchArea: "Croma e luminosidade",
            lightness: "Luminosidade",
            chroma: "Croma",
            fail: "Falha",
            largeText: "AA texto grande",
            fix: (level) => `Corrigir para ${level}`,
          }}
        >
          <ColorPickerPreview />
          <ColorPickerArea />
          <ColorPickerSlider channel="hue" />
          <ColorPickerFixContrast />
        </ColorPicker>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("slider", { name: "Matiz" })).toBeInTheDocument();
    const area = canvas.getByRole("slider", { name: "Croma e luminosidade" });
    expect(area.getAttribute("aria-valuetext")).toMatch(/^Luminosidade 0\.750, Croma /);
    expect(canvas.getByText("Falha")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Corrigir para AA" }));
    await waitFor(() => expect(canvas.queryByText("Falha")).not.toBeInTheDocument());
  },
};

export const FormField: Story = {
  args: { value: "#0ea5e9" },
  parameters: {
    docs: {
      description: {
        story:
          "With name, the value is submitted with the form (a hidden input), and a form reset restores the starting color. isInvalid marks the field. Enter commits a changed draft first; the next Enter submits.",
      },
    },
  },
  render: function Render(args) {
    const [saved, setSaved] = useState<string>();
    return (
      <form
        className="flex w-64 flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(String(new FormData(event.currentTarget).get("brand") ?? ""));
        }}
        onReset={() => setSaved(undefined)}
      >
        <ColorPicker name="brand" defaultValue={args.value} format="hex" label="Brand color">
          <ColorPickerInput aria-label="Brand color" />
          <ColorPickerContent />
        </ColorPicker>
        <div className="flex items-center gap-2">
          <button type="submit" className="rounded-md border px-2 py-1 text-sm">
            Save
          </button>
          <button type="reset" className="rounded-md border px-2 py-1 text-sm">
            Reset
          </button>
          <output className="ms-auto font-mono text-xs">{saved && `Saved ${saved}`}</output>
        </div>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Brand color" });
    await userEvent.clear(input);
    await userEvent.type(input, "tomato{Enter}");
    // The first Enter only committed the draft.
    expect(canvas.queryByText(/^Saved/)).not.toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue("#ff6347"));

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByText("Saved #ff6347")).toBeInTheDocument());

    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(input).toHaveValue("#0ea5e9"));
  },
};
