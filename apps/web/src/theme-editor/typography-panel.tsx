import { Fragment, type ReactNode, useEffect, useId, useState } from "react";
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
  type EditableSetting,
  FONT_CONTROLS,
  type FontSlot,
  fontStack,
  GOOGLE_FONTS,
  primaryFamily,
  type Theme,
} from "@/lib/theme/index";
import { Section, SliderField } from "./fields";

/** The theme settings this panel edits; see SETTINGS_COVERED in editor.tsx. */
export const TYPOGRAPHY_SETTINGS = ["fonts", "letterSpacing"] as const satisfies EditableSetting[];
type TypographySetting = (typeof TYPOGRAPHY_SETTINGS)[number];

const DEFAULT_KEY = "__default";
const CUSTOM_KEY = "__custom";

function FontField({
  slot,
  value,
  onChange,
}: {
  slot: FontSlot;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  const { label, utility, catalog, fallback } = FONT_CONTROLS[slot];
  const fonts = catalog.flatMap((category) => GOOGLE_FONTS[category]);
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  const family = value ? primaryFamily(value) : undefined;
  const selected = !family ? DEFAULT_KEY : fonts.includes(family) ? family : CUSTOM_KEY;

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
          else if (key !== CUSTOM_KEY && key !== null) {
            const font = String(key);
            // A serif picked for headings falls back to serif, not sans.
            const category = catalog.find((item) => GOOGLE_FONTS[item].includes(font));
            onChange(fontStack(font, category ?? fallback));
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem id={DEFAULT_KEY}>Default (styles.css)</SelectItem>
          {selected === CUSTOM_KEY && <SelectItem id={CUSTOM_KEY}>{family}</SelectItem>}
          <SelectSeparator />
          {fonts.map((font) => (
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
  const sections: Record<TypographySetting, ReactNode> = {
    fonts: (
      <Section title="Font family">
        <p className="text-xs text-muted-foreground">
          Fonts from the list load here from Google Fonts; in your app the registry item installs
          them as @fontsource packages. A stack typed by hand isn't installed for you.
        </p>
        {(Object.keys(FONT_CONTROLS) as FontSlot[]).map((key) => (
          <FontField
            key={key}
            slot={key}
            value={theme.fonts[key]}
            onChange={(value) =>
              edit((current) => ({ ...current, fonts: { ...current.fonts, [key]: value } }))
            }
          />
        ))}
      </Section>
    ),
    letterSpacing: (
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
    ),
  };
  return (
    <div className="flex flex-col gap-6">
      {TYPOGRAPHY_SETTINGS.map((setting) => (
        <Fragment key={setting}>{sections[setting]}</Fragment>
      ))}
    </div>
  );
}
