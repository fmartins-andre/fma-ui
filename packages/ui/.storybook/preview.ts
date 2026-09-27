import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

// styles.css defines dark mode as `@custom-variant dark (&:is(.dark *))` — a
// single binary toggle on <html>, unlike a multi-theme-file setup. This
// decorator just flips that class from a toolbar control.
function withTheme(Story: () => unknown, context: { globals: { theme?: "light" | "dark" } }) {
  const theme = context.globals.theme ?? "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
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
  },
  initialGlobals: {
    theme: "light",
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
