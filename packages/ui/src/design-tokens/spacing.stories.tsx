import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

// Doc-only: the spacing scale. Unlike --radius, styles.css has no custom
// --spacing override — this is Tailwind's own default base (0.25rem), read
// live so this story stays honest if that ever changes. Not a registry item.

function useSpacingBase(): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue("--spacing").trim());
  });
  return value;
}

const STEPS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32];

function SpacingSample({ n, base }: { n: number; base: string }) {
  return (
    <div className="flex items-center gap-4">
      <code className="w-10 shrink-0 text-xs text-muted-foreground">{n}</code>
      <div className="h-4 rounded-sm bg-primary" style={{ width: `calc(var(--spacing) * ${n})` }} />
      <code className="text-xs text-muted-foreground">
        calc(var(--spacing) * {n}) = calc({base} * {n})
      </code>
    </div>
  );
}

const meta = {
  title: "design/Spacing",
  parameters: {
    docs: {
      description: {
        component:
          "Spacing scale used by p-*/gap-*/w-*/etc. --spacing (0.25rem) is Tailwind's own default — styles.css doesn't override it, unlike --radius.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: function Render() {
    const base = useSpacingBase();
    return (
      <div className="flex flex-col gap-3">
        {STEPS.map((n) => (
          <SpacingSample key={n} n={n} base={base} />
        ))}
      </div>
    );
  },
};
