import { useEffect, useId, useState } from "react";
import { Button } from "@/core/button/button";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import {
  type FontCategory,
  fontStack,
  GOOGLE_FONTS,
  primaryFamily,
  type Theme,
} from "@/lib/theme/index";
import { Section, SliderField } from "./fields";

const CATEGORIES: { key: FontCategory; label: string; utility: string }[] = [
  { key: "sans", label: "Sans-serif", utility: "font-sans" },
  { key: "serif", label: "Serif", utility: "font-serif" },
  { key: "mono", label: "Monospace", utility: "font-mono" },
];

const DEFAULT_KEY = "__default";
const CUSTOM_KEY = "__custom";

function FontField({
  category,
  label,
  utility,
  value,
  onChange,
}: {
  category: FontCategory;
  label: string;
  utility: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  const family = value ? primaryFamily(value) : undefined;
  const selected = !family
    ? DEFAULT_KEY
    : GOOGLE_FONTS[category].includes(family)
      ? family
      : CUSTOM_KEY;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} <code className="font-mono">({utility})</code>
      </Label>
      <Select
        aria-label={`${label} font`}
        selectedKey={selected}
        onSelectionChange={(key) => {
          if (key === DEFAULT_KEY) onChange(undefined);
          else if (key !== CUSTOM_KEY && key !== null) onChange(fontStack(String(key), category));
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem id={DEFAULT_KEY}>Default (styles.css)</SelectItem>
          {selected === CUSTOM_KEY && <SelectItem id={CUSTOM_KEY}>{family}</SelectItem>}
          <SelectSeparator />
          {GOOGLE_FONTS[category].map((font) => (
            <SelectItem key={font} id={font} textValue={font}>
              <span style={{ fontFamily: `"${font}"` }}>{font}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        aria-label={`${label} font-family stack`}
        placeholder="font-family stack, e.g. Inter, sans-serif"
        className="font-mono text-xs"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onChange(draft.trim() || undefined)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onChange(draft.trim() || undefined);
        }}
      />
    </div>
  );
}

export function TypographyPanel({
  theme,
  edit,
}: {
  theme: Theme;
  edit: (update: (theme: Theme) => Theme) => void;
}) {
  const tracking = Number.parseFloat(theme.letterSpacing ?? "0") || 0;
  return (
    <div className="flex flex-col gap-6">
      <Section title="Font family">
        <p className="text-xs text-muted-foreground">
          Google Fonts load here automatically. In your app, load them yourself (next/font,
          @fontsource or a &lt;link&gt;); the registry item says which.
        </p>
        {CATEGORIES.map(({ key, label, utility }) => (
          <FontField
            key={key}
            category={key}
            label={label}
            utility={utility}
            value={theme.fonts[key]}
            onChange={(value) =>
              edit((current) => ({ ...current, fonts: { ...current.fonts, [key]: value } }))
            }
          />
        ))}
      </Section>
      <Section title="Letter spacing">
        <SliderField
          label="Tracking (body)"
          value={tracking}
          min={-0.1}
          max={0.1}
          step={0.005}
          unit="em"
          onChange={(value) =>
            edit((current) => ({
              ...current,
              letterSpacing: value === 0 ? undefined : `${Number(value.toFixed(3))}em`,
            }))
          }
        />
        {theme.letterSpacing && (
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onPress={() => edit((current) => ({ ...current, letterSpacing: undefined }))}
          >
            Reset to normal
          </Button>
        )}
      </Section>
    </div>
  );
}
