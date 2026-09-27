import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

// Doc-only: box-shadow scale. Tailwind v4's own defaults — styles.css doesn't
// override --shadow-*. Not a registry item.

function useTokenValue(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  });
  return value;
}

const SHADOWS = [
  { className: "shadow-2xs", token: "--shadow-2xs" },
  { className: "shadow-xs", token: "--shadow-xs" },
  { className: "shadow-sm", token: "--shadow-sm" },
  { className: "shadow-md", token: "--shadow-md" },
  { className: "shadow-lg", token: "--shadow-lg" },
  { className: "shadow-xl", token: "--shadow-xl" },
  { className: "shadow-2xl", token: "--shadow-2xl" },
  { className: "shadow-inner", token: "--shadow-inner" },
];

function ShadowSample({ className, token }: { className: string; token: string }) {
  const value = useTokenValue(token);
  return (
    <div className="flex items-center gap-4">
      <div className={`size-14 shrink-0 rounded-md bg-card ${className}`} />
      <div className="flex flex-col">
        <code className="text-sm">{className}</code>
        <code className="text-xs text-muted-foreground">{value}</code>
      </div>
    </div>
  );
}

const meta = {
  title: "design/Shadow",
  parameters: {
    docs: {
      description: {
        component:
          "Box-shadow scale (Tailwind v4 defaults — styles.css doesn't override --shadow-*). Rendered on bg-background so the shadow itself is visible.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      {SHADOWS.map((s) => (
        <ShadowSample key={s.className} {...s} />
      ))}
    </div>
  ),
};
