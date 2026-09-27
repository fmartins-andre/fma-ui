import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bubble, BubbleContent } from "../bubble/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "./message";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Message",
  component: Message,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    align: { control: "select", options: ["start", "end"] },
  },
  args: {
    align: "start",
  },
} satisfies Meta<typeof Message>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: "An incoming message with avatar, header, bubble, and timestamp." },
    },
  },
  render: (args) => (
    <Message {...args} className="w-96">
      <MessageAvatar className="size-8 bg-primary text-primary-foreground">AI</MessageAvatar>
      <MessageContent>
        <MessageHeader>Assistant</MessageHeader>
        <Bubble>
          <BubbleContent>Every registry item now has its dependencies verified.</BubbleContent>
        </Bubble>
        <MessageFooter>2:14 PM</MessageFooter>
      </MessageContent>
    </Message>
  ),
};

export const Sent: Story = {
  args: { align: "end" },
  parameters: {
    docs: {
      description: { story: 'align="end" flips the row for the current user\'s own messages.' },
    },
  },
  render: (args) => (
    <Message {...args} className="w-96">
      <MessageContent>
        <Bubble align="end" variant="tinted">
          <BubbleContent>Nice, thanks!</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
};

export const Conversation: Story = {
  parameters: {
    docs: { description: { story: "MessageGroup stacking an incoming and a sent message." } },
  },
  render: () => (
    <MessageGroup className="w-96">
      <Message>
        <MessageAvatar className="size-8 bg-primary text-primary-foreground">AI</MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>How's it going?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble align="end" variant="tinted">
            <BubbleContent>All 59 components vendored!</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
};
