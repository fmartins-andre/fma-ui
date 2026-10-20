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

// A preset story's play function: types `typed` and expects `expected`.
function typesAs(typed: string, expected: string): Story["play"] {
  return async ({ canvas, args }) => {
    const input = canvas.getByRole("textbox", { name: args["aria-label"] });
    await userEvent.type(input, typed);
    await expect(input).toHaveValue(expected);
  };
}

export const Default: Story = {
  play: typesAs("12345678901", "123.456.789-01"),
};

export const Cnpj: Story = {
  args: { mask: "cnpj", "aria-label": "CNPJ" },
  play: typesAs("12345678000199", "12.345.678/0001-99"),
};

/** Switches from CPF to CNPJ formatting as soon as digits go past the CPF length. */
export const CpfOrCnpj: Story = {
  args: { mask: "cpf-cnpj", "aria-label": "CPF or CNPJ", placeholder: "CPF ou CNPJ" },
  play: typesAs("12345678000199", "12.345.678/0001-99"),
};

/** Mobile and landline numbers share one preset. Opens the phone keypad on mobile. */
export const Phone: Story = {
  args: { mask: "phone", "aria-label": "Phone" },
  play: typesAs("1133224455", "(11) 3322-4455"),
};

export const Cep: Story = {
  args: { mask: "cep", "aria-label": "CEP" },
  play: typesAs("01001000", "01001-000"),
};

export const CreditCard: Story = {
  args: { mask: "credit-card", "aria-label": "Card number" },
  play: typesAs("1234567890123456", "1234 5678 9012 3456"),
};

/** The card mask follows the issuer: Amex 4-6-5, up to 19 digits for Visa. */
export const ShouldFollowCardIssuer: Story = {
  tags: ["!autodocs"],
  args: { mask: "credit-card", "aria-label": "Card number" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Card number" });
    await userEvent.type(input, "3782");
    await expect(input).toHaveValue("3782 ______ _____");
    await userEvent.type(input, "82246310005");
    await expect(input).toHaveValue("3782 822463 10005");
    await userEvent.type(input, "{backspace}{backspace}");
    await expect(input).toHaveValue("3782 822463 100__");

    await userEvent.clear(input);
    await userEvent.type(input, "41111111111111111");
    await expect(input).toHaveValue("4111 1111 1111 11111_");
    await userEvent.tab();
    await expect(input).toHaveValue("4111 1111 1111 11111");
  },
};

export const Decimal: Story = {
  args: { mask: "decimal", "aria-label": "Amount" },
  play: typesAs("123456", "123.456,00"),
};

/**
 * Parameterized presets are objects. They're compared by value, so writing
 * the object inline is fine.
 */
export const Currency: Story = {
  args: { mask: { type: "decimal", prefix: "R$ " }, "aria-label": "Price" },
  play: typesAs("123456", "R$ 123.456,00"),
};

export const DateMask: Story = {
  args: { mask: "date", "aria-label": "Date" },
  play: typesAs("31122024", "31/12/2024"),
};

export const MonthYear: Story = {
  args: { mask: { type: "date", mode: "mm/yyyy" }, "aria-label": "Expiry" },
  play: typesAs("122024", "12/2024"),
};

/** Card expiry: two-digit year, read as 20yy in the raw value ("2030-06"). */
export const CardExpiry: Story = {
  args: { mask: { type: "date", mode: "mm/yy" }, "aria-label": "Validade" },
  play: typesAs("0630", "06/30"),
};

export const Time: Story = {
  args: { mask: "time", "aria-label": "Time" },
  play: typesAs("0930", "09:30"),
};

export const DateTime: Story = {
  args: { mask: "date-time", "aria-label": "Date and time" },
  play: typesAs("311220240930", "31/12/2024, 09:30"),
};

/** The separator is a non-breaking space, an en dash and another non-breaking space. */
export const DateRange: Story = {
  args: { mask: "date-range", "aria-label": "Period", className: "w-80" },
  play: typesAs("0101202431122024", "01/01/2024 – 31/12/2024"),
};

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
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "License plate" });
    await userEvent.type(input, "abc1d23");
    await expect(input).toHaveValue("ABC-1D23");
  },
};

/** `onValueChange` reports the raw value (digits for documents), with the masked text alongside. */
export const RawValue: Story = {
  args: { onValueChange: fn() },
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
