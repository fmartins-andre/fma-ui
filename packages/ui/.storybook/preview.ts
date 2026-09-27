import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    a11y: {
      // "error" would fail `test:storybook` on a11y violations; "todo" surfaces
      // them in the panel without failing the run.
      test: "todo",
    },
    options: {
      storySort: {
        order: ["ui"],
      },
    },
  },
};

export default preview;
