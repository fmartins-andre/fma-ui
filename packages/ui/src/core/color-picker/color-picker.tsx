import { cn } from "cn";
import {
  type Color,
  converter,
  displayable,
  formatCss,
  formatHex,
  formatHex8,
  formatHsl,
  formatRgb,
  parse,
} from "culori";
import { CheckIcon, ContrastIcon, CopyIcon, PipetteIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Dialog,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { Button, buttonVariants } from "@/core/button/button";
import { Input } from "@/core/input/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/core/input-group/input-group";
import { Popover } from "@/core/popover/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import {
  CONTRAST_AA,
  CONTRAST_AAA,
  type ColorChannel,
  type ColorSpace,
  channelDomain,
  contrastLevel,
  contrastRatio,
  formatOklchChannels,
  inGamut,
  nearestContrastColor,
  type PassingColumn,
  passingRanges,
  passingRegion,
} from "@/lib/color-contrast";

/* -------------------------------------------------------------------------- */
/*                                 Color state                                */
/* -------------------------------------------------------------------------- */

/** culori's name for each space (HSB is its `hsv`). */
const MODES = { oklch: "oklch", hsl: "hsl", hsb: "hsv", rgb: "rgb" } as const;
const SPACES = Object.keys(MODES) as ColorSpace[];
const SPACE_KEYS: Record<ColorSpace, readonly ColorChannel[]> = {
  oklch: ["l", "c", "h"],
  hsl: ["h", "s", "l"],
  hsb: ["h", "s", "v"],
  rgb: ["r", "g", "b"],
};

type Channels = Partial<Record<ColorChannel, number>>;

/**
 * The picked color, kept in the space it was last set or edited in, so a gray
 * keeps its hue and an OKLCH chroma beyond sRGB survives until it's emitted.
 * Channels use culori's units (see channelDomain).
 */
interface ColorState {
  space: ColorSpace;
  channels: Channels;
  alpha: number;
}

const BLACK: ColorState = { space: "oklch", channels: { l: 0, c: 0, h: 0 }, alpha: 1 };

const finite = (n: number | undefined) => (n === undefined || Number.isNaN(n) ? undefined : n);

function toCulori({ space, channels, alpha }: ColorState): Color {
  return { mode: MODES[space], ...channels, alpha } as Color;
}

/** The state's hue carried into `space`, read off a vivid color with that hue. */
function hueIn(state: ColorState, space: ColorSpace): number {
  const h = state.channels.h;
  if (h === undefined) return 0;
  const vivid: Color =
    state.space === "oklch"
      ? { mode: "oklch", l: 0.7, c: 0.15, h }
      : { mode: "hsv", h, s: 1, v: 1 };
  const converted: Channels = converter(MODES[space])(vivid);
  return finite(converted.h) ?? 0;
}

/** The state's channels in `space`; a gray takes the hue it had before. */
function channelsIn(state: ColorState, space: ColorSpace): Channels {
  if (state.space === space) return state.channels;
  const converted: Channels = converter(MODES[space])(toCulori(state));
  const channels: Channels = {};
  for (const key of SPACE_KEYS[space]) {
    channels[key] = finite(converted[key]) ?? (key === "h" ? hueIn(state, space) : 0);
  }
  return channels;
}

/** A CSS color as state, in its own space when the picker has it (else OKLCH). */
function parseState(value: string, previous?: ColorState): ColorState | undefined {
  const color = parse(value.trim());
  if (!color) return undefined;
  const space = SPACES.find((s) => MODES[s] === color.mode) ?? "oklch";
  const converted: Channels = converter(MODES[space])(color);
  const channels: Channels = {};
  for (const key of SPACE_KEYS[space]) {
    const fallback = key === "h" && previous ? channelsIn(previous, space).h : undefined;
    channels[key] = finite(converted[key]) ?? fallback ?? 0;
  }
  return { space, channels, alpha: color.alpha ?? 1 };
}

/** The formats a picker emits and its fields edit. */
type ColorPickerFormat = "oklch" | "hex" | "rgb" | "hsl";

/** The state as CSS in `format`, clamped to sRGB (OKLCH by chroma), alpha kept. */
function formatState(state: ColorState, format: ColorPickerFormat = "oklch"): string {
  const { l = 0, c = 0, h = 0 } = channelsIn(state, "oklch");
  const channels = { l, c, h, alpha: state.alpha };
  if (format === "oklch") return formatOklchChannels(channels);
  const color: Color = { mode: "oklch", ...inGamut(channels) };
  if (format === "hex") return state.alpha < 1 ? formatHex8(color) : formatHex(color);
  return format === "rgb" ? formatRgb(color) : formatHsl(color);
}

/** The state with one channel set in `space` (or alpha, without `key`). */
function withChannel(
  state: ColorState,
  space: ColorSpace,
  key: ColorChannel | undefined,
  value: number,
): ColorState {
  if (!key) return { ...state, alpha: value };
  return { space, channels: { ...channelsIn(state, space), [key]: value }, alpha: state.alpha };
}

/** Opaque sRGB hex of the state (OKLCH chroma clamped), for painting tracks and swatches. */
function paint(state: ColorState): string {
  if (state.space !== "oklch") return formatHex({ ...toCulori(state), alpha: 1 });
  const { l = 0, c = 0, h = 0 } = state.channels;
  return formatHex({ mode: "oklch", ...inGamut({ l, c, h, alpha: 1 }) });
}

/** The transparency grid behind translucent colors. */
const CHECKER =
  "repeating-conic-gradient(var(--muted) 0 25%, var(--background) 0 50%) 50% / 8px 8px";

/** A CSS background showing `color` over the checker when it is translucent. */
const swatchBackground = (color: string) => `linear-gradient(${color}, ${color}), ${CHECKER}`;

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

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

