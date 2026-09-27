import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

// Doc-only stories: catalog the CSS custom properties from ../styles.css
// (the "aria-nova" theme) so changing a token is visible without hunting
// through the stylesheet. Not part of the component registry.

function useTokenValue(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  });
  return value;
}

function Swatch({ name }: { name: string }) {
  const value = useTokenValue(name);
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-12 shrink-0 rounded-md ring-1 ring-foreground/10"
        style={{ background: `var(${name})` }}
      />
      <div className="flex flex-col">
        <code className="text-sm">{name}</code>
        <code className="text-xs text-muted-foreground">{value}</code>
      </div>
    </div>
  );
}

function Group({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-heading text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tokens.map((name) => (
          <Swatch key={name} name={name} />
        ))}
      </div>
    </div>
  );
}

const BASE = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
];

const CHARTS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

const SIDEBAR = [
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
];

const meta = {
  title: "design/Color",
  parameters: {
    docs: {
      description: {
        component:
          "Color tokens from src/styles.css (aria-nova theme). Use the light/dark toolbar toggle to compare both modes — values are read live via getComputedStyle, so they always reflect the current stylesheet.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {
  render: () => <Group title="Base" tokens={BASE} />,
};

export const Charts: Story = {
  render: () => <Group title="Charts" tokens={CHARTS} />,
};

export const Sidebar: Story = {
  render: () => <Group title="Sidebar" tokens={SIDEBAR} />,
};
