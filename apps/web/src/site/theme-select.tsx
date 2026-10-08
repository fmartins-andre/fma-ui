import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { sameTheme } from "@/lib/theme/index";
import { cn } from "@/lib/utils";
import { getTheme, THEMES } from "@/themes/index";
import { dispatchTheme, useThemeState } from "./theme";

const CUSTOM_KEY = "__custom";

/** Picks the site theme from the curated presets; the theme editor customizes it. */
export function ThemeSelect({ className }: { className?: string }) {
  const { loaded } = useThemeState();
  const loadedPreset = getTheme(loaded.name);
  const presetKey = loadedPreset && sameTheme(loadedPreset, loaded) ? loaded.name : CUSTOM_KEY;

  return (
    <Select
      aria-label="Theme preset"
      selectedKey={presetKey}
      onSelectionChange={(key) => {
        const next = key === null ? undefined : getTheme(String(key));
        if (next) dispatchTheme({ type: "load", theme: next });
      }}
    >
      {/* Matches the header's outline buttons (search): same height, radius and surface. */}
      <SelectTrigger className={cn("w-40 bg-background font-medium", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {presetKey === CUSTOM_KEY && (
          <>
            <SelectItem id={CUSTOM_KEY}>{loaded.title} (imported)</SelectItem>
            <SelectSeparator />
          </>
        )}
        {THEMES.map((item) => (
          <SelectItem key={item.name} id={item.name}>
            {item.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
