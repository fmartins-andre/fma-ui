import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "../button/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    // meta.json (packages/ui/src/core/card/meta.json) is the single source of
    // truth for this description — it also feeds registry.json.
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm"] },
  },
  args: {
    size: "default",
  },
} satisfies Meta<typeof Card>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Project alpha</CardTitle>
        <CardDescription>Last updated 2 hours ago</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Open</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("Project alpha")).toBeVisible();
    expect(canvas.getByRole("button", { name: "Open" })).toBeVisible();
  },
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss">
            ×
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Uses the CardAction slot.</p>
      </CardContent>
    </Card>
  ),
};

export const Compact: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Card {...args} className="w-72">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">size=&quot;sm&quot; tightens the spacing scale.</p>
      </CardContent>
    </Card>
  ),
};
