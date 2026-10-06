import { cn } from "cn";
import { formatHex } from "culori";
import { ContrastIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Label,
  ListBox,
  ListBoxItem,
  Button as RACButton,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { Button } from "@/core/button/button";
import { Popover } from "@/core/popover/popover";
import {
  CONTRAST_AA,
  CONTRAST_AAA,
  contrastLevel,
  contrastRatio,
  formatOklchChannels,
  inGamut,
  nearestContrastColor,
  type OklchChannels,
  passingLightnessRanges,
  toOklchChannels,
} from "@/lib/color-contrast";

type Channel = "l" | "c" | "h";

const CHANNELS: Record<
  Channel,
  { label: string; min: number; max: number; step: number; format: (n: number) => string }
> = {
  l: { label: "Lightness", min: 0, max: 1, step: 0.001, format: (n) => n.toFixed(3) },
  c: { label: "Chroma", min: 0, max: 0.4, step: 0.001, format: (n) => n.toFixed(3) },
  h: { label: "Hue", min: 0, max: 360, step: 1, format: (n) => `${Math.round(n)}°` },
};

const GRADIENT_STOPS = 24;

/** Opaque sRGB hex of the channels (chroma clamped), for painting tracks and swatches. */
function paint(channels: OklchChannels): string {
  const { l, c, h } = inGamut(channels);
  return formatHex({ mode: "oklch", l, c, h });
}

function trackGradient(channels: OklchChannels, channel: Channel): string {
  const { min, max } = CHANNELS[channel];
  const stops = Array.from({ length: GRADIENT_STOPS + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / GRADIENT_STOPS;
    return paint({ ...channels, [channel]: value, alpha: 1 });
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

const HATCH =
  "bg-[repeating-linear-gradient(135deg,rgb(0_0_0/0.35)_0_2px,rgb(255_255_255/0.35)_2px_4px)]";

/** A preset color: a CSS color, or one with a name used as its accessible label. */
type Swatch = string | { color: string; name: string };

const TAILWIND_HUES = [
  "neutral",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "pink",
];
const TAILWIND_SHADES: Array<[number, string[]]> = [
  [
    200,
    [
      "0.922 0 0",
      "0.885 0.062 18.334",
      "0.901 0.076 70.697",
      "0.924 0.12 95.746",
      "0.945 0.129 101.54",
      "0.925 0.084 155.995",
      "0.91 0.096 180.426",
      "0.917 0.08 205.041",
      "0.882 0.059 254.128",
      "0.87 0.065 274.039",
      "0.894 0.057 293.283",
      "0.899 0.061 343.231",
    ],
  ],
  [
    400,
    [
      "0.708 0 0",
      "0.704 0.191 22.216",
      "0.75 0.183 55.934",
      "0.828 0.189 84.429",
      "0.852 0.199 91.936",
      "0.792 0.209 151.711",
      "0.777 0.152 181.912",
      "0.789 0.154 211.53",
      "0.707 0.165 254.624",
      "0.673 0.182 276.935",
      "0.702 0.183 293.541",
      "0.718 0.202 349.761",
    ],
  ],
  [
    500,
    [
      "0.556 0 0",
      "0.637 0.237 25.331",
      "0.705 0.213 47.604",
      "0.769 0.188 70.08",
      "0.795 0.184 86.047",
      "0.723 0.219 149.579",
      "0.704 0.14 182.503",
      "0.715 0.143 215.221",
      "0.623 0.214 259.815",
      "0.585 0.233 277.117",
      "0.606 0.25 292.717",
      "0.656 0.241 354.308",
    ],
  ],
  [
    600,
    [
      "0.439 0 0",
      "0.577 0.245 27.325",
      "0.646 0.222 41.116",
      "0.666 0.179 58.318",
      "0.681 0.162 75.834",
      "0.627 0.194 149.214",
      "0.6 0.118 184.704",
      "0.609 0.126 221.723",
      "0.546 0.245 262.881",
      "0.511 0.262 276.966",
      "0.541 0.281 293.009",
      "0.592 0.249 0.584",
    ],
  ],
  [
    800,
    [
      "0.269 0 0",
      "0.444 0.177 26.899",
      "0.47 0.157 37.304",
      "0.473 0.137 46.201",
      "0.476 0.114 61.907",
      "0.448 0.119 151.328",
      "0.437 0.078 188.216",
      "0.45 0.085 224.283",
      "0.424 0.199 265.638",
      "0.398 0.195 277.366",
      "0.432 0.232 292.759",
      "0.459 0.187 3.815",
    ],
  ],
];

/** Tailwind v4's palette (MIT): 12 hues × shades 200/400/500/600/800, a row per shade. */
const DEFAULT_SWATCHES: Swatch[] = TAILWIND_SHADES.flatMap(([shade, values]) =>
  values.map((value, i) => ({ color: `oklch(${value})`, name: `${TAILWIND_HUES[i]}-${shade}` })),
);

const swatchColor = (swatch: Swatch) => (typeof swatch === "string" ? swatch : swatch.color);
const swatchName = (swatch: Swatch) => (typeof swatch === "string" ? swatch : swatch.name);

function SwatchGrid({
  swatches,
  columns,
  value,
  contrastWith,
  onSelect,
}: {
  swatches: Swatch[];
  columns: number;
  /** Current color, normalized with formatOklchChannels. */
  value: string;
  contrastWith?: string;
  onSelect: (color: string) => void;
}) {
  // Swatches are compared as the picker emits them (oklch, clamped to sRGB).
  const items = useMemo(() => {
    const seen = new Set<string>();
    return swatches.flatMap((swatch) => {
      const channels = toOklchChannels(swatchColor(swatch));
      if (!channels) return [];
      const id = formatOklchChannels({ ...channels, alpha: 1 });
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ id, name: swatchName(swatch), paint: paint(channels) }];
    });
  }, [swatches]);
  const selected = toOklchChannels(value);
  const selectedId = selected && formatOklchChannels({ ...selected, alpha: 1 });

  return (
    <ListBox
      data-slot="color-picker-swatches"
      aria-label="Preset colors"
      layout="grid"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedId ? [selectedId] : []}
      onSelectionChange={(keys) => {
        const [key] = keys === "all" ? [] : [...keys];
        if (typeof key === "string") onSelect(key);
      }}
      className="grid gap-1 outline-none"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const ratio = contrastWith ? contrastRatio(contrastWith, item.id) : undefined;
        const fails = ratio !== undefined && ratio < CONTRAST_AA;
        return (
          <ListBoxItem
            key={item.id}
            id={item.id}
            textValue={item.name}
            aria-label={ratio === undefined ? item.name : `${item.name}, ${ratio.toFixed(2)}:1`}
            data-failing={fails || undefined}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-sm ring-1 ring-foreground/10 outline-none ring-inset data-focus-visible:ring-2 data-focus-visible:ring-ring data-selected:ring-2 data-selected:ring-foreground"
            style={{ background: item.paint }}
          >
            {fails && <span aria-hidden className={cn("absolute inset-0", HATCH)} />}
          </ListBoxItem>
        );
      })}
    </ListBox>
  );
}

