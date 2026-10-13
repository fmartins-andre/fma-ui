import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkIcon, LockIcon } from "lucide-react";
import { expect } from "storybook/test";
import {
  FILE_TYPE_CATEGORIES,
  FILE_TYPE_EXTENSION_NAMES,
  FileType,
  getFileType,
  getFileTypeCategory,
} from "./file-type";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/FileType",
  component: FileType,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    variant: { control: "radio", options: ["outline", "solid", "light", "mono"] },
    size: { control: "radio", options: ["mini", "xs", "sm", "default", "lg", "xl"] },
  },
  args: { type: "pdf" },
} satisfies Meta<typeof FileType>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const icon = canvas.getByRole("img", { name: "PDF file" });
    await expect(icon).toHaveAttribute("data-category", "document");
    await expect(icon).toHaveTextContent("PDF");
  },
};

const SAMPLE = ["pdf", "docx", "xlsx", "pptx", "png", "mp4", "mp3", "ts", "zip", "fig"];

/** `outline` (default), `solid`, `light` and `mono` (the theme gray for every type). */
export const Variants: Story = {
  render: (args) => (
    <div className="grid gap-4">
      {(["outline", "solid", "light", "mono"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-sm text-muted-foreground">{variant}</span>
          {SAMPLE.map((type) => (
            <FileType key={type} {...args} type={type} variant={variant} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Six presets from 18px (`mini`, for table rows) to 56px; a `size-*` class scales everything with the box. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-4">
      {(["mini", "xs", "sm", "default", "lg", "xl"] as const).map((size) => (
        <FileType key={size} {...args} size={size} />
      ))}
      <FileType {...args} className="size-20" />
    </div>
  ),
};

/** A family name, or `glyph`, draws the family glyph instead of the label. */
export const Glyphs: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {FILE_TYPE_CATEGORIES.map((type) => (
        <FileType key={type} {...args} type={type} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Folder" })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "Image" })).not.toHaveTextContent(/./);
  },
};

/** Every built-in extension, in its brand or family color. */
export const AllExtensions: Story = {
  render: (args) => (
    <div className="grid max-w-2xl grid-cols-8 gap-3 sm:grid-cols-11">
      {FILE_TYPE_EXTENSION_NAMES.map((type) => (
        <FileType key={type} {...args} type={type} title={type} />
      ))}
    </div>
  ),
};

/** `label` replaces the text and joins the accessible name; `icon` draws on the page; a `text-*` class recolors. */
export const CustomLabelAndIcon: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <FileType {...args} type="docx" label="V3" />
      <FileType {...args} type="empty" variant="light" label="CA-1042" />
      <FileType {...args} type="pdf" icon={<LockIcon />} aria-label="Locked PDF file" />
      <FileType {...args} type="url" icon={<LinkIcon />} aria-label="Shortcut" />
      <FileType {...args} type="dwg" />
      <FileType {...args} type="dwg" className="text-teal-700" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "V3, DOCX file" })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "CA-1042, File" })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: "Locked PDF file" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("img", { name: "DWG file" })).toHaveLength(2);
  },
};

const FILES = [
  "Q3 report.pdf",
  "photos/IMG_2041.HEIC",
  "archive.tar.gz",
  "https://example.com/data.csv?v=2",
  "assets/",
  "README",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/webm",
];

/** `getFileType` resolves a name, path, URL or MIME type; `getFileTypeCategory` gives the family. */
export const FromFileName: Story = {
  render: () => (
    <ul className="grid gap-2 text-sm">
      {FILES.map((name) => {
        const type = getFileType(name);
        return (
          <li key={name} className="flex items-center gap-2">
            <FileType type={type} size="mini" aria-hidden="true" />
            <span className="truncate">{name}</span>
            <span className="ml-auto pl-4 text-muted-foreground">
              {type} · {getFileTypeCategory(type)}
            </span>
          </li>
        );
      })}
    </ul>
  ),
  play: async () => {
    await expect(FILES.map(getFileType)).toEqual([
      "pdf",
      "heic",
      "gz",
      "csv",
      "folder",
      "empty",
      "xlsx",
      "audio",
    ]);
  },
};
