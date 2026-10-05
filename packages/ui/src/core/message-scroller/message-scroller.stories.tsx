import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Message, MessageContent } from "../message/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";
import meta from "./meta.json";

// @shadcn/react, not react-aria-components — upstream hasn't ported this
// component to the aria base yet either (see meta.json "source").
const componentMeta = {
  title: "ui/MessageScroller",
  component: MessageScroller,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof MessageScroller>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: () => (
    <MessageScrollerProvider>
      <MessageScroller className="h-72 w-96 rounded-lg border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {Array.from({ length: 8 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length demo messages, i IS the identity
              <MessageScrollerItem key={`message-${i}`}>
                <Message>
                  <MessageContent>Message {i + 1}</MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
  // Starts at the latest message; scrolling away shows the jump-to-end button.
  play: async ({ canvasElement, canvas }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      "[data-slot=message-scroller-viewport]",
    );
    if (!viewport) throw new Error("viewport not rendered");
    const atEnd = () => viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 2;
    const button = canvas.getByRole("button", { name: "Scroll to end", hidden: true });
    await waitFor(() => expect(atEnd()).toBe(true));
    await expect(button).toHaveAttribute("data-active", "false");

    viewport.scrollTo({ top: 0 });
    await waitFor(() => expect(button).toHaveAttribute("data-active", "true"));
    await userEvent.click(button);
    await waitFor(() => expect(atEnd()).toBe(true));
    await waitFor(() => expect(button).toHaveAttribute("data-active", "false"));
  },
};
