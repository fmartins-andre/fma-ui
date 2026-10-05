import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneIcon } from "lucide-react";
import * as React from "react";
import { FieldError, Text, TextField } from "react-aria-components";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/core/input-group/input-group";
import { Label } from "@/core/label/label";
import { useMask } from "@/hooks/use-mask";
import { cpfMaskRemover, makeStableMaskitoOptions } from "@/lib/input-masks";
import { MaskedInput } from "./masked-input";
import meta from "./meta.json";

const PRESETS = [
  "cpf",
  "cnpj",
  "cpf-cnpj",
  "cep",
  "phone",
  "credit-card",
  "date",
  "time",
  "date-time",
  "date-range",
  "decimal",
] as const;

const componentMeta = {
  title: "ui/MaskedInput",
  component: MaskedInput,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    mask: { control: "select", options: PRESETS },
  },
  args: {
    mask: "cpf",
    "aria-label": "CPF",
    className: "w-64",
  },
} satisfies Meta<typeof MaskedInput>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const source = (code: string) => ({ docs: { source: { code, language: "tsx" } } });

// A preset story: Storybook's generated source is the copyable
// `<MaskedInput mask=… />`; the play function types `typed` and expects `expected`.
function presetStory(args: Story["args"], typed: string, expected: string): Story {
  return {
    args,
    play: async ({ canvas, args }) => {
      const input = canvas.getByRole("textbox", { name: args["aria-label"] });
      await userEvent.type(input, typed);
      await expect(input).toHaveValue(expected);
    },
  };
}

export const Default = presetStory({}, "12345678901", "123.456.789-01");

export const Cnpj = presetStory(
  { mask: "cnpj", "aria-label": "CNPJ" },
  "12345678000199",
  "12.345.678/0001-99",
);

/** Switches from CPF to CNPJ formatting as soon as digits go past the CPF length. */
export const CpfOrCnpj = presetStory(
  { mask: "cpf-cnpj", "aria-label": "CPF or CNPJ", placeholder: "CPF ou CNPJ" },
  "12345678000199",
  "12.345.678/0001-99",
);

/** Mobile and landline numbers share one preset. Opens the phone keypad on mobile. */
export const Phone = presetStory(
  { mask: "phone", "aria-label": "Phone" },
  "1133224455",
  "(11) 3322-4455",
);

export const Cep = presetStory({ mask: "cep", "aria-label": "CEP" }, "01001000", "01001-000");

export const CreditCard = presetStory(
  { mask: "credit-card", "aria-label": "Card number" },
  "1234567890123456",
  "1234 5678 9012 3456",
);

export const Decimal = presetStory(
  { mask: "decimal", "aria-label": "Amount" },
  "123456",
  "123.456,00",
);

/**
 * Parameterized presets are objects. They're compared by value, so writing
 * the object inline is fine.
 */
export const Currency = presetStory(
  { mask: { type: "decimal", prefix: "R$ " }, "aria-label": "Price" },
  "123456",
  "R$ 123.456,00",
);

export const DateMask = presetStory(
  { mask: "date", "aria-label": "Date" },
  "31122024",
  "31/12/2024",
);

export const MonthYear = presetStory(
  { mask: { type: "date", mode: "mm/yyyy" }, "aria-label": "Expiry" },
  "122024",
  "12/2024",
);

export const Time = presetStory({ mask: "time", "aria-label": "Time" }, "0930", "09:30");

export const DateTime = presetStory(
  { mask: "date-time", "aria-label": "Date and time" },
  "311220240930",
  "31/12/2024, 09:30",
);

/** The separator is a non-breaking space, an en dash and another non-breaking space. */
export const DateRange = presetStory(
  { mask: "date-range", "aria-label": "Period", className: "w-80" },
  "0101202431122024",
  "01/01/2024 – 31/12/2024",
);

