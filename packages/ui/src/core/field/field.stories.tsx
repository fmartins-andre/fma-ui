import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input/input";
import { Label } from "../label/label";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./field";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Field",
  component: Field,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    orientation: { control: "select", options: ["vertical", "horizontal", "responsive"] },
  },
} satisfies Meta<typeof Field>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A single field with a label, input, and helper description." } },
  },
  render: (args) => (
    <Field {...args} className="w-80">
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
      <FieldDescription>We'll never share your email.</FieldDescription>
    </Field>
  ),
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  parameters: {
    docs: {
      description: { story: "Label and description sit beside each other instead of stacked." },
    },
  },
  render: (args) => (
    <Field {...args} className="w-96">
      <FieldContent>
        <FieldLabel htmlFor="notifications">Notifications</FieldLabel>
        <FieldDescription>Receive email updates about your account.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const WithError: Story = {
  parameters: {
    docs: {
      description: { story: "FieldError renders validation messages under an invalid field." },
    },
  },
  render: () => (
    <Field className="w-80" data-invalid="true">
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" defaultValue="a" />
      <FieldError errors={[{ message: "Username must be at least 3 characters." }]} />
    </Field>
  ),
};

export const FieldSetExample: Story = {
  parameters: {
    docs: {
      description: {
        story: "FieldSet/FieldLegend/FieldGroup group several fields under one heading.",
      },
    },
  },
  render: () => (
    <FieldSet className="w-96">
      <FieldLegend>Address</FieldLegend>
      <FieldGroup>
        <Field>
          <Label htmlFor="street">Street</Label>
          <Input id="street" />
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <Label htmlFor="zip">ZIP code</Label>
          <Input id="zip" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
