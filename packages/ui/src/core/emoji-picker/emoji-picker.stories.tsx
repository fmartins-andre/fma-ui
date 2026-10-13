import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Card } from "@/core/card/card";
import {
  EmojiPicker,
  EmojiPickerCategories,
  EmojiPickerContent,
  type EmojiPickerCustomEmoji,
  type EmojiPickerData,
  type EmojiPickerEmoji,
  EmojiPickerFooter,
  EmojiPickerHeader,
  EmojiPickerList,
  EmojiPickerPanel,
  EmojiPickerPreview,
  EmojiPickerSearch,
  EmojiPickerSkinTone,
  EmojiPickerTrigger,
} from "./emoji-picker";
import meta from "./meta.json";

const tones = (base: string) =>
  ["\u{1F3FB}", "\u{1F3FC}", "\u{1F3FD}", "\u{1F3FE}", "\u{1F3FF}"].map((tone) => base + tone);

const emoji = (
  id: string,
  value: string,
  label: string,
  category: string,
  shortcodes: string[],
  tags: string[] = [],
  skins?: string[],
): EmojiPickerEmoji => ({
  id,
  emoji: value,
  label,
  category,
  shortcodes,
  tags,
  version: 1,
  ...(skins && { skins }),
});

/* A slice of emojibase, so the stories render without the network. */
const DATA: EmojiPickerData = {
  locale: "en",
  categories: {},
  emojis: [
    emoji("1F600", "😀", "grinning face", "smileys", ["grinning"], ["face", "grin", "happy"]),
    emoji("1F602", "😂", "face with tears of joy", "smileys", ["joy"], ["laugh", "tears"]),
    emoji("1F60D", "😍", "smiling face with heart-eyes", "smileys", ["heart_eyes"], ["love"]),
    emoji("1F914", "🤔", "thinking face", "smileys", ["thinking"], ["hmm"]),
    emoji("1F622", "😢", "crying face", "smileys", ["cry"], ["sad", "tear"]),
    emoji("1F389", "🎉", "party popper", "activities", ["tada"], ["celebrate", "party"]),
    emoji(
      "1F44D",
      "👍",
      "thumbs up",
      "people",
      ["+1", "thumbsup"],
      ["approve", "yes"],
      tones("👍"),
    ),
    emoji("1F44B", "👋", "waving hand", "people", ["wave"], ["hello", "bye"], tones("👋")),
    emoji("1F64F", "🙏", "folded hands", "people", ["pray"], ["please", "thanks"], tones("🙏")),
    emoji("1F440", "👀", "eyes", "people", ["eyes"], ["look"]),
    emoji("1F436", "🐶", "dog face", "nature", ["dog"], ["pet", "puppy"]),
    emoji("1F431", "🐱", "cat face", "nature", ["cat"], ["pet", "kitten"]),
    emoji("1F333", "🌳", "deciduous tree", "nature", ["deciduous_tree"], ["tree"]),
    emoji("1F355", "🍕", "pizza", "food", ["pizza"], ["cheese", "slice"]),
    emoji("2615", "☕", "hot beverage", "food", ["coffee"], ["drink", "tea"]),
    emoji("1F680", "🚀", "rocket", "travel", ["rocket"], ["launch", "space"]),
    emoji("1F3E0", "🏠", "house", "travel", ["house"], ["home"]),
    emoji("26BD", "⚽", "soccer ball", "activities", ["soccer"], ["football"]),
    emoji("1F4A1", "💡", "light bulb", "objects", ["bulb"], ["idea"]),
    emoji("1F4BB", "💻", "laptop", "objects", ["computer"], ["pc"]),
    emoji("2764", "❤️", "red heart", "symbols", ["heart"], ["love"]),
    emoji("2705", "✅", "check mark button", "symbols", ["white_check_mark"], ["done", "ok"]),
    emoji("1F1E7-1F1F7", "🇧🇷", "flag: Brazil", "flags", ["brazil"], ["BR"]),
    emoji("1F1EF-1F1F5", "🇯🇵", "flag: Japan", "flags", ["jp"], ["JP"]),
  ],
};

const componentMeta = {
  title: "ui/EmojiPicker",
  component: EmojiPicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: {
    data: DATA,
    emojiVersion: 15,
    recentStorageKey: null,
    skinToneStorageKey: null,
    onChange: fn(),
    onEmojiSelect: fn(),
  },
} satisfies Meta<typeof EmojiPicker>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = () => within(document.body);

/* Stories open from the trigger, never with `defaultOpen`: the docs page
   renders every story at once, and each open modal popover makes the rest of
   the page inert. */
const open = async (canvas: ReturnType<typeof within>) => {
  await userEvent.click(canvas.getByRole("button", { name: /^Add emoji/ }));
  return body().findByRole("dialog");
};

/** Focus starts in the search; the arrows highlight in the grid while typing goes on, and Enter picks. */
export const Default: Story = {
  args: { defaultValue: null },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add emoji" }));
    const search = await body().findByRole("combobox", { name: "Search emoji" });
    await waitFor(() => expect(search).toHaveFocus());

    await userEvent.type(search, "thumbs");
    await expect(body().getByRole("option", { name: "Thumbs up" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await expect(args.onChange).toHaveBeenLastCalledWith("👍");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Add emoji: Thumbs up" })).toBeInTheDocument();
  },
};

/** Shortcodes match with or without colons, and keywords match too. */
export const Search: Story = {
  play: async ({ canvas, args }) => {
    await open(canvas);
    const search = await body().findByRole("combobox", { name: "Search emoji" });
    await userEvent.type(search, ":tada:");
    await expect(body().getByRole("option", { name: "Party popper" })).toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    await expect(await body().findByText("No emoji found")).toBeInTheDocument();
    await userEvent.click(body().getByRole("button", { name: "Clear search" }));
    await expect(search).toHaveValue("");

    // From the search, Down enters the grid at the first emoji in view.
    await userEvent.keyboard("{ArrowDown}{ArrowRight}{Enter}");
    await expect(args.onEmojiSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "😂" }),
    );
  },
};