// Mercosul license plate: three letters, a digit, a letter or digit, two digits.
const plateMask = makeStableMaskitoOptions({
  mask: [/[A-Za-z]/, /[A-Za-z]/, /[A-Za-z]/, "-", /\d/, /[A-Za-z0-9]/, /\d/, /\d/],
  postprocessors: [({ value, selection }) => ({ value: value.toUpperCase(), selection })],
});

/**
 * Any Maskito options work too. Declare them at module scope (or memoize them):
 * new options on every render reset the mask. Their raw value is the masked text.
 */
export const CustomMask: Story = {
  args: { mask: plateMask, "aria-label": "License plate", placeholder: "AAA-0A00" },
  parameters: source(`import { MaskedInput } from "@/components/ui/masked-input";
import { makeStableMaskitoOptions } from "@/lib/input-masks";

// Module scope: new options on every render would reset the mask.
const plateMask = makeStableMaskitoOptions({
  mask: [/[A-Za-z]/, /[A-Za-z]/, /[A-Za-z]/, "-", /\\d/, /[A-Za-z0-9]/, /\\d/, /\\d/],
  postprocessors: [({ value, selection }) => ({ value: value.toUpperCase(), selection })],
});

export function PlateInput() {
  return <MaskedInput mask={plateMask} aria-label="License plate" placeholder="AAA-0A00" />;
}`),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "License plate" });
    await userEvent.type(input, "abc1d23");
    await expect(input).toHaveValue("ABC-1D23");
  },
};

/** `onValueChange` reports the raw value (digits for documents), with the masked text alongside. */
export const RawValue: Story = {
  args: { onValueChange: fn() },
  parameters: source(`import * as React from "react";
import { MaskedInput } from "@/components/ui/masked-input";

export function CpfInput() {
  const [cpf, setCpf] = React.useState("");
  return (
    <div className="flex flex-col gap-2">
      <MaskedInput mask="cpf" aria-label="CPF" className="w-64" onValueChange={setCpf} />
      <output className="text-sm text-muted-foreground">Raw: {cpf || "—"}</output>
    </div>
  );
}`),
  render: function Render({ onValueChange, ...args }) {
    const [raw, setRaw] = React.useState("");
    return (
      <div className="flex flex-col gap-2">
        <MaskedInput
          {...args}
          onValueChange={(value, masked) => {
            setRaw(value);
            onValueChange?.(value, masked);
          }}
        />
        <output className="text-sm text-muted-foreground">Raw: {raw || "—"}</output>
      </div>
    );
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox", { name: "CPF" });
    await userEvent.type(input, "12345678901");
    await expect(input).toHaveValue("123.456.789-01");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("12345678901", "123.456.789-01");
    await expect(canvas.getByText("Raw: 12345678901")).toBeInTheDocument();
  },
};

/**
 * The parent can store just the raw value and pass it back as `value`. Values set from
 * outside (raw or masked) are formatted; the input's own edits are left to Maskito.
 */
export const Controlled: Story = {
  parameters: source(`import * as React from "react";
import { MaskedInput } from "@/components/ui/masked-input";

export function CpfInput() {
  const [cpf, setCpf] = React.useState("");
  return (
    <div className="flex flex-col items-start gap-2">
      <MaskedInput mask="cpf" aria-label="CPF" className="w-64" value={cpf} onValueChange={setCpf} />
      <button type="button" className="text-sm underline" onClick={() => setCpf("98765432100")}>
        Fill
      </button>
    </div>
  );
}`),
  render: function Render(args) {
    const [cpf, setCpf] = React.useState("");
    return (
      <div className="flex flex-col items-start gap-2">
        <MaskedInput {...args} value={cpf} onValueChange={setCpf} />
        <button type="button" className="text-sm underline" onClick={() => setCpf("98765432100")}>
          Fill
        </button>
        <output data-testid="raw">{cpf}</output>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "CPF" });
    // Typing with a raw-controlled value keeps Maskito's placeholder and caret.
    await userEvent.type(input, "123");
    await expect(input).toHaveValue("123.___.___-__");
    await expect(canvas.getByTestId("raw")).toHaveTextContent("123");

    await userEvent.click(canvas.getByRole("button", { name: "Fill" }));
    await waitFor(() => expect(input).toHaveValue("987.654.321-00"));
  },
};

