import type { Meta, StoryObj } from "@storybook/react-vite";
import { Building2Icon, UserIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IconTile } from "../icon-tile/icon-tile";
import { Input } from "../input/input";
import { Label } from "../label/label";
import { RadioCard, RadioGroup } from "../radio-group/radio-group";
import { Switch } from "../switch/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHelp,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
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
      description: {
        story: "The label and description sit beside the control instead of above it.",
      },
    },
  },
  render: (args) => (
    <Field {...args} className="w-96">
      <FieldContent>
        <FieldLabel htmlFor="notifications">Notifications</FieldLabel>
        <FieldDescription>Receive email updates about your account.</FieldDescription>
      </FieldContent>
      <Switch id="notifications" />
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

/**
 * `FieldHelp` sits beside the label, never inside it, and opens a popover:
 * it works with touch and keyboard, unlike a tooltip. Its label names the subject.
 */
export const WithHelp: Story = {
  render: () => (
    <Field className="w-80">
      <div className="flex items-center gap-1">
        <FieldLabel htmlFor="cib">CIB</FieldLabel>
        <FieldHelp label="More information: CIB">
          The property's code in the Brazilian Real Estate Registry, printed on the property tax
          bill.
        </FieldHelp>
      </div>
      <Input id="cib" placeholder="0000000-0" />
    </Field>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const help = canvas.getByRole("button", { name: "More information: CIB" });
    await userEvent.click(help);
    const dialog = await body.findByRole("dialog", { name: "More information: CIB" });
    await expect(dialog).toHaveTextContent(/Real Estate Registry/);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(help).toHaveFocus());
    // The label still focuses the input: the button isn't inside it.
    await userEvent.click(canvas.getByText("CIB"));
    await expect(canvas.getByRole("textbox", { name: "CIB" })).toHaveFocus();
  },
};

/** Beside a switch's label, in a horizontal field. */
export const WithHelpAndSwitch: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <Field {...args} className="w-96">
      <FieldContent>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor="personal-operation">Personal operation</FieldLabel>
          <FieldHelp label="More information: Personal operation">
            Marks sales to individuals, which change how the tax is calculated.
          </FieldHelp>
        </div>
        <FieldDescription>The buyer is an individual, not a company.</FieldDescription>
      </FieldContent>
      <Switch id="personal-operation" />
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

/**
 * Choice cards: few options with an icon and a description. The card is the
 * control itself (`RadioCard`, or `CheckboxCard` for several), filled with
 * `FieldContent`, `FieldTitle` and `FieldDescription`; wrapping a react-aria
 * control in a `FieldLabel` would nest one label in another.
 */
export const ChoiceCard: Story = {
  render: () => (
    <RadioGroup defaultValue="pj" className="w-[30rem] grid-cols-2">
      <Label className="col-span-2">Tipo de pessoa</Label>
      <RadioCard value="pf">
        <IconTile variant="soft" size="sm">
          <UserIcon />
        </IconTile>
        <FieldContent>
          <FieldTitle>Pessoa física</FieldTitle>
          <FieldDescription>Cadastro pelo CPF.</FieldDescription>
        </FieldContent>
      </RadioCard>
      <RadioCard value="pj">
        <IconTile variant="soft" size="sm">
          <Building2Icon />
        </IconTile>
        <FieldContent>
          <FieldTitle>Pessoa jurídica</FieldTitle>
          <FieldDescription>Cadastro pelo CNPJ.</FieldDescription>
        </FieldContent>
      </RadioCard>
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Pessoa física"));
    await expect(canvas.getByRole("radio", { name: /Pessoa física/ })).toBeChecked();
  },
};
