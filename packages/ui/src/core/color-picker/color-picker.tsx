import { cn } from "cn";
import { formatHex } from "culori";
import { ContrastIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Label,
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
            className="pointer-events-none absolute inset-y-0 bg-[repeating-linear-gradient(135deg,rgb(0_0_0/0.35)_0_2px,rgb(255_255_255/0.35)_2px_4px)]"
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
  className?: string;
};

function ColorPickerPanel({ value, onChange, contrastWith, className }: ColorPickerPanelProps) {
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
          <ColorPickerPanel value={value} onChange={onChange} contrastWith={contrastWith} />
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

export type { ColorPickerPanelProps, ColorPickerProps };
export { ColorPicker, ColorPickerPanel };
