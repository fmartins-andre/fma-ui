import type { Meta, StoryObj } from "@storybook/react-vite";

// Doc-only: type scale + font tokens. src/styles.css only overrides the font
// family (--font-sans / --font-heading → Geist Variable) — sizes are
// Tailwind's untouched default scale. Not part of the component registry.

const SIZES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
] as const;

const meta = {
  title: "design/Typography",
  parameters: {
    docs: {
      description: {
        component:
          "Font tokens from src/styles.css: --font-sans and --font-heading both resolve to Geist Variable. The size scale below is Tailwind's default (no custom --text-* overrides exist yet) — if that changes, update this story alongside styles.css.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {SIZES.map((size) => (
        <div key={size} className="flex items-baseline gap-4">
          <code className="w-20 shrink-0 text-xs text-muted-foreground">{size}</code>
          <span className={`${size} font-sans`}>The quick brown fox jumps</span>
        </div>
      ))}
    </div>
  ),
};

export const Heading: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-semibold">font-heading (Geist Variable)</h1>
      <p className="font-sans text-base text-muted-foreground">
        font-sans (Geist Variable) — same family for now; kept as separate tokens so a future theme
        can diverge them without touching component code.
      </p>
    </div>
  ),
};
