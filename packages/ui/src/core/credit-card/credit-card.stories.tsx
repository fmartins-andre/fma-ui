import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { MaskedInput } from "@/core/masked-input/masked-input";
import { CreditCard, type CreditCardField, getCreditCardIssuer } from "./credit-card";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/CreditCard",
  component: CreditCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    focused: { control: "radio", options: [null, "number", "name", "expiry", "cvc"] },
  },
  args: {
    number: "4111 1111 1111 1111",
    name: "Maria Silva",
    expiry: "12/28",
    cvc: "123",
  },
} satisfies Meta<typeof CreditCard>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const card = canvas.getByRole("img", { name: "Visa card ending in 1111, expires 12/28" });
    await expect(card).toHaveAttribute("data-issuer", "visa");
  },
};

/** A saved card: the number arrives hidden (`*` or `x`), so `issuer` names the issuer. */
export const SavedCard: Story = {
  args: {
    number: "**** **** **** 4242",
    issuer: "mastercard",
    name: "Maria Silva",
    expiry: "0729",
    cvc: undefined,
  },
  play: async ({ canvas }) => {
    const card = canvas.getByRole("img", {
      name: "Mastercard card ending in 4242, expires 07/29",
    });
    await expect(card).toHaveAttribute("data-issuer", "mastercard");
  },
};

/** `focused: "cvc"` turns the card over to the security code. */
export const Back: Story = {
  args: { focused: "cvc" },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector("[data-flipped]");
    await expect(card).not.toBeNull();
  },
};

const ISSUER_NUMBERS = [
  "4111111111111111",
  "5555555555554444",
  "6362970000457013",
  "378282246310005",
  "6062825624254001",
  "30569309025904",
  "6011111111111117",
  "3530111333300000",
  "6370950000000005",
  "",
];

/** The issuers with a look of their own, one with only its name (Hiper) and an unknown number. */
export const Issuers: Story = {
  render: (args) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {ISSUER_NUMBERS.map((number) => (
        <CreditCard key={number} {...args} number={number} className="w-64" />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const issuers = [...canvasElement.querySelectorAll("[data-slot=credit-card]")].map((card) =>
      card.getAttribute("data-issuer"),
    );
    await expect(issuers).toEqual([
      "visa",
      "mastercard",
      "elo",
      "american-express",
      "hipercard",
      "diners-club",
      "discover",
      "jcb",
      "hiper",
      "unknown",
    ]);
  },
};

/** The width sets the size; the text scales with it. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <CreditCard {...args} className="w-48" />
      <CreditCard {...args} />
      <CreditCard {...args} className="w-96" />
    </div>
  ),
};

/**
 * A live preview beside the form: each field's focus sets `focused`, and the CVV turns
 * the card over. The texts are translated through `labels`.
 */
export const LivePreview: Story = {
  args: { number: undefined, name: undefined, expiry: undefined, cvc: undefined },
  render: function LivePreviewExample() {
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [focused, setFocused] = useState<CreditCardField | null>(null);
    const focus = (field: CreditCardField) => ({
      onFocus: () => setFocused(field),
      onBlur: () => setFocused(null),
    });
    const cvcSize = getCreditCardIssuer(number)?.code.size ?? 3;

    return (
      <div className="flex flex-wrap items-start gap-8">
        <CreditCard
          number={number}
          name={name}
          expiry={expiry}
          cvc={cvc}
          focused={focused}
          labels={{
            validThru: "válido até",
            namePlaceholder: "NOME DO TITULAR",
            card: ({ issuer, lastDigits }) =>
              `Cartão ${issuer ?? ""}${lastDigits ? ` final ${lastDigits}` : ""}`.trim(),
          }}
        />
        <form className="grid w-72 grid-cols-2 gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="card-number">Número do cartão</Label>
            <MaskedInput
              id="card-number"
              mask="credit-card"
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onValueChange={(raw) => setNumber(raw)}
              {...focus("number")}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="card-name">Nome impresso no cartão</Label>
            <Input
              id="card-name"
              autoComplete="cc-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              {...focus("name")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-expiry">Validade</Label>
            <MaskedInput
              id="card-expiry"
              mask={{ type: "date", mode: "mm/yy" }}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              value={expiry}
              onValueChange={(_raw, masked) => setExpiry(masked)}
              {...focus("expiry")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-cvc">CVV</Label>
            <Input
              id="card-cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={cvcSize}
              value={cvc}
              onChange={(event) => setCvc(event.target.value.replace(/\D/g, ""))}
              {...focus("cvc")}
            />
          </div>
        </form>
      </div>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole("img", { name: "Cartão" });
    await expect(card).toHaveAttribute("data-issuer", "unknown");

    await userEvent.type(canvas.getByLabelText("Número do cartão"), "4111111111111111");
    await expect(card).toHaveAttribute("data-issuer", "visa");
    await expect(card).toHaveAccessibleName("Cartão Visa final 1111");

    await userEvent.type(canvas.getByLabelText("Nome impresso no cartão"), "Maria Silva");
    await expect(card).toHaveTextContent("Maria Silva");

    await userEvent.type(canvas.getByLabelText("CVV"), "123");
    await expect(canvasElement.querySelector("[data-flipped]")).not.toBeNull();

    await userEvent.tab();
    await expect(canvasElement.querySelector("[data-flipped]")).toBeNull();
  },
};
