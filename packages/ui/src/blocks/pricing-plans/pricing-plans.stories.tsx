import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { OrderSummary, OrderSummaryLine } from "../order-summary/order-summary";
import meta from "./meta.json";
import {
  PricingPeriod,
  PricingPeriodOption,
  PricingPlan,
  PricingPlanFeature,
  PricingPlanGroup,
  PricingPlans,
  type PricingPlansI18n,
} from "./pricing-plans";

const PT_BR: PricingPlansI18n = { labels: { included: "Incluído", notIncluded: "Não incluído" } };

const componentMeta = {
  title: "blocks/PricingPlans",
  component: PricingPlans,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof PricingPlans>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PLANS = [
  {
    id: "basic",
    name: "Básico",
    description: "Para quem está começando a emitir.",
    monthly: 69.9,
    annual: 59.9,
    features: [
      { label: "Até 100 notas por mês", isIncluded: true },
      { label: "1 usuário", isIncluded: true },
      { label: "Radar de notas", isIncluded: false },
      { label: "Suporte por telefone", isIncluded: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para a empresa que emite todo dia.",
    monthly: 129.9,
    annual: 109.9,
    isFeatured: true,
    features: [
      { label: "Até 500 notas por mês", isIncluded: true },
      { label: "5 usuários", isIncluded: true },
      { label: "Radar de notas", isIncluded: true },
      { label: "Suporte por telefone", isIncluded: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Para escritórios com vários clientes.",
    monthly: 249.9,
    annual: 209.9,
    features: [
      { label: "Notas ilimitadas", isIncluded: true },
      { label: "Usuários ilimitados", isIncluded: true },
      { label: "Radar de notas", isIncluded: true },
      { label: "Suporte por telefone", isIncluded: true },
    ],
  },
];

/**
 * The plans page: the period first, the plans as cards (the popular one
 * highlighted by a badge and a border), then the summary with "Continuar".
 * Choosing a card only selects it; the purchase starts from the summary.
 */
export const Default: Story = {
  render: function PricingPlansExample() {
    const [period, setPeriod] = useState("annual");
    const [planId, setPlanId] = useState("pro");
    const plan = PLANS.find((item) => item.id === planId) ?? PLANS[1];
    const isAnnual = period === "annual";

    return (
      <div className="mx-auto max-w-6xl p-6">
        <PricingPlans
          i18n={PT_BR}
          summary={
            plan && (
              <OrderSummary
                title="Resumo"
                totalLabel="Total"
                total={brl(isAnnual ? plan.annual * 12 : plan.monthly)}
                totalDescription={isAnnual ? "cobrado uma vez por ano" : "cobrado todo mês"}
                action={<Button size="lg">Continuar</Button>}
              >
                <OrderSummaryLine
                  label={`Plano ${plan.name}`}
                  description={isAnnual ? "Anual" : "Mensal"}
                  value={`${brl(isAnnual ? plan.annual : plan.monthly)}/mês`}
                />
              </OrderSummary>
            )
          }
        >
          <PricingPeriod aria-label="Período de cobrança" value={period} onChange={setPeriod}>
            <PricingPeriodOption id="monthly">Mensal</PricingPeriodOption>
            <PricingPeriodOption id="annual">
              Anual
              <Badge variant="success-light">2 meses grátis</Badge>
            </PricingPeriodOption>
          </PricingPeriod>
          <PricingPlanGroup aria-label="Plano" value={planId} onChange={setPlanId}>
            {PLANS.map((item) => (
              <PricingPlan
                key={item.id}
                value={item.id}
                name={item.name}
                description={item.description}
                badge={item.isFeatured ? "Mais popular" : undefined}
                isFeatured={item.isFeatured}
                price={brl(isAnnual ? item.annual : item.monthly)}
                period="/mês"
                priceNote={isAnnual ? `${brl(item.annual * 12)} por ano` : "Sem fidelidade"}
              >
                {item.features.map((feature) => (
                  <PricingPlanFeature key={feature.label} isIncluded={feature.isIncluded}>
                    {feature.label}
                  </PricingPlanFeature>
                ))}
              </PricingPlan>
            ))}
          </PricingPlanGroup>
        </PricingPlans>
      </div>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const plans = canvas.getByRole("radiogroup", { name: "Plano" });
    const pro = within(plans).getByRole("radio", { name: "Pro" });
    await expect(pro).toBeChecked();
    // Named by the plan, described by its price and badge.
    await expect(pro).toHaveAccessibleDescription(
      /R\$\s109,90\s?\/mês R\$\s1\.318,80 por ano Mais popular/,
    );

    // Features say whether they're included, not only by the icon.
    const basicCard = canvasElement.querySelector<HTMLElement>("[data-slot=pricing-plan]");
    await expect(within(basicCard as HTMLElement).getAllByText(/Não incluído/)).toHaveLength(2);

    await userEvent.click(canvas.getByRole("radio", { name: "Mensal" }));
    await expect(pro).toHaveAccessibleDescription(/R\$\s129,90\s?\/mês Sem fidelidade/);

    // Choosing a card selects it; the summary follows.
    await userEvent.click(within(plans).getByText("Para quem está começando a emitir."));
    await expect(within(plans).getByRole("radio", { name: "Básico" })).toBeChecked();
    const summary = canvasElement.querySelector<HTMLElement>(
      "[data-slot=card]:has([data-slot=order-summary-total])",
    );
    await expect(within(summary as HTMLElement).getByText("Plano Básico")).toBeVisible();
    await expect(within(summary as HTMLElement).getByText("R$ 69,90")).toBeVisible();

    // Arrow keys move between plans.
    await userEvent.keyboard("{ArrowRight}");
    await expect(pro).toBeChecked();
  },
};