const parseOr = (value: string, fallback: OklchChannels) => toOklchChannels(value) ?? fallback;
const BLACK: OklchChannels = { l: 0, c: 0, h: 0, alpha: 1 };

function ChannelSlider({
  channel,
  channels,
  onChange,
  failing = [],
  marks = [],
}: {
  channel: Channel;
  channels: OklchChannels;
  onChange: (value: number) => void;
  /** Value ranges drawn hatched on the track (fail the contrast target). */
  failing?: Array<[number, number]>;
  /** Values marked with a tick on the track (contrast thresholds). */
  marks?: number[];
}) {
  const { label, min, max, step, format } = CHANNELS[channel];
  const percent = (value: number) => `${((value - min) / (max - min)) * 100}%`;
  return (
    <Slider
      data-slot="color-picker-slider"
      data-channel={channel}
      className="flex flex-col gap-1.5"
      minValue={min}
      maxValue={max}
      step={step}
      value={channels[channel]}
      onChange={onChange}
    >
      <div className="flex items-center justify-between text-xs">
        <Label className="text-muted-foreground">{label}</Label>
        <SliderOutput className="font-mono tabular-nums">
          {({ state }) => format(state.getThumbValue(0))}
        </SliderOutput>
      </div>
      <SliderTrack
        className="relative h-4 w-full rounded-md ring-1 ring-foreground/10 ring-inset"
        style={{ background: trackGradient(channels, channel) }}
      >
        {failing.map(([from, to]) => (
          <span
            key={`${from}-${to}`}
            aria-hidden
            data-slot="color-picker-failing"
            className={cn("pointer-events-none absolute inset-y-0", HATCH)}
            style={{ left: percent(from), width: `calc(${percent(to)} - ${percent(from)})` }}
          />
        ))}
        {marks.map((mark) => (
          <span
            key={mark}
            aria-hidden
            className="pointer-events-none absolute -inset-y-0.5 w-px -translate-x-1/2 bg-foreground"
            style={{ left: percent(mark) }}
          />
        ))}
        <SliderThumb
          className="top-1/2 size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_2px_rgb(0_0_0/0.3)] outline-none data-focus-visible:ring-3 data-focus-visible:ring-ring/50"
          style={{ background: paint(channels) }}
        />
      </SliderTrack>
    </Slider>
  );
}

