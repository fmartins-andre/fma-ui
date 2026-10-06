import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import { expect, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Input } from "@/core/input/input";
import {
  loadThemeFonts,
  modeThemeVars,
  sharedThemeVars,
  type Theme,
  type ThemeMode,
} from "@/lib/theme/index";
import { THEMES } from "@/themes/index";

// Doc-only gallery of the curated themes in src/themes (published as
// @fma-ui/theme-<name>). Each card scopes its theme's variables inline, so all
// of them render at once; the light/dark toolbar picks the mode. To see a
// whole story in one theme, use the theme toolbar instead.

const SWATCHES = ["primary", "secondary", "accent", "muted", "destructive", "border"] as const;

function ThemeCard({ theme, mode }: { theme: Theme; mode: ThemeMode }) {
  useEffect(() => loadThemeFonts(theme), [theme]);
  const style = { ...sharedThemeVars(theme), ...modeThemeVars(theme, mode) } as CSSProperties;
  return (
    <div
      style={style}
      className="flex flex-col gap-3 rounded-xl border bg-background p-4 font-sans text-foreground shadow-sm"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading font-medium">{theme.title}</h3>
        <code className="text-xs text-muted-foreground">@fma-ui/theme-{theme.name}</code>
      </div>
      <p className="text-sm text-muted-foreground">{theme.description}</p>
      <div className="flex gap-1.5">
        {SWATCHES.map((token) => (
          <div
            key={token}
            title={token}
            className="size-6 rounded-md ring-1 ring-foreground/10"
            style={{ background: `var(--${token})` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
        <Badge variant="success-light">Success</Badge>
        <Badge variant="destructive-light">Error</Badge>
      </div>
      <Input aria-label={`${theme.title} input`} placeholder="Type here…" />
    </div>
  );
}

const meta = {
  title: "design/Themes",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Curated themes from src/themes, each installable with `shadcn add @fma-ui/theme-<name>`. Toggle light/dark in the toolbar; pick a theme in the toolbar to apply it to every story.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: (_args, { globals }) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((theme) => (
        <ThemeCard
          key={theme.name}
          theme={theme}
          mode={globals.theme === "dark" ? "dark" : "light"}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const theme of THEMES) {
      const name = canvas.getByText(`@fma-ui/theme-${theme.name}`);
      // biome-ignore lint/style/noNonNullAssertion: the code sits inside its card
      const card = name.closest<HTMLElement>("[style]")!;
      await expect(getComputedStyle(card).getPropertyValue("--primary").trim()).toBe(
        theme.light.primary,
      );
    }
  },
};
