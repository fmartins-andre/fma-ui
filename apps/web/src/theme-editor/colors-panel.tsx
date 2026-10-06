import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/accordion/accordion";
import type { ColorToken, Theme, ThemeMode } from "@/lib/theme/index";
import { ColorField } from "./fields";

interface ColorEntry {
  token: ColorToken;
  label: string;
  /** For text colors: the background they sit on (contrast badge). */
  on?: ColorToken;
}

interface ColorGroup {
  id: string;
  title: string;
  hint?: string;
  colors: ColorEntry[];
}

const pair = (bg: ColorToken, fg: ColorToken): ColorEntry[] => [
  { token: bg, label: "Background" },
  { token: fg, label: "Foreground", on: bg },
];

export const COLOR_GROUPS: ColorGroup[] = [
  { id: "primary", title: "Primary", colors: pair("primary", "primary-foreground") },
  { id: "secondary", title: "Secondary", colors: pair("secondary", "secondary-foreground") },
  { id: "accent", title: "Accent", colors: pair("accent", "accent-foreground") },
  { id: "base", title: "Base", colors: pair("background", "foreground") },
  { id: "card", title: "Card", colors: pair("card", "card-foreground") },
  { id: "popover", title: "Popover", colors: pair("popover", "popover-foreground") },
  { id: "muted", title: "Muted", colors: pair("muted", "muted-foreground") },
  {
    id: "status",
    title: "Status",
    hint: "Each foreground is text on a light tint of its color (badges, alerts), so contrast is checked against the page background.",
    colors: (["destructive", "info", "success", "warning"] as const).flatMap((status) => [
      { token: status, label: status[0]?.toUpperCase() + status.slice(1) },
      { token: `${status}-foreground` as ColorToken, label: "Foreground", on: "background" },
    ]),
  },
  { id: "invert", title: "Invert", colors: pair("invert", "invert-foreground") },
  {
    id: "border",
    title: "Border & input",
    colors: [
      { token: "border", label: "Border" },
      { token: "input", label: "Input" },
      { token: "ring", label: "Ring" },
    ],
  },
  {
    id: "chart",
    title: "Chart",
    colors: (["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const).map((token) => ({
      token,
      label: `Chart ${token.slice(-1)}`,
    })),
  },
  {
    id: "sidebar",
    title: "Sidebar",
    colors: [
      ...pair("sidebar", "sidebar-foreground"),
      { token: "sidebar-primary", label: "Primary" },
      { token: "sidebar-primary-foreground", label: "Primary foreground", on: "sidebar-primary" },
      { token: "sidebar-accent", label: "Accent" },
      { token: "sidebar-accent-foreground", label: "Accent foreground", on: "sidebar-accent" },
      { token: "sidebar-border", label: "Border" },
      { token: "sidebar-ring", label: "Ring" },
    ],
  },
];

export function ColorsPanel({
  theme,
  mode,
  edit,
}: {
  theme: Theme;
  mode: ThemeMode;
  edit: (update: (theme: Theme) => Theme) => void;
}) {
  const colors = theme[mode];
  return (
    <Accordion allowsMultipleExpanded defaultExpandedKeys={["primary", "secondary", "base"]}>
      {COLOR_GROUPS.map((group) => (
        <AccordionItem key={group.id} id={group.id}>
          <AccordionTrigger>{group.title}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 pb-1">
              {group.hint && <p className="text-xs text-muted-foreground">{group.hint}</p>}
              {group.colors.map(({ token, label, on }) => (
                <ColorField
                  key={token}
                  label={`${label} (--${token})`}
                  value={colors[token]}
                  contrastWith={on ? colors[on] : undefined}
                  onChange={(value) =>
                    edit((current) => ({
                      ...current,
                      [mode]: { ...current[mode], [token]: value },
                    }))
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
