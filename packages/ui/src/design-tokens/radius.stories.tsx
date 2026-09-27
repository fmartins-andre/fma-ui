import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

// Doc-only: the radius scale from ../styles.css, all derived from the single
// --radius base token (@theme inline block). Not part of the component registry.

function useTokenValue(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  });
  return value;
}

const SCALE = [
  { token: "--radius-sm", className: "rounded-sm", factor: "0.6×" },
  { token: "--radius-md", className: "rounded-md", factor: "0.8×" },
  { token: "--radius-lg", className: "rounded-lg", factor: "1×  (base --radius)" },
  { token: "--radius-xl", className: "rounded-xl", factor: "1.4×" },
  { token: "--radius-2xl", className: "rounded-2xl", factor: "1.8×" },
  { token: "--radius-3xl", className: "rounded-3xl", factor: "2.2×" },
  { token: "--radius-4xl", className: "rounded-4xl", factor: "2.6×" },
];

function RadiusSample({
  token,
  className,
  factor,
}: {
  token: string;
  className: string;
  factor: string;
}) {
  const value = useTokenValue(token);
  return (
    <div className="flex items-center gap-4">
      <div className={`size-16 shrink-0 border-2 border-primary bg-muted ${className}`} />
      <div className="flex flex-col">
        <code className="text-sm">{token}</code>
        <span className="text-xs text-muted-foreground">
          {factor} · {value}
        </span>
      </div>
    </div>
  );
}

const meta = {
  title: "design/Radius",
  parameters: {
    docs: {
      description: {
        component:
          "Radius scale from src/styles.css — every step is calc(var(--radius) * factor), so changing --radius (currently 0.625rem) rescales all of them together.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SCALE.map((s) => (
        <RadiusSample key={s.token} {...s} />
      ))}
    </div>
  ),
};