interface ColorPickerContextValue {
  state: ColorState;
  /** The current value as emitted. */
  value: string;
  /** Sets the color; `end` also fires onChangeEnd (a discrete change: a click, a key, a commit). */
  update: (next: ColorState, end?: boolean) => void;
  /** Fires onChangeEnd with the latest value (a drag was released). */
  end: () => void;
  format: ColorPickerFormat;
  alpha: boolean;
  contrastWith?: string;
  swatches?: Swatch[];
  swatchColumns?: number;
  label: string;
  isDisabled: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** What the popover is placed against: the anchor (a ColorPickerInput) or else the trigger. */
  anchorRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<Element | null>;
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

function usePicker(part: string): ColorPickerContextValue {
  const picker = useContext(ColorPickerContext);
  if (!picker) throw new Error(`${part} must be used inside a ColorPicker or ColorPickerPanel.`);
  return picker;
}

type ColorPickerProviderProps = {
  /** Any CSS color (controlled). */
  value?: string;
  /** Initial color when uncontrolled. */
  defaultValue?: string;
  /** Called with the color in `format`, clamped to sRGB (OKLCH by chroma); alpha is kept. */
  onChange?: (value: string) => void;
  /**
   * Called once an interaction ends: a drag released, a key pressed, a preset
   * picked, a field committed. Use it for history or saving, not live preview.
   */
  onChangeEnd?: (value: string) => void;
  /** The format of emitted values. Defaults to `oklch(…)`. */
  format?: ColorPickerFormat;
  /** Adds the alpha slider and field to the default panel (alpha is always kept). */
  alpha?: boolean;
  /**
   * The background this color sits on. Every part shows contrast against it:
   * tracks hatch what fails AA and mark the AA/AAA thresholds, presets failing
   * AA are hatched, and ColorPickerPreview / ColorPickerFixContrast show the
   * ratio and move to the nearest passing lightness.
   */
  contrastWith?: string;
  /**
   * Preset colors for ColorPickerSwatches (Tailwind's palette by default; `[]`
   * hides them in the default panel). With `contrastWith`, the ones failing AA
   * are hatched.
   */
  swatches?: Swatch[];
  /** Columns of the swatch grid. */
  swatchColumns?: number;
  /** Accessible name of the trigger and the popover dialog. */
  label?: string;
  isDisabled?: boolean;
  /** Whether the popover is open (controlled). */
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

function ColorPickerProvider({
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  format = "oklch",
  alpha = false,
  contrastWith,
  swatches,
  swatchColumns,
  label = "Pick color",
  isDisabled = false,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: ColorPickerProviderProps & { children: ReactNode }) {
  const [state, setState] = useState(() => parseState(value ?? defaultValue ?? "") ?? BLACK);
  const emitted = useRef<string | undefined>(undefined);
  // A new value from outside replaces the state, unless it is the same color
  // (so a gray keeps its hue when the parent echoes the emitted value back).
  useEffect(() => {
    if (value === undefined || value === emitted.current) return;
    setState((current) => {
      const next = parseState(value, current);
      return !next || formatState(next) === formatState(current) ? current : next;
    });
  }, [value]);

  const update = useCallback(
    (next: ColorState, end = false) => {
      setState(next);
      const css = formatState(next, format);
      emitted.current = css;
      onChange?.(css);
      if (end) onChangeEnd?.(css);
    },
    [onChange, onChangeEnd, format],
  );
  const end = useCallback(() => {
    if (emitted.current !== undefined) onChangeEnd?.(emitted.current);
  }, [onChangeEnd]);

  const [openState, setOpenState] = useState(defaultOpen);
  const setOpen = useCallback(
    (open: boolean) => {
      setOpenState(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  // A ref the popover reads when it opens: the anchor if there is one.
  const popoverRef = useMemo<RefObject<Element | null>>(
    () => ({
      get current() {
        return anchorRef.current ?? triggerRef.current;
      },
    }),
    [],
  );

  const context = useMemo<ColorPickerContextValue>(
    () => ({
      state,
      value: formatState(state, format),
      update,
      end,
      format,
      alpha,
      contrastWith,
      swatches,
      swatchColumns,
      label,
      isDisabled,
      isOpen: isOpen ?? openState,
      setOpen,
      triggerRef,
      anchorRef,
      popoverRef,
    }),
    [
      state,
      format,
      update,
      end,
      alpha,
      popoverRef,
      contrastWith,
      swatches,
      swatchColumns,
      label,
      isDisabled,
      isOpen,
      openState,
      setOpen,
    ],
  );
  return <ColorPickerContext.Provider value={context}>{children}</ColorPickerContext.Provider>;
}

/** State and actions of the surrounding ColorPicker, for custom parts. */
function useColorPicker() {
  const picker = usePicker("useColorPicker");
  return {
    /** The current value, as emitted. */
    value: picker.value,
    /** Sets the color from any CSS color, keeping alpha unless it has its own. Returns false if unparseable. */
    setValue: (css: string) => {
      const next = parseState(css, picker.state);
      if (next) picker.update(next, true);
      return next !== undefined;
    },
    contrastWith: picker.contrastWith,
    isDisabled: picker.isDisabled,
    isOpen: picker.isOpen,
    setOpen: picker.setOpen,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Root parts                                 */
/* -------------------------------------------------------------------------- */

type ColorPickerProps = ColorPickerProviderProps & {
  /** Classes of the default trigger (when there are no children). */
  className?: string;
  /**
   * The parts to render (ColorPickerTrigger, ColorPickerContent, sliders…), in
   * any layout. Without children: a swatch button that opens the default panel.
   */
  children?: ReactNode;
};

/**
 * Holds the color and shares it with its parts; renders no element of its own.
 * Without children it is a swatch button opening ColorPickerPanel in a popover.
 */
function ColorPicker({ className, children, ...props }: ColorPickerProps) {
  return (
    <ColorPickerProvider {...props}>
      {children ?? (
        <>
          <ColorPickerTrigger className={className} />
          <ColorPickerContent />
        </>
      )}
    </ColorPickerProvider>
  );
}

type ColorPickerTriggerProps = Omit<RACButtonProps, "children" | "className"> & {
  className?: string;
  /** Custom content (an icon, the value…); styled as an outline button. Default: a swatch. */
  children?: ReactNode;
};

/** The button that opens ColorPickerContent: a swatch of the color unless given children. */
function ColorPickerTrigger({ className, children, ...props }: ColorPickerTriggerProps) {
  const picker = usePicker("ColorPickerTrigger");
  return (
    <RACButton
      ref={picker.triggerRef}
      data-slot="color-picker-trigger"
      aria-label={children ? undefined : picker.label}
      aria-haspopup="dialog"
      aria-expanded={picker.isOpen}
      isDisabled={picker.isDisabled}
      onPress={() => picker.setOpen(!picker.isOpen)}
      className={cn(
        children
          ? buttonVariants({ variant: "outline" })
          : "size-8 shrink-0 cursor-pointer rounded-md ring-1 ring-foreground/15 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-3 data-focus-visible:ring-ring/50",
        className,
      )}
      style={children ? undefined : { background: swatchBackground(picker.value) }}
      {...props}
    >
      {children}
    </RACButton>
  );
}

type ColorPickerContentProps = Omit<
  ComponentProps<typeof Popover>,
  "children" | "isOpen" | "onOpenChange" | "triggerRef"
> & {
  /** The popover's controls. Default: ColorPickerPanel. */
  children?: ReactNode;
};

/** The popover opened by ColorPickerTrigger, holding a dialog with the controls. */
function ColorPickerContent({
  className,
  children,
  placement = "bottom start",
  ...props
}: ColorPickerContentProps) {
  const picker = usePicker("ColorPickerContent");
  return (
    <Popover
      data-slot="color-picker-content"
      triggerRef={picker.popoverRef}
      isOpen={picker.isOpen}
      onOpenChange={picker.setOpen}
      placement={placement}
      className={cn("w-72 overflow-y-auto", className)}
      {...props}
    >
      <Dialog aria-label={picker.label} className="outline-none">
        {children ?? <ColorPickerPanel />}
      </Dialog>
    </Popover>
  );
}

type ColorPickerPanelProps = ColorPickerProviderProps & {
  className?: string;
  /**
   * The controls, laid out in a column. Default: preview, OKLCH area, eye
   * dropper, hue (and alpha) sliders, format fields, presets and contrast fixes.
   */
  children?: ReactNode;
};

/**
 * The controls laid out in a column. Inside a ColorPicker it is just the
 * layout; on its own it holds the color itself (value, onChange…) and renders
 * inline.
 */
function ColorPickerPanel({ className, children, ...props }: ColorPickerPanelProps) {
  const inPicker = useContext(ColorPickerContext) !== null;
  const panel = (
    <div data-slot="color-picker-panel" className={cn("flex flex-col gap-3", className)}>
      {children ?? <DefaultControls />}
    </div>
  );
  return inPicker ? panel : <ColorPickerProvider {...props}>{panel}</ColorPickerProvider>;
}

function DefaultControls() {
  const picker = usePicker("ColorPickerPanel");
  return (
    <>
      <ColorPickerPreview />
      <ColorPickerArea />
      <div className="flex items-center gap-2">
        <ColorPickerEyeDropper />
        <ColorPickerSlider channel="hue" className="flex-1" />
      </div>
      {picker.alpha && <ColorPickerSlider channel="alpha" />}
      <ColorPickerFields />
      <ColorPickerSwatches />
      {picker.contrastWith && <ColorPickerFixContrast />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Sliders                                  */
/* -------------------------------------------------------------------------- */

type ColorPickerChannel =
  | "lightness"
  | "chroma"
  | "hue"
  | "saturation"
  | "brightness"
  | "red"
  | "green"
  | "blue"
  | "alpha";

/** Each channel's label, culori key and the spaces that have it (the first is its default). */
const CHANNELS: Record<
  ColorPickerChannel,
  { label: string; key?: ColorChannel; spaces: ColorSpace[] }
> = {
  lightness: { label: "Lightness", key: "l", spaces: ["oklch", "hsl"] },
  chroma: { label: "Chroma", key: "c", spaces: ["oklch"] },
  hue: { label: "Hue", key: "h", spaces: ["oklch", "hsl", "hsb"] },
  saturation: { label: "Saturation", key: "s", spaces: ["hsb", "hsl"] },
  brightness: { label: "Brightness", key: "v", spaces: ["hsb"] },
  red: { label: "Red", key: "r", spaces: ["rgb"] },
  green: { label: "Green", key: "g", spaces: ["rgb"] },
  blue: { label: "Blue", key: "b", spaces: ["rgb"] },
  alpha: { label: "Alpha", spaces: [] },
};

/** How a channel shows: its range and step on screen, `scale` × culori's unit. */
function channelScale(key: ColorChannel | undefined, space: ColorSpace) {
  const percent = { style: "percent" } satisfies Intl.NumberFormatOptions;
  if (!key) return { min: 0, max: 1, step: 0.01, scale: 1, format: percent };
  if (key === "h") {
    const format = { style: "unit", unit: "degree", unitDisplay: "narrow" } as const;
    return { min: 0, max: 360, step: 1, scale: 1, format };
  }
  if (space === "rgb") return { min: 0, max: 255, step: 1, scale: 255, format: {} };
  if (space === "oklch") {
    const [min, max] = channelDomain(key);
    const format = { minimumFractionDigits: 3, maximumFractionDigits: 3 };
    return { min, max, step: 0.001, scale: 1, format };
  }
  return { min: 0, max: 1, step: 0.01, scale: 1, format: percent };
}

const GRADIENT_STOPS = 24;

/** The colors a track runs through; a hue track is vivid even for a gray. */
function trackBackground(
  state: ColorState,
  space: ColorSpace,
  key: ColorChannel | undefined,
  vertical: boolean,
): string {
  const direction = vertical ? "to top" : "to right";
  if (!key) return `linear-gradient(${direction}, transparent, ${paint(state)}), ${CHECKER}`;
  let base = channelsIn(state, space);
  if (key === "h") {
    if (space === "oklch") base = { ...base, c: Math.max(base.c ?? 0, 0.12) };
    else if (space === "hsl") base = { ...base, s: 1, l: 0.5 };
    else base = { ...base, s: 1, v: 1 };
  }
  const [min, max] = channelDomain(key);
  const stops = Array.from({ length: GRADIENT_STOPS + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / GRADIENT_STOPS;
    return paint({ space, channels: { ...base, [key]: value }, alpha: 1 });
  });
  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}

/** Values where the contrast crosses the ratio: the inner edges of its passing ranges. */
function boundaries(ranges: Array<[number, number]>, [min, max]: [number, number]): number[] {
  return ranges.flat().filter((value) => value > min && value < max);
}

/** The ranges that don't pass: the complement of `passing` in [min, max]. */
function complement(
  passing: Array<[number, number]>,
  [min, max]: [number, number],
): Array<[number, number]> {
  const gaps: Array<[number, number]> = [];
  let cursor = min;
  for (const [from, to] of passing) {
    if (from > cursor) gaps.push([cursor, from]);
    cursor = to;
  }
  if (cursor < max) gaps.push([cursor, max]);
  return gaps;
}

/** Where moving `key` fails AA (hatched) and crosses AA/AAA (marked), in culori units. */
function useTrackContrast(
  state: ColorState,
  space: ColorSpace,
  key: ColorChannel | undefined,
  background: string | undefined,
) {
  // The scanned channel is zeroed so dragging it doesn't rescan.
  const css =
    key && background
      ? formatCss(
          toCulori({ space, channels: { ...channelsIn(state, space), [key]: 0 }, alpha: 1 }),
        )
      : undefined;
  return useMemo(() => {
    if (!css || !key || !background) return undefined;
    const domain = channelDomain(key);
    const aa = passingRanges(css, background, CONTRAST_AA, { space, channel: key });
    const aaa = passingRanges(css, background, CONTRAST_AAA, { space, channel: key });
    return {
      failing: complement(aa, domain),
      marks: [...boundaries(aa, domain), ...boundaries(aaa, domain)],
    };
  }, [css, key, space, background]);
}

type ColorPickerSliderProps = {
  channel: ColorPickerChannel;
  /**
   * The space the channel belongs to. Defaults to OKLCH for lightness, chroma
   * and hue, HSB for saturation and brightness, RGB for red, green and blue.
   */
  colorSpace?: ColorSpace;
  orientation?: "horizontal" | "vertical";
  /** Shows the channel's name and value above a horizontal track. */
  showLabel?: boolean;
  "aria-label"?: string;
  className?: string;
};

/**
 * One channel's track, painted with the colors it reaches from the current
 * one. With `contrastWith`, the part that fails AA is hatched and the AA/AAA
 * thresholds are marked.
 */
function ColorPickerSlider({
  channel,
  colorSpace = "oklch",
  orientation = "horizontal",
  showLabel = false,
  "aria-label": ariaLabel,
  className,
}: ColorPickerSliderProps) {
  const picker = usePicker("ColorPickerSlider");
  const { label, key, spaces } = CHANNELS[channel];
  const space = spaces.includes(colorSpace) ? colorSpace : (spaces[0] ?? "oklch");
  const { min, max, step, scale, format } = channelScale(key, space);
  const channels = channelsIn(picker.state, space);
  const value = key ? (channels[key] ?? 0) * scale : picker.state.alpha;
  const contrast = useTrackContrast(picker.state, space, key, picker.contrastWith);
  const vertical = orientation === "vertical";
  const percent = (v: number) => `${((v * scale - min) / (max - min)) * 100}%`;

  const set = (next: number) => picker.update(withChannel(picker.state, space, key, next / scale));

  return (
    <Slider
      data-slot="color-picker-slider"
      data-channel={channel}
      orientation={orientation}
      isDisabled={picker.isDisabled}
      className={cn(
        "flex gap-1.5 data-disabled:opacity-50",
        vertical ? "h-40 flex-col items-center" : "flex-col",
        className,
      )}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={format}
      value={value}
      onChange={set}
      onChangeEnd={picker.end}
      aria-label={showLabel ? undefined : (ariaLabel ?? label)}
    >
      {showLabel && !vertical && (
        <div className="flex items-center justify-between text-xs">
          <Label className="text-muted-foreground">{ariaLabel ?? label}</Label>
          <SliderOutput className="font-mono tabular-nums" />
        </div>
      )}
      <SliderTrack
        className={cn(
          "relative rounded-md ring-1 ring-foreground/10 ring-inset",
          vertical ? "w-4 flex-1" : "h-4 w-full",
        )}
        style={{ background: trackBackground(picker.state, space, key, vertical) }}
      >
        {contrast?.failing.map(([from, to]) => (
          <span
            key={`${from}-${to}`}
            aria-hidden
            data-slot="color-picker-failing"
            className={cn(
              "pointer-events-none absolute",
              vertical ? "inset-x-0" : "inset-y-0",
              HATCH,
            )}
            style={
              vertical
                ? { bottom: percent(from), height: `calc(${percent(to)} - ${percent(from)})` }
                : { left: percent(from), width: `calc(${percent(to)} - ${percent(from)})` }
            }
          />
        ))}
        {contrast?.marks.map((mark) => (
          <span
            key={mark}
            aria-hidden
            className={cn(
              "pointer-events-none absolute bg-foreground",
              vertical ? "-inset-x-0.5 h-px translate-y-1/2" : "-inset-y-0.5 w-px -translate-x-1/2",
            )}
            style={vertical ? { bottom: percent(mark) } : { left: percent(mark) }}
          />
        ))}
        <SliderThumb
          className={cn(
            "size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_2px_rgb(0_0_0/0.3)] outline-none data-focus-visible:ring-3 data-focus-visible:ring-ring/50",
            vertical ? "left-1/2" : "top-1/2",
          )}
          style={{ background: swatchBackground(picker.value) }}
        />
      </SliderTrack>
    </Slider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Area                                    */
/* -------------------------------------------------------------------------- */

type AreaSpace = "oklch" | "hsb";

const AREA = {
  oklch: { x: "c", y: "l", label: "Chroma and lightness", xLabel: "chroma", yLabel: "Lightness" },
  hsb: {
    x: "s",
    y: "v",
    label: "Saturation and brightness",
    xLabel: "saturation",
    yLabel: "Brightness",
  },
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const percent = (n: number) => `${n * 100}%`;
const toRgb = converter("rgb");

/** The most chroma sRGB reaches at hue `h`, and the lightness where it does. */
function cusp(h: number): { c: number; l: number } {
  let best = { c: 0, l: 0.5 };
  for (let i = 1; i < 100; i++) {
    const l = i / 100;
    const { c } = inGamut({ l, c: 0.4, h, alpha: 1 });
    if (c > best.c) best = { c, l };
  }
  return best;
}

/** The lightness interval where chroma `c` at hue `h` fits sRGB (it contains the cusp's). */
function gamutSpan(c: number, h: number, cuspL: number): [number, number] | undefined {
  const fits = (l: number) => displayable({ mode: "oklch", l, c, h });
  if (!fits(cuspL)) return undefined;
  const edge = (inside: number, outside: number) => {
    for (let i = 0; i < 14; i++) {
      const mid = (inside + outside) / 2;
      if (fits(mid)) inside = mid;
      else outside = mid;
    }
    return inside;
  };
  return [fits(0) ? 0 : edge(cuspL, 0), fits(1) ? 1 : edge(cuspL, 1)];
}

/** Size of the canvas the OKLCH area is painted on (scaled up smoothly). */
const AREA_WIDTH = 128;
const AREA_HEIGHT = 96;

/**
 * Paints chroma × lightness at hue `h`. In a row, sRGB covers chroma from 0 up
 * to a limit; past it the edge color repeats, and the area's clip-path cuts it.
 */
function paintOklchArea(canvas: HTMLCanvasElement, h: number, maxChroma: number) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(AREA_WIDTH, AREA_HEIGHT);
  for (let row = 0; row < AREA_HEIGHT; row++) {
    const l = 1 - (row + 0.5) / AREA_HEIGHT;
    let edge = [0, 0, 0];
    for (let column = 0; column < AREA_WIDTH; column++) {
      const c = ((column + 0.5) / AREA_WIDTH) * maxChroma;
      const { r, g, b } = toRgb({ mode: "oklch", l, c, h });
      if (![r, g, b].some((v) => v < -1e-4 || v > 1 + 1e-4)) {
        edge = [r, g, b].map((v) => Math.round(clamp01(v) * 255));
      }
      image.data.set([...edge, 255], (row * AREA_WIDTH + column) * 4);
    }
  }
  context.putImageData(image, 0, 0);
}

/** Columns across the area its sRGB outline is traced at. */
const GAMUT_COLUMNS = 48;

/** A CSS clip-path tracing where chroma × lightness at hue `h` fits sRGB. */
function gamutClipPath(h: number, maxChroma: number, cuspL: number): string {
  const spans = Array.from({ length: GAMUT_COLUMNS + 1 }, (_, i) => {
    const x = i / GAMUT_COLUMNS;
    return { x, span: gamutSpan(x * maxChroma * 0.999, h, cuspL) };
  }).flatMap(({ x, span }) => (span ? [{ x, span }] : []));
  const top = spans.map(({ x, span }) => `${percent(x)} ${percent(1 - span[1])}`);
  const bottom = spans.reverse().map(({ x, span }) => `${percent(x)} ${percent(1 - span[0])}`);
  return `polygon(${[...top, ...bottom].join(", ")})`;
}

/** A path (0–1 box, y down) of where the region fails: trapezoids between columns. */
function failingPath(region: PassingColumn[]): string {
  const failing = region.map(({ ranges }) => complement(ranges, [0, 1]));
  const width = 1 / (region.length - 1);
  const box = (x0: number, x1: number, [from, to]: [number, number]) =>
    `M${x0} ${1 - to}H${x1}V${1 - from}H${x0}Z`;
  let d = "";
  for (let i = 0; i + 1 < failing.length; i++) {
    const [x0, x1] = [i * width, (i + 1) * width];
    const [left = [], right = []] = [failing[i], failing[i + 1]];
    if (left.length === right.length) {
      left.forEach(([f0, t0], k) => {
        const [f1, t1] = right[k] ?? [f0, t0];
        d += `M${x0} ${1 - t0}L${x1} ${1 - t1}L${x1} ${1 - f1}L${x0} ${1 - f0}Z`;
      });
    } else {
      // The bands split or merge here: each column keeps its own half.
      for (const range of left) d += box(x0, x0 + width / 2, range);
      for (const range of right) d += box(x1 - width / 2, x1, range);
    }
  }
  return d;
}

/** Hatches where the area fails AA and draws the AA (solid) and AAA (dashed) thresholds. */
function AreaContrast({ aa, aaa }: { aa: PassingColumn[]; aaa: PassingColumn[] }) {
  const id = `color-picker-${useId().replace(/[^\w-]/g, "")}`;
  const columns = aa.length - 1;
  const width = 1 / columns;
  const edges = (region: PassingColumn[], i: number) => boundaries(region[i]?.ranges ?? [], [0, 1]);
  const failing = failingPath(aa);
  // A threshold joins each column's edges to the next one's, where they pair up.
  const contour = (region: PassingColumn[]) =>
    Array.from({ length: columns }, (_, i) => {
      const [from, to] = [edges(region, i), edges(region, i + 1)];
      if (from.length !== to.length) return "";
      const [x1, x2] = [i * width, (i + 1) * width];
      return from.map((y1, k) => `M${x1} ${1 - y1}L${x2} ${1 - (to[k] ?? y1)}`).join("");
    }).join("");

  return (
    <svg
      aria-hidden
      data-slot="color-picker-area-contrast"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <defs>
        <pattern
          id={`${id}-hatch`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="3" height="6" fill="rgb(0 0 0 / 0.3)" />
          <rect x="3" width="3" height="6" fill="rgb(255 255 255 / 0.3)" />
        </pattern>
        <clipPath id={`${id}-failing`} clipPathUnits="objectBoundingBox">
          <path d={failing} />
        </clipPath>
      </defs>
      {failing && (
        <rect
          data-slot="color-picker-failing"
          width="100%"
          height="100%"
          fill={`url(#${id}-hatch)`}
          clipPath={`url(#${id}-failing)`}
        />
      )}
      <svg
        aria-hidden
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {(
          [
            ["aa", aa, undefined],
            ["aaa", aaa, "3 3"],
          ] as const
        ).map(([name, region, dash]) => {
          const d = contour(region);
          return (
            <g key={name} data-slot={`color-picker-${name}-threshold`} strokeDasharray={dash}>
              <path
                d={d}
                stroke="rgb(0 0 0 / 0.5)"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
              <path d={d} stroke="white" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
    </svg>
  );
}

type ColorPickerAreaProps = {
  /**
   * OKLCH (default): chroma across, lightness up, at the current hue; the part
   * sRGB can't show is left blank. HSB: saturation across, brightness up.
   */
  colorSpace?: AreaSpace;
  "aria-label"?: string;
  className?: string;
};

/**
 * A 2D area at the current hue: drag or use the arrow keys (Shift for bigger
 * steps). With `contrastWith`, the part failing AA is hatched and the AA (solid)
 * and AAA (dashed) thresholds are drawn across it.
 */
function ColorPickerArea({
  colorSpace = "oklch",
  "aria-label": ariaLabel,
  className,
}: ColorPickerAreaProps) {
  const picker = usePicker("ColorPickerArea");
  const space = colorSpace;
  const { x: xKey, y: yKey, label, xLabel, yLabel } = AREA[space];
  const channels = channelsIn(picker.state, space);
  const h = channels.h ?? 0;
  const peak = useMemo(() => (space === "oklch" ? cusp(h) : { c: 1, l: 1 }), [space, h]);
  const xMax = peak.c;
  const x = xMax > 0 ? clamp01((channels[xKey] ?? 0) / xMax) : 0;
  const y = clamp01(channels[yKey] ?? 0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (space === "oklch" && canvasRef.current) paintOklchArea(canvasRef.current, h, xMax);
  }, [space, h, xMax]);

  const background = picker.contrastWith;
  const contrast = useMemo(() => {
    if (!background) return undefined;
    // Only the hue matters: the area scans the other two channels.
    const css = formatCss(toCulori({ space, channels: { [xKey]: 0, [yKey]: 0, h }, alpha: 1 }));
    const options = { space, x: xKey, y: yKey, xDomain: [0, xMax] as [number, number] };
    const aa = passingRegion(css, background, CONTRAST_AA, options);
    const aaa = passingRegion(css, background, CONTRAST_AAA, options);
    return { aa, aaa };
  }, [background, space, xKey, yKey, h, xMax]);
  const clipPath = useMemo(
    () => (space === "oklch" ? gamutClipPath(h, xMax, peak.l) : undefined),
    [space, h, xMax, peak.l],
  );

  const set = (nextX: number, nextY: number, end = false) => {
    const xValue = clamp01(nextX) * xMax;
    const l = clamp01(nextY);
    const { alpha } = picker.state;
    if (space === "hsb") {
      picker.update({ space, channels: { h, s: xValue, v: l }, alpha }, end);
      return;
    }
    // Chroma stops at the edge of sRGB at that lightness.
    const { c } = inGamut({ l, c: xValue, h, alpha: 1 });
    picker.update({ space, channels: { l, c, h }, alpha }, end);
  };

  // A drag follows the pointer over the whole window until it's released.
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const moveTo = useEffectEvent((clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect) set((clientX - rect.left) / rect.width, 1 - (clientY - rect.top) / rect.height);
  });
  const release = useEffectEvent(() => {
    setDragging(false);
    picker.end();
  });
  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => moveTo(event.clientX, event.clientY);
    const up = () => release();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
      PageUp: [0, 0.1],
      PageDown: [0, -0.1],
      Home: [-1, 0],
      End: [1, 0],
    };
    const move = moves[event.key];
    if (!move || picker.isDisabled) return;
    event.preventDefault();
    set(x + move[0], y + move[1], true);
  };

  const format = (value: number) =>
    space === "oklch" ? value.toFixed(3) : `${Math.round(value * 100)}%`;
  const valueText = `${yLabel} ${format(y)}, ${xLabel} ${format(x * xMax)}`;

  return (
    <div
      role="slider"
      tabIndex={picker.isDisabled ? undefined : 0}
      aria-label={ariaLabel ?? label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(y * 100)}
      aria-valuetext={valueText}
      aria-disabled={picker.isDisabled || undefined}
      data-slot="color-picker-area"
      data-color-space={space}
      dir="ltr"
      className={cn(
        "relative h-40 w-full shrink-0 cursor-crosshair touch-none rounded-md bg-muted ring-1 ring-foreground/10 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        className,
      )}
      style={
        space === "hsb"
          ? {
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${formatHex({ mode: "hsv", h, s: 1, v: 1 })})`,
            }
          : undefined
      }
      ref={areaRef}
      data-dragging={dragging || undefined}
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (picker.isDisabled || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        setDragging(true);
        moveTo(event.clientX, event.clientY);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0" style={{ clipPath }}>
          {space === "oklch" && (
            <canvas
              ref={canvasRef}
              aria-hidden
              width={AREA_WIDTH}
              height={AREA_HEIGHT}
              className="absolute inset-0 size-full"
            />
          )}
          {contrast && <AreaContrast {...contrast} />}
        </div>
      </div>
      <div
        data-slot="color-picker-area-thumb"
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_2px_rgb(0_0_0/0.3)]"
        style={{ left: percent(x), top: percent(1 - y), background: paint(picker.state) }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Fields                                   */
/* -------------------------------------------------------------------------- */

type ColorPickerChannelInputProps = {
  channel: ColorPickerChannel;
  /** The space the channel belongs to (defaults as in ColorPickerSlider). */
  colorSpace?: ColorSpace;
  "aria-label"?: string;
  className?: string;
};

/** A number field for one channel; arrow keys step it, and it commits on Enter or blur. */
function ColorPickerChannelInput({
  channel,
  colorSpace = "oklch",
  "aria-label": ariaLabel,
  className,
}: ColorPickerChannelInputProps) {
  const picker = usePicker("ColorPickerChannelInput");
  const { label, key, spaces } = CHANNELS[channel];
  const space = spaces.includes(colorSpace) ? colorSpace : (spaces[0] ?? "oklch");
  const { min, max, step, scale, format } = channelScale(key, space);
  const value = key ? (channelsIn(picker.state, space)[key] ?? 0) * scale : picker.state.alpha;
  return (
    <NumberField
      data-slot="color-picker-channel-input"
      data-channel={channel}
      aria-label={ariaLabel ?? label}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={format}
      value={value}
      isDisabled={picker.isDisabled}
      onChange={(next) => {
        if (Number.isNaN(next)) return;
        picker.update(withChannel(picker.state, space, key, next / scale), true);
      }}
      className={cn("min-w-0", className)}
    >
      <Input className="h-7 px-1 text-center font-mono text-xs tabular-nums md:text-xs" />
    </NumberField>
  );
}

/** The color as hex, typed with or without `#`; commits on Enter or blur. */
function HexInput() {
  const picker = usePicker("ColorPickerFields");
  const hex = formatState({ ...picker.state, alpha: 1 }, "hex");
  const [draft, setDraft] = useState(hex);
  useEffect(() => setDraft(hex), [hex]);
  const commit = () => {
    const next = parseState(draft.startsWith("#") ? draft : `#${draft}`, picker.state);
    if (next && formatState({ ...next, alpha: 1 }, "hex") !== hex) {
      picker.update({ ...next, alpha: picker.state.alpha }, true);
    } else setDraft(hex);
  };
  return (
    <Input
      data-slot="color-picker-hex-input"
      aria-label="Hex"
      value={draft}
      spellCheck={false}
      disabled={picker.isDisabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape" && draft !== hex) {
          // Reverts the draft instead of closing the popover.
          event.stopPropagation();
          setDraft(hex);
        }
      }}
      className="h-7 min-w-0 px-1.5 font-mono text-xs md:text-xs"
    />
  );
}

const FORMAT_LABELS: Record<ColorPickerFormat, string> = {
  oklch: "OKLCH",
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
};

const FORMAT_CHANNELS: Record<
  Exclude<ColorPickerFormat, "hex">,
  [ColorSpace, ColorPickerChannel[]]
> = {
  oklch: ["oklch", ["lightness", "chroma", "hue"]],
  rgb: ["rgb", ["red", "green", "blue"]],
  hsl: ["hsl", ["hue", "saturation", "lightness"]],
};

type ColorPickerFieldsProps = {
  /** The formats offered in the menu (the first shown, unless it has the picker's). */
  formats?: ColorPickerFormat[];
  className?: string;
};

/**
 * A format menu and the fields of that format: a hex input, or one number
 * field per channel (plus alpha when the picker has `alpha`).
 */
function ColorPickerFields({
  formats = ["oklch", "hex", "rgb", "hsl"],
  className,
}: ColorPickerFieldsProps) {
  const picker = usePicker("ColorPickerFields");
  const [format, setFormat] = useState<ColorPickerFormat>(() =>
    formats.includes(picker.format) ? picker.format : (formats[0] ?? "hex"),
  );
  return (
    <div data-slot="color-picker-fields" className={cn("flex items-center gap-1.5", className)}>
      {formats.length > 1 && (
        <Select
          aria-label="Color format"
          value={format}
          onChange={(key) => {
            const next = formats.find((f) => f === key);
            if (next) setFormat(next);
          }}
          isDisabled={picker.isDisabled}
        >
          <SelectTrigger size="sm" className="w-21 shrink-0 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formats.map((f) => (
              <SelectItem key={f} id={f}>
                {FORMAT_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="grid min-w-0 flex-1 auto-cols-fr grid-flow-col gap-1">
        {format === "hex" ? (
          <HexInput />
        ) : (
          FORMAT_CHANNELS[format][1].map((channel) => (
            <ColorPickerChannelInput
              key={channel}
              channel={channel}
              colorSpace={FORMAT_CHANNELS[format][0]}
            />
          ))
        )}
        {picker.alpha && <ColorPickerChannelInput channel="alpha" />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Swatches                                  */
/* -------------------------------------------------------------------------- */

type ColorPickerSwatchesProps = {
  /** Preset colors. Defaults to the picker's `swatches`, else Tailwind's palette. */
  colors?: Swatch[];
  /** Columns of the grid. Defaults to the picker's `swatchColumns`. */
  columns?: number;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/**
 * A grid of preset colors that sets the color in one click (arrow keys move
 * through it). With `contrastWith`, presets failing AA are hatched.
 */
function ColorPickerSwatches({
  colors,
  columns,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  className,
}: ColorPickerSwatchesProps) {
  const picker = usePicker("ColorPickerSwatches");
  const swatches = colors ?? picker.swatches ?? DEFAULT_SWATCHES;
  // Swatches are compared as the picker emits them (oklch, clamped to sRGB, opaque).
  const items = useMemo(() => {
    const seen = new Set<string>();
    return swatches.flatMap((swatch) => {
      const state = parseState(swatchColor(swatch));
      if (!state) return [];
      const id = formatState({ ...state, alpha: 1 });
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ id, name: swatchName(swatch), paint: paint(state) }];
    });
  }, [swatches]);
  if (items.length === 0) return null;
  const selectedId = formatState({ ...picker.state, alpha: 1 });
  const background = picker.contrastWith;

  return (
    <ListBox
      data-slot="color-picker-swatches"
      aria-label={ariaLabel ?? (ariaLabelledby ? undefined : "Preset colors")}
      aria-labelledby={ariaLabelledby}
      layout="grid"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[selectedId]}
      onSelectionChange={(keys) => {
        const [key] = keys === "all" ? [] : [...keys];
        const next = typeof key === "string" ? parseState(key) : undefined;
        if (next) picker.update({ ...next, alpha: picker.state.alpha }, true);
      }}
      className={cn("grid gap-1 outline-none", className)}
      style={{
        gridTemplateColumns: `repeat(${columns ?? picker.swatchColumns ?? TAILWIND_HUES.length}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item) => {
        const ratio = background ? contrastRatio(background, item.id) : undefined;
        const fails = ratio !== undefined && ratio < CONTRAST_AA;
        return (
          <ListBoxItem
            key={item.id}
            id={item.id}
            textValue={item.name}
            aria-label={ratio === undefined ? item.name : `${item.name}, ${ratio.toFixed(2)}:1`}
            isDisabled={picker.isDisabled}
            data-failing={fails || undefined}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-sm ring-1 ring-foreground/10 outline-none ring-inset data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-2 data-focus-visible:ring-ring data-selected:ring-2 data-selected:ring-foreground"
            style={{ background: item.paint }}
          >
            {fails && <span aria-hidden className={cn("absolute inset-0", HATCH)} />}
          </ListBoxItem>
        );
      })}
    </ListBox>
  );
}

type ColorPickerSwatchProps = Omit<ComponentProps<"span">, "color"> & {
  /** The color shown. Defaults to the surrounding picker's. */
  color?: string;
};

/** A chip of a color (the picker's by default), over a checker when translucent. */
function ColorPickerSwatch({ color, className, style, ...props }: ColorPickerSwatchProps) {
  const picker = useContext(ColorPickerContext);
  const value = color ?? picker?.value ?? "transparent";
  return (
    <span
      data-slot="color-picker-swatch"
      className={cn(
        "inline-block size-5 shrink-0 rounded-sm ring-1 ring-foreground/10 ring-inset",
        className,
      )}
      style={{ background: swatchBackground(value), ...style }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                              Input and actions                             */
/* -------------------------------------------------------------------------- */

type ColorPickerInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue" | "onChange"
> & {
  /**
   * Reads what was typed as a CSS color, for syntaxes culori doesn't parse
   * (e.g. bare "222 47% 11%" triplets). Return undefined to reject it.
   */
  parseValue?: (text: string) => string | undefined;
};

/**
 * A text field taking any CSS color (hex, rgb(), hsl(), oklch(), names…),
 * committed on Enter or blur; Escape reverts what was typed. A swatch at its
 * start opens ColorPickerContent, placed against the field.
 */
function ColorPickerInput({
  className,
  parseValue,
  onBlur,
  onKeyDown,
  ...props
}: ColorPickerInputProps) {
  const picker = usePicker("ColorPickerInput");
  const [draft, setDraft] = useState(picker.value);
  useEffect(() => setDraft(picker.value), [picker.value]);
  const read = (text: string) => {
    const css = parseValue ? parseValue(text) : text;
    return css === undefined ? undefined : parseState(css, picker.state);
  };
  const valid = read(draft) !== undefined;
  const commit = () => {
    const next = read(draft);
    if (next && formatState(next, picker.format) !== picker.value) picker.update(next, true);
    else setDraft(picker.value);
  };

  return (
    <div ref={picker.anchorRef} data-slot="color-picker-input" className={cn("w-full", className)}>
      <InputGroup isDisabled={picker.isDisabled}>
        <InputGroupAddon align="inline-start">
          <ColorPickerTrigger className="size-5 rounded-sm" />
        </InputGroupAddon>
        <InputGroupInput
          value={draft}
          spellCheck={false}
          autoComplete="off"
          disabled={picker.isDisabled}
          aria-invalid={!valid || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => {
            onBlur?.(event);
            commit();
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setDraft(picker.value);
          }}
          className="font-mono"
          {...props}
        />
      </InputGroup>
    </div>
  );
}

/** The current value as text (in `format`, or the picker's). */
function ColorPickerValue({
  format,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & { format?: ColorPickerFormat }) {
  const picker = usePicker("ColorPickerValue");
  return (
    <span data-slot="color-picker-value" className={cn("tabular-nums", className)} {...props}>
      {format ? formatState(picker.state, format) : picker.value}
    </span>
  );
}

type ColorPickerActionProps = Omit<ComponentProps<typeof Button>, "children"> & {
  children?: ReactNode;
};

type ColorPickerCopyProps = ColorPickerActionProps & {
  /** The format copied. Defaults to the picker's. */
  format?: ColorPickerFormat;
};

/** Copies the value to the clipboard; its icon turns into a check for a moment. */
function ColorPickerCopy({
  format,
  variant = "ghost",
  size = "icon-sm",
  children,
  ...props
}: ColorPickerCopyProps) {
  const picker = usePicker("ColorPickerCopy");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);
  const text = format ? formatState(picker.state, format) : picker.value;
  return (
    <Button
      data-slot="color-picker-copy"
      data-copied={copied || undefined}
      variant={variant}
      size={size}
      aria-label={copied ? "Copied" : "Copy color"}
      onPress={() => {
        navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
      {...props}
    >
      {children ?? (copied ? <CheckIcon /> : <CopyIcon />)}
    </Button>
  );
}

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };

const getEyeDropper = () => (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
const noSubscribe = () => () => {};

/**
 * Samples a color from anywhere on screen, keeping the current alpha. Renders
 * nothing where the browser has no EyeDropper (Firefox, Safari).
 */
function ColorPickerEyeDropper({
  variant = "ghost",
  size = "icon-sm",
  children,
  ...props
}: ColorPickerActionProps) {
  const picker = usePicker("ColorPickerEyeDropper");
  // False on the server and on hydration, so the markup matches.
  const supported = useSyncExternalStore(
    noSubscribe,
    () => getEyeDropper() !== undefined,
    () => false,
  );
  if (!supported) return null;
  return (
    <Button
      data-slot="color-picker-eye-dropper"
      variant={variant}
      size={size}
      aria-label="Pick a color from the screen"
      isDisabled={picker.isDisabled}
      onPress={async () => {
        const EyeDropper = getEyeDropper();
        if (!EyeDropper) return;
        try {
          const { sRGBHex } = await new EyeDropper().open();
          const next = parseState(sRGBHex);
          if (next) picker.update({ ...next, alpha: picker.state.alpha }, true);
        } catch {
          // Escape cancels the sampler with an AbortError.
        }
      }}
      {...props}
    >
      {children ?? <PipetteIcon />}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Contrast                                  */
/* -------------------------------------------------------------------------- */

/**
 * A bar of the color. With `contrastWith`, it shows "Aa" in the color on that
 * background, with the WCAG ratio and level beside it.
 */
function ColorPickerPreview({ className }: { className?: string }) {
  const picker = usePicker("ColorPickerPreview");
  const background = picker.contrastWith;
  const ratio = background ? contrastRatio(background, picker.value) : undefined;
  const level = ratio === undefined ? undefined : contrastLevel(ratio);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        data-slot="color-picker-preview"
        className="flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium ring-1 ring-foreground/10"
        style={
          background
            ? { background, color: picker.value }
            : { background: swatchBackground(picker.value) }
        }
      >
        {background && "Aa"}
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
  );
}

/**
 * "Fix to AA" / "Fix to AAA" buttons: move to the nearest OKLCH lightness that
 * reaches the ratio against `contrastWith`, keeping hue, chroma and alpha.
 */
function ColorPickerFixContrast({ className }: { className?: string }) {
  const picker = usePicker("ColorPickerFixContrast");
  const background = picker.contrastWith;
  const { l = 0, c = 0, h = 0 } = channelsIn(picker.state, "oklch");
  const targets = useMemo(() => {
    if (!background) return undefined;
    const color = formatOklchChannels({ l, c, h, alpha: 1 });
    return {
      AA: nearestContrastColor(color, background, CONTRAST_AA),
      AAA: nearestContrastColor(color, background, CONTRAST_AAA),
    };
  }, [l, c, h, background]);
  if (!background || !targets) return null;
  const ratio = contrastRatio(background, picker.value);

  return (
    <div className={cn("flex gap-2", className)}>
      {(
        [
          ["AA", targets.AA, CONTRAST_AA],
          ["AAA", targets.AAA, CONTRAST_AAA],
        ] as const
      ).map(([name, target, min]) => (
        <Button
          key={name}
          size="sm"
          variant="outline"
          className="flex-1"
          isDisabled={picker.isDisabled || !target || ratio >= min}
          onPress={() => {
            const next = target ? parseState(target) : undefined;
            if (!next) return;
            const channels = { ...next.channels, h };
            picker.update({ space: "oklch", channels, alpha: picker.state.alpha }, true);
          }}
        >
          <ContrastIcon />
          Fix to {name}
        </Button>
      ))}
    </div>
  );
}

export type {
  ColorPickerActionProps,
  ColorPickerAreaProps,
  ColorPickerChannel,
  ColorPickerChannelInputProps,
  ColorPickerContentProps,
  ColorPickerCopyProps,
  ColorPickerFieldsProps,
  ColorPickerFormat,
  ColorPickerInputProps,
  ColorPickerPanelProps,
  ColorPickerProps,
  ColorPickerSliderProps,
  ColorPickerSwatchesProps,
  ColorPickerSwatchProps,
  ColorPickerTriggerProps,
  Swatch,
};
export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerChannelInput,
  ColorPickerContent,
  ColorPickerCopy,
  ColorPickerEyeDropper,
  ColorPickerFields,
  ColorPickerFixContrast,
  ColorPickerInput,
  ColorPickerPanel,
  ColorPickerPreview,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
  ColorPickerValue,
  DEFAULT_SWATCHES,
  useColorPicker,
};
