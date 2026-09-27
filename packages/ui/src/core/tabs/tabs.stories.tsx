import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import meta from "./meta.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const componentMeta = {
  title: "ui/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    defaultSelectedKey: "account",
    className: "w-96",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Settings">
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent id="account">Make changes to your account here.</TabsContent>
      <TabsContent id="password">Change your password here.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const LineVariant: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Settings" variant="line">
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent id="account">Make changes to your account here.</TabsContent>
      <TabsContent id="password">Change your password here.</TabsContent>
    </Tabs>
  ),
};

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const password = canvas.getByRole("tab", { name: "Password" });
    await userEvent.click(password);
    expect(password).toHaveAttribute("aria-selected", "true");
    expect(canvas.getByRole("tabpanel")).toHaveTextContent("Change your password here.");
  },
};
