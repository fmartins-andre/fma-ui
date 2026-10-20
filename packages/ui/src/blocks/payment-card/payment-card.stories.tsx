import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCardIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/core/empty/empty";
import { Spinner } from "@/core/spinner/spinner";
import {
  isValidCreditCardCode,
  isValidCreditCardExpiry,
  isValidCreditCardNumber,
} from "@/lib/credit-card-validation";
import meta from "./meta.json";
import {
  PaymentCardCodeField,
  PaymentCardDetails,
  PaymentCardExpiryField,
  PaymentCardFields,
  PaymentCardForm,
  PaymentCardNameField,
  PaymentCardNumberField,
  PaymentCardPreview,
  PaymentCardRemove,
} from "./payment-card";

const componentMeta = {
  title: "blocks/PaymentCard",
  component: PaymentCardDetails,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
  args: { number: "" },
} satisfies Meta<typeof PaymentCardDetails>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

/** Stands in for the app's request to the payment gateway. */
const request = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

const CARD_LABELS = {
  validThru: "válido até",
  namePlaceholder: "NOME DO TITULAR",
  card: ({ issuer, lastDigits }: { issuer?: string; lastDigits?: string }) =>
    `Cartão ${issuer ?? ""}${lastDigits ? ` final ${lastDigits}` : ""}`.replace(/\s+/g, " ").trim(),
};

/**
 * The saved card as the gateway returns it (digits hidden, issuer apart), and the
 * remove button, which confirms before removing.
 */
export const SavedCard: Story = {
  render: function SavedCardExample() {
    const [isRemoved, setIsRemoved] = useState(false);

    if (isRemoved) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCardIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum cartão cadastrado</EmptyTitle>
            <EmptyDescription>Cadastre um cartão para pagar suas faturas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <PaymentCardDetails
        number="XXXX-XXXX-XXXX-4242"
        issuer="visa"
        name="Maria Silva"
        expiry="12/2028"
        i18n={{
          labels: { issuer: "Bandeira", number: "Número", holder: "Titular", expiry: "Validade" },
          card: CARD_LABELS,
        }}
        actions={
          <PaymentCardRemove
            onRemove={async () => {
              await request();
              setIsRemoved(true);
            }}
            i18n={{
              labels: {
                remove: "Remover cartão",
                confirmTitle: "Remover este cartão?",
                confirmDescription: "Para pagar com cartão, você precisará cadastrar outro.",
                confirm: "Remover cartão",
                cancel: "Cancelar",
                pending: "Removendo…",
                error: "Não foi possível remover o cartão. Tente novamente.",
              },
            }}
          />
        }
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Cartão Visa final 4242" })).toBeInTheDocument();
    await expect(canvas.getByText("•••• 4242", { selector: "dd" })).toBeInTheDocument();
    await expect(canvas.getByText("12/28", { selector: "dd" })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Remover cartão" }));
    const dialog = await body.findByRole("alertdialog", { name: "Remover este cartão?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Remover cartão" }));
    await waitFor(() => expect(canvas.getByText("Nenhum cartão cadastrado")).toBeInTheDocument());
  },
};

/**
 * Adding a card: the preview follows the fields, the code field turns it over, and the
 * `credit-card-validation` lib validates on submit — the code against the number's issuer,
 * so the number is controlled here.
 */
export const NewCard: Story = {
  render: function NewCardExample() {
    const [number, setNumber] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [saved, setSaved] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      setIsPending(true);
      await request();
      setIsPending(false);
      setSaved(String(data.get("number")).slice(-4));
    }

    return (
      <PaymentCardForm onSubmit={handleSubmit}>
        <PaymentCardPreview labels={CARD_LABELS} />
        <PaymentCardFields>
          <PaymentCardNumberField
            name="number"
            label="Número do cartão"
            isRequired
            value={number}
            onChange={setNumber}
            validate={(value) =>
              isValidCreditCardNumber(value) ? null : "Número de cartão inválido."
            }
          />
          <PaymentCardNameField name="name" label="Nome impresso no cartão" isRequired />
          <PaymentCardExpiryField
            name="expiry"
            label="Validade"
            placeholder="MM/AA"
            isRequired
            validate={(value) =>
              isValidCreditCardExpiry(value) ? null : "Cartão vencido ou data inválida."
            }
          />
          <PaymentCardCodeField
            name="cvc"
            label="CVV"
            isRequired
            validate={(value) => (isValidCreditCardCode(value, number) ? null : "Código inválido.")}
          />
          <div className="col-span-2 flex items-center justify-end gap-3">
            {saved && (
              <p role="status" className="text-sm text-muted-foreground">
                Cartão final {saved} cadastrado.
              </p>
            )}
            <Button type="submit" isPending={isPending}>
              {isPending && <Spinner />}
              Cadastrar cartão
            </Button>
          </div>
        </PaymentCardFields>
      </PaymentCardForm>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole("img", { name: "Cartão" });

    await userEvent.type(canvas.getByLabelText(/Número do cartão/), "378282246310005");
    await expect(card).toHaveAttribute("data-issuer", "american-express");
    await expect(canvas.getByLabelText(/Número do cartão/)).toHaveValue("3782 822463 10005");

    await userEvent.type(canvas.getByLabelText(/Nome impresso/), "Maria Silva");
    await expect(card).toHaveTextContent("Maria Silva");

    await userEvent.type(canvas.getByLabelText(/Validade/), "0120");
    await userEvent.type(canvas.getByLabelText(/CVV/), "12a345");
    await expect(canvas.getByLabelText(/CVV/)).toHaveValue("1234");
    // Amex keeps its code on the front.
    await expect(canvasElement.querySelector("[data-flipped]")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Cadastrar cartão" }));
    await expect(await canvas.findByText("Cartão vencido ou data inválida.")).toBeInTheDocument();

    await userEvent.clear(canvas.getByLabelText(/Validade/));
    await userEvent.type(canvas.getByLabelText(/Validade/), "1299");
    await userEvent.click(canvas.getByRole("button", { name: "Cadastrar cartão" }));
    await expect(await canvas.findByText("Cartão final 0005 cadastrado.")).toBeInTheDocument();
  },
};

/** For gateways that take the name apart: `part="first"` and `part="last"`, joined on the card. */
export const SplitName: Story = {
  render: () => (
    <PaymentCardForm>
      <PaymentCardPreview labels={CARD_LABELS} />
      <PaymentCardFields>
        <PaymentCardNumberField name="number" label="Número do cartão" />
        <PaymentCardNameField part="first" name="first_name" label="Nome" />
        <PaymentCardNameField part="last" name="last_name" label="Sobrenome" />
        <PaymentCardExpiryField name="expiry" label="Validade" placeholder="MM/AA" />
        <PaymentCardCodeField name="cvc" label="CVV" />
      </PaymentCardFields>
    </PaymentCardForm>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.type(canvas.getByLabelText("Nome"), "Maria");
    await userEvent.type(canvas.getByLabelText("Sobrenome"), "Silva");
    await expect(canvas.getByRole("img")).toHaveTextContent("Maria Silva");

    await userEvent.click(canvas.getByLabelText("CVV"));
    await expect(canvasElement.querySelector("[data-flipped]")).not.toBeNull();
    await userEvent.tab();
    await expect(canvasElement.querySelector("[data-flipped]")).toBeNull();
  },
};
