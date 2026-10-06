import type { Preview } from "@storybook/react-vite";
import { applyTheme, clearTheme, loadThemeFonts } from "../src/lib/theme/index";
import { getTheme, THEMES } from "../src/themes/index";
import "../src/styles.css";

// styles.css defines dark mode as `@custom-variant dark (&:is(.dark *))` — a
// single binary toggle on <html>. The decorator flips that class and, for any
// curated theme other than "default" (which is styles.css itself), sets the
// theme's variables inline on <html> so every story renders in it.
function withTheme(
  Story: () => unknown,
  context: { globals: { theme?: "light" | "dark"; themePreset?: string } },
) {
  const mode = context.globals.theme ?? "light";
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  const preset = getTheme(context.globals.themePreset ?? "default");
  if (!preset || preset.name === "default") {
    clearTheme(root);
  } else {
    applyTheme(root, preset, mode);
    loadThemeFonts(preset);
  }
  return Story();
}

const preview: Preview = {
  decorators: [withTheme as never],
  globalTypes: {
    theme: {
      description: "Light/dark mode (toggles the `dark` class from src/styles.css)",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    themePreset: {
      description: "Curated theme from src/themes (published as @fma-ui/theme-<name>)",
      toolbar: {
        icon: "paintbrush",
        dynamicTitle: true,
        items: THEMES.map((theme) => ({ value: theme.name, title: theme.title })),
      },
    },
  },
  initialGlobals: {
    theme: "light",
    themePreset: "default",
  },
  parameters: {
    layout: "centered",
    a11y: {
      // "error" would fail `test:storybook` on a11y violations; "todo" surfaces
      // them in the panel without failing the run.
      test: "todo",
    },
    options: {
      storySort: {
        order: ["design", "ui"],
      },
    },
  },
};

export default preview;