/**
 * Inside a react-aria `TextField` the label, description, error message and validation
 * are wired as usual. The field's value is the masked text, so validate its raw form.
 */
export const InTextField: Story = {
  parameters: source(`import { FieldError, Text, TextField } from "react-aria-components";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { cpfMaskRemover } from "@/lib/input-masks";

export function CpfField() {
  return (
    <TextField
      isRequired
      validate={(value) => (cpfMaskRemover(value).length === 11 ? null : "Enter all 11 digits.")}
      className="flex w-64 flex-col gap-1.5"
    >
      <Label>CPF</Label>
      <MaskedInput mask="cpf" />
      <Text slot="description" className="text-sm text-muted-foreground">
        Only digits are stored.
      </Text>
      <FieldError className="text-sm text-destructive" />
    </TextField>
  );
}`),
  render: () => (
    <TextField
      isRequired
      validate={(value) => (cpfMaskRemover(value).length === 11 ? null : "Enter all 11 digits.")}
      className="flex w-64 flex-col gap-1.5"
    >
      <Label>CPF</Label>
      <MaskedInput mask="cpf" />
      <Text slot="description" className="text-sm text-muted-foreground">
        Only digits are stored.
      </Text>
      <FieldError className="text-sm text-destructive" />
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/CPF/);
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription("Only digits are stored.");

    await userEvent.type(input, "123456");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    await expect(canvas.getByText("Enter all 11 digits.")).toBeInTheDocument();

    await userEvent.click(input);
    await userEvent.type(input, "78901");
    await userEvent.tab();
    await expect(input).toHaveValue("123.456.789-01");
    await waitFor(() => expect(input).not.toHaveAttribute("aria-invalid"));
  },
};

function PhoneGroup() {
  const phone = useMask({ mask: "phone" });
  return (
    <InputGroup>
      <InputGroupAddon>
        <PhoneIcon />
      </InputGroupAddon>
      <InputGroupInput {...phone.inputProps} aria-label="Phone" />
    </InputGroup>
  );
}

function PriceGroup() {
  const price = useMask({ mask: "decimal" });
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>R$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput {...price.inputProps} aria-label="Amount" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>BRL</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * For other inputs, `useMask` returns the props to spread: here onto `InputGroupInput`,
 * which keeps the group's borderless control styling and focus ring.
 */
export const WithInputGroup: Story = {
  parameters: source(`import { PhoneIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useMask } from "@/hooks/use-mask";

export function PhoneGroup() {
  const phone = useMask({ mask: "phone" });
  return (
    <InputGroup>
      <InputGroupAddon>
        <PhoneIcon />
      </InputGroupAddon>
      <InputGroupInput {...phone.inputProps} aria-label="Phone" />
    </InputGroup>
  );
}

export function PriceGroup() {
  const price = useMask({ mask: "decimal" });
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>R$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput {...price.inputProps} aria-label="Amount" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>BRL</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}`),
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <PhoneGroup />
      <PriceGroup />
    </div>
  ),
  play: async ({ canvas }) => {
    const phone = canvas.getByRole("textbox", { name: "Phone" });
    await expect(phone).toHaveAttribute("inputmode", "tel");
    await userEvent.type(phone, "11987654321");
    await expect(phone).toHaveValue("(11) 98765-4321");

    // Clicking an addon focuses the masked input.
    const amount = canvas.getByRole("textbox", { name: "Amount" });
    await userEvent.click(canvas.getByText("BRL"));
    await expect(amount).toHaveFocus();
    await userEvent.keyboard("123456");
    await expect(amount).toHaveValue("123.456,00");
  },
};
