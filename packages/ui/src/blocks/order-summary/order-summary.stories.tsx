import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/card/card";
import { Spinner } from "@/core/spinner/spinner";
import meta from "./meta.json";
import {
  OrderSummary,
  type OrderSummaryI18n,
  OrderSummaryLine,
  OrderSummaryOption,
} from "./order-summary";

const PT_BR: OrderSummaryI18n = { labels: { details: "Ver detalhes" } };

const componentMeta = {
  title: "blocks/OrderSummary",
  component: OrderSummary,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
  args: { title: "", totalLabel: "", total: "", action: null },
} satisfies Meta<typeof OrderSummary>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Stands in for the app's purchase request. */
const purchase = () => new Promise<void>((resolve) => setTimeout(resolve, 800));

const PLAN = 1990;
const ANNUAL_DISCOUNT = 398;
const CASHBACK = 32;

/**
 * Buying a plan, with the summary in the side column: an annual discount and
 * the cashback balance the user can apply. On small screens the total and the
 * action stay in a bar at the bottom.
 */
export const Default: Story = {
  render: () => {
    const [useCashback, setUseCashback] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const total = PLAN - ANNUAL_DISCOUNT - (useCashback ? CASHBACK : 0);

    return (
      <div className="mx-auto grid max-w-5xl gap-6 p-6 pb-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Plano Pro</CardTitle>
            <CardDescription>Até 500 notas por mês, 5 usuários e radar de notas.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            A cobrança anual vence todo dia 10 de outubro. Você pode cancelar a renovação a qualquer
            momento nas configurações da conta.
          </CardContent>
        </Card>
        <OrderSummary
          i18n={PT_BR}
          title="Resumo da compra"
          totalLabel="Total"
          total={brl(total)}
          totalDescription="cobrado anualmente"
          action={
            <Button
              size="lg"
              isPending={isPending}
              onPress={async () => {
                setIsPending(true);
                await purchase();
                setIsPending(false);
              }}
            >
              {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
              Confirmar compra
            </Button>
          }
        >
          <OrderSummaryLine label="Plano Pro anual" value={brl(PLAN)} />
          <OrderSummaryLine
            label="Desconto do plano anual"
            description="20% sobre o mensal"
            value={`− ${brl(ANNUAL_DISCOUNT)}`}
            tone="discount"
          />
          <OrderSummaryOption
            label="Usar saldo de cashback"
            description={`Disponível: ${brl(CASHBACK)}`}
            value={`− ${brl(CASHBACK)}`}
            isSelected={useCashback}
            onChange={setUseCashback}
          />
        </OrderSummary>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Large screens: the card in the side column.
    const card = within(
      canvasElement.querySelector<HTMLElement>(
        "[data-slot=card]:has([data-slot=order-summary-total])",
      ) ?? canvasElement,
    );
    await expect(card.getByText(/1\.592,00/)).toBeVisible();

    await userEvent.click(card.getByRole("switch", { name: "Usar saldo de cashback" }));
    await expect(card.getByText(/1\.560,00/)).toBeVisible();

    await userEvent.click(card.getByRole("button", { name: "Confirmar compra" }));
    await waitFor(() =>
      expect(card.getByRole("button", { name: "Confirmar compra" })).toHaveAttribute(
        "aria-disabled",
        "true",
      ),
    );
  },
};

/** Who the order is for, on top: buying a certificate for a selected customer. */
export const SelectedEntity: Story = {
  render: () => (
    <div className="mx-auto max-w-sm p-6 pb-28 lg:pb-6">
      <OrderSummary
        i18n={PT_BR}
        title="Resumo do pedido"
        totalLabel="Total"
        total={brl(149.9)}
        action={<Button size="lg">Ir para o pagamento</Button>}
      >
        <OrderSummaryLine
          label="Cliente"
          value="Padaria Pão Quente"
          description="CNPJ 12.345.678/0001-95"
        />
        <OrderSummaryLine label="Certificado A1 (1 ano)" value={brl(189.9)} />
        <OrderSummaryLine
          label="Brinde do plano"
          description="Primeiro certificado com desconto"
          value={`− ${brl(40)}`}
          tone="discount"
        />
      </OrderSummary>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText(/149,90/)[0]).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Ir para o pagamento" })).toBeVisible();
  },
};
