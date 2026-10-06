import { type ReactNode, useEffect, useId, useState } from "react";
import { Badge } from "@/core/badge/badge";
import { ColorPicker } from "@/core/color-picker/color-picker";
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
  contrastWith,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The background this color is text on: shows a contrast badge. */
  contrastWith?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = isColor(draft);

  const commit = () => {
    if (valid && draft !== value) onChange(toOklch(draft));
    else setDraft(value);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        {contrastWith && <ContrastBadge background={contrastWith} foreground={value} />}
      </div>
      <div className="flex items-center gap-2">
        <ColorPicker
          label={`Pick ${label}`}
          value={value}
          onChange={onChange}
          contrastWith={contrastWith}
        />
        <Input
          id={id}
          value={draft}
          aria-invalid={!valid || undefined}
          className="font-mono text-xs"
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
      </div>
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
