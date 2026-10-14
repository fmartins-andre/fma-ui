import { type ReactNode, useId } from "react";
import { Badge } from "@/core/badge/badge";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerInput,
} from "@/core/color-picker/color-picker";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { Slider } from "@/core/slider/slider";
import { contrastLevel } from "@/lib/color-contrast";
import { contrastRatio, isColor, toOklch } from "@/lib/theme/index";

export function ContrastBadge({
  background,
  foreground,
}: {
  background: string;
  foreground: string;
}) {
  const ratio = contrastRatio(background, foreground);
  const level = contrastLevel(ratio);
  return (
    <Badge
      variant={
        level === "Fail"
          ? "destructive-light"
          : level === "AA18"
            ? "warning-light"
            : "success-light"
      }
      title={`Contrast ${ratio.toFixed(2)}:1 against its background`}
    >
      {ratio.toFixed(1)} {level === "AA18" ? "AA large" : level}
    </Badge>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  onChangeEnd,
  contrastWith,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** A pick finished (drag released, preset, committed text). */
  onChangeEnd?: () => void;
  /** The background this color is text on: shows a contrast badge, and contrast in the picker. */
  contrastWith?: string;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        {contrastWith && <ContrastBadge background={contrastWith} foreground={value} />}
      </div>
      <ColorPicker
        label={`Pick ${label}`}
        value={value}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        contrastWith={contrastWith}
      >
        <ColorPickerInput
          id={id}
          // Also takes shadcn v3's bare "222 47% 11%" triplets.
          parseValue={(text) => (isColor(text) ? toOklch(text) : undefined)}
          className="[&_[data-slot=input-group-control]]:text-xs"
        />
        <ColorPickerContent />
      </ColorPicker>
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={id}
            type="number"
            className="h-7 w-20 text-right font-mono text-xs"
            value={String(value)}
            min={min}
            max={max}
            step={step}
            onChange={(event) => {
              const next = Number.parseFloat(event.target.value);
              if (Number.isFinite(next)) onChange(next);
            }}
          />
          {unit && <span className="w-6 text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        aria-label={label}
        value={Math.min(max, Math.max(min, value))}
        minValue={min}
        maxValue={max}
        step={step}
        onChange={(next) => onChange(Array.isArray(next) ? (next[0] ?? min) : next)}
      />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}