/** The tone menu applies to every emoji that takes one. */
export const SkinTone: Story = {
  args: { defaultValue: null },
  play: async ({ canvas, args }) => {
    await open(canvas);
    await userEvent.click(body().getByRole("button", { name: "Skin tone: Default" }));
    await userEvent.click(await body().findByRole("menuitemradio", { name: "Dark" }));
    await expect(body().getByRole("button", { name: "Skin tone: Dark" })).toBeInTheDocument();
    await userEvent.click(body().getByRole("option", { name: "Waving hand" }));
    await expect(args.onChange).toHaveBeenLastCalledWith("👋\u{1F3FF}");
  },
};

/** The category bar jumps the grid and follows its scroll. */
export const Categories: Story = {
  play: async ({ canvas }) => {
    await open(canvas);
    const tabs = await body().findByRole("tablist", { name: "Emoji categories" });
    await userEvent.click(within(tabs).getByRole("tab", { name: "Travel & places" }));
    await waitFor(() =>
      expect(within(tabs).getByRole("tab", { name: "Travel & places" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
  },
};

/** `selectionMode="multiple"` toggles emoji in and out and keeps the picker open; `max` caps the list. */
export const Multiple: Story = {
  render: function Render() {
    const [values, setValues] = React.useState<string[]>(["🎉"]);
    return (
      <div className="flex flex-col items-center gap-2">
        <EmojiPicker
          data={DATA}
          emojiVersion={15}
          recentStorageKey={null}
          skinToneStorageKey={null}
          selectionMode="multiple"
          max={2}
          value={values}
          onChange={setValues}
        />
        <output className="text-sm text-muted-foreground">{values.join(" ") || "None"}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add emoji" }));
    await body().findByRole("dialog");
    await expect(body().getByRole("option", { name: "Party popper" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(body().getByRole("option", { name: "Rocket" }));
    await expect(canvas.getByText("🎉 🚀")).toBeInTheDocument();
    await expect(body().getByRole("option", { name: "Pizza" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(body().getByRole("option", { name: "Party popper" }));
    await expect(canvas.getByText("🚀")).toBeInTheDocument();
  },
};

const CUSTOM: EmojiPickerCustomEmoji[] = [
  {
    id: "shipit",
    label: "ship it",
    tags: ["deploy"],
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#16a34a"/><path d="M18 34l10 10 18-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    )}`,
  },
];

/** Custom emoji get their own section and pick as `:shortcode:`. */
export const CustomEmoji: Story = {
  args: { customEmojis: CUSTOM, defaultValue: null },
  play: async ({ canvas, args }) => {
    await open(canvas);
    const search = await body().findByRole("combobox", { name: "Search emoji" });
    await userEvent.type(search, "deploy{Enter}");
    await expect(args.onChange).toHaveBeenLastCalledWith(":shipit:");
  },
};

/** `EmojiPickerPanel` renders in place; compose the parts in any order. */
export const Inline: Story = {
  args: { columns: 9, onEmojiSelect: fn() },
  render: (args) => (
    <Card className="gap-0 overflow-hidden py-0">
      <EmojiPicker {...args}>
        <EmojiPickerPanel>
          <EmojiPickerHeader>
            <EmojiPickerSearch />
            <EmojiPickerSkinTone variant="outline" size="icon" />
          </EmojiPickerHeader>
          <EmojiPickerList />
          <EmojiPickerCategories />
          <EmojiPickerFooter>
            <EmojiPickerPreview />
          </EmojiPickerFooter>
        </EmojiPickerPanel>
      </EmojiPicker>
    </Card>
  ),
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("group", { name: "Emoji picker" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("option", { name: "Rocket" }));
    await expect(args.onEmojiSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "🚀" }),
    );
  },
};

/** A custom trigger and a popover that returns focus to a composer after a pick. */
export const Composer: Story = {
  render: function Render(args) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [text, setText] = React.useState("Ship it ");
    return (
      <div className="flex w-80 items-end gap-2">
        <textarea
          ref={textareaRef}
          aria-label="Message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-16 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <EmojiPicker
          {...args}
          onEmojiSelect={(selection) => setText((current) => current + selection.value)}
        >
          <EmojiPickerTrigger variant="ghost" />
          <EmojiPickerContent placement="top end" returnFocus={textareaRef} />
        </EmojiPicker>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add emoji" }));
    await userEvent.click(await body().findByRole("option", { name: "Rocket" }));
    await expect(canvas.getByRole("textbox", { name: "Message" })).toHaveValue("Ship it 🚀");
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Message" })).toHaveFocus());
  },
};

/** Without `data`, the picker fetches emojibase from jsDelivr on first hover, focus or open. */
export const RemoteData: Story = {
  args: { data: undefined, emojiVersion: "auto" },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeDisabled();
  },
};