/** Lightness values where the contrast crosses `ratio` (the edges of its passing ranges). */
function boundaries(ranges: Array<[number, number]>): number[] {
  return ranges.flat().filter((value) => value > 0 && value < 1);
}

/** Lightness ranges that don't pass: the complement of `passing` in 0–1. */
function complement(passing: Array<[number, number]>): Array<[number, number]> {
  const gaps: Array<[number, number]> = [];
  let cursor = 0;
  for (const [from, to] of passing) {
    if (from > cursor) gaps.push([cursor, from]);
    cursor = to;
  }
  if (cursor < 1) gaps.push([cursor, 1]);
  return gaps;
}

type ColorPickerPanelProps = {
  /** Any CSS color. */
  value: string;
  /** Called with an `oklch(…)` string, chroma clamped to sRGB; alpha is kept. */
  onChange: (value: string) => void;
  /**
   * The background this color sits on. Shows the contrast ratio, hatches the
   * lightness that fails AA, and offers buttons that move to the nearest
   * lightness reaching AA / AAA while keeping hue and chroma.
   */
  contrastWith?: string;
  /**
   * Preset colors shown under the sliders (Tailwind's palette by default; `[]`
   * hides them). With `contrastWith`, the ones failing AA are hatched.
   */
  swatches?: Swatch[];
  /** Columns of the swatch grid. */
  swatchColumns?: number;
  className?: string;
};

function ColorPickerPanel({
  value,
  onChange,
  contrastWith,
  swatches = DEFAULT_SWATCHES,
  swatchColumns = TAILWIND_HUES.length,
  className,
}: ColorPickerPanelProps) {
  // Channels are kept locally so hue survives dragging chroma to 0 (grays have no hue).
  const [channels, setChannels] = useState(() => parseOr(value, BLACK));
  useEffect(() => {
    setChannels((current) =>
      formatOklchChannels(current) === formatOklchChannels(parseOr(value, current))
        ? current
        : parseOr(value, current),
    );
  }, [value]);

  const update = (next: OklchChannels) => {
    setChannels(next);
    onChange(formatOklchChannels(next));
  };

  const current = formatOklchChannels(channels);
  const { l, c, h } = channels;
  const contrast = useMemo(() => {
    if (!contrastWith) return undefined;
    const color = `oklch(${l} ${c} ${h})`;
    const aa = passingLightnessRanges(color, contrastWith, CONTRAST_AA);
    const aaa = passingLightnessRanges(color, contrastWith, CONTRAST_AAA);
    return {
      failing: complement(aa),
      marks: [...boundaries(aa), ...boundaries(aaa)],
      fixAA: nearestContrastColor(color, contrastWith, CONTRAST_AA),
      fixAAA: nearestContrastColor(color, contrastWith, CONTRAST_AAA),
    };
  }, [l, c, h, contrastWith]);

  const ratio = contrastWith ? contrastRatio(contrastWith, current) : undefined;
  const level = ratio === undefined ? undefined : contrastLevel(ratio);
  const fix = (target: string | undefined) => {
    const next = target && toOklchChannels(target);
    if (next) update({ ...next, h: channels.h, alpha: channels.alpha });
  };

  return (
    <div data-slot="color-picker-panel" className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <div
          data-slot="color-picker-preview"
          className="flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium ring-1 ring-foreground/10"
          style={{ background: contrastWith ?? current, color: contrastWith ? current : undefined }}
        >
          {contrastWith && "Aa"}
        </div>
        {ratio !== undefined && (
          <div
            data-slot="color-picker-ratio"
            data-level={level}
            className={cn(
              "flex w-20 flex-col items-end text-xs",
              level === "Fail" && "text-destructive",
            )}
          >
            <span className="font-mono text-sm tabular-nums">{ratio.toFixed(2)}:1</span>
            <span className="text-muted-foreground">{level === "AA18" ? "AA large" : level}</span>
          </div>
        )}
      </div>
      <ChannelSlider
        channel="l"
        channels={channels}
        onChange={(l) => update({ ...channels, l })}
        failing={contrast?.failing}
        marks={contrast?.marks}
      />
      <ChannelSlider channel="c" channels={channels} onChange={(c) => update({ ...channels, c })} />
      <ChannelSlider channel="h" channels={channels} onChange={(h) => update({ ...channels, h })} />
      {swatches.length > 0 && (
        <SwatchGrid
          swatches={swatches}
          columns={swatchColumns}
          value={current}
          contrastWith={contrastWith}
          onSelect={(color) => {
            const next = toOklchChannels(color);
            if (next) update({ ...next, alpha: channels.alpha });
          }}
        />
      )}
      {contrast && (
        <div className="flex gap-2">
          {(
            [
              ["AA", contrast.fixAA, CONTRAST_AA],
              ["AAA", contrast.fixAAA, CONTRAST_AAA],
            ] as const
          ).map(([name, target, min]) => (
            <Button
              key={name}
              size="sm"
              variant="outline"
              className="flex-1"
              isDisabled={!target || (ratio ?? 0) >= min}
              onPress={() => fix(target)}
            >
              <ContrastIcon />
              Fix to {name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

type ColorPickerProps = ColorPickerPanelProps & {
  /** Accessible name of the swatch button and the dialog. */
  label?: string;
  isDisabled?: boolean;
};

/** A swatch button that opens a ColorPickerPanel in a popover. */
function ColorPicker({
  value,
  onChange,
  contrastWith,
  swatches,
  swatchColumns,
  label = "Pick color",
  isDisabled,
  className,
}: ColorPickerProps) {
  return (
    <DialogTrigger>
      <RACButton
        data-slot="color-picker-trigger"
        aria-label={label}
        isDisabled={isDisabled}
        className={cn(
          "size-8 shrink-0 cursor-pointer rounded-md ring-1 ring-foreground/15 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-3 data-focus-visible:ring-ring/50",
          className,
        )}
        style={{ background: value }}
      />
      <Popover placement="bottom start" className="w-72 overflow-y-auto">
        <Dialog aria-label={label} className="outline-none">
          <ColorPickerPanel
            value={value}
            onChange={onChange}
            contrastWith={contrastWith}
            swatches={swatches}
            swatchColumns={swatchColumns}
          />
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

export type { ColorPickerPanelProps, ColorPickerProps, Swatch };
export { ColorPicker, ColorPickerPanel, DEFAULT_SWATCHES };
