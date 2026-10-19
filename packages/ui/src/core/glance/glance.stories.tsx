import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BellIcon,
  CircleCheckIcon,
  CircleDollarSignIcon,
  CrownIcon,
  InfoIcon,
  ReceiptIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button, LinkButton } from "@/core/button/button";
import {
  Glance,
  GlanceContent,
  GlanceDescription,
  GlanceFooter,
  GlanceHeader,
  GlanceIndicator,
  GlanceLabel,
  GlanceMedia,
  GlanceText,
  GlanceTitle,
  GlanceTrigger,
  GlanceValue,
} from "./glance";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Glance",
  component: Glance,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { children: null },
} satisfies Meta<typeof Glance>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A value at a glance; the panel adds context and the next step. */
export const Default: Story = {
  render: () => (
    <Glance>
      <GlanceTrigger>
        <CircleDollarSignIcon />
        <GlanceText>
          <GlanceLabel>Saldo de cashback</GlanceLabel>
          <GlanceValue>R$ 1.250,00</GlanceValue>
        </GlanceText>
      </GlanceTrigger>
      <GlanceContent>
        <GlanceHeader>
          <GlanceMedia>
            <CircleDollarSignIcon />
          </GlanceMedia>
          <div>
            <GlanceTitle>R$ 1.250,00 disponíveis</GlanceTitle>
            <GlanceDescription>Acumulados nos últimos 30 dias.</GlanceDescription>
          </div>
        </GlanceHeader>
        <GlanceDescription>R$ 80,00 expiram nos próximos 5 dias.</GlanceDescription>
        <GlanceFooter>
          <LinkButton href="#cashback" variant="outline">
            Ver detalhes
          </LinkButton>
        </GlanceFooter>
      </GlanceContent>
    </Glance>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Saldo de cashback/ });
    await userEvent.click(trigger);
    const body = within(document.body);
    const dialog = await body.findByRole("dialog", { name: "R$ 1.250,00 disponíveis" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** `tone` tints the trigger and the panel's media, like `Alert`. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Glance tone="info">
        <GlanceTrigger>
          <InfoIcon />
          <GlanceText>
            <GlanceLabel>Novidade</GlanceLabel>
            <GlanceValue>Relatórios</GlanceValue>
          </GlanceText>
        </GlanceTrigger>
        <GlanceContent>
          <GlanceTitle>Relatórios disponíveis</GlanceTitle>
        </GlanceContent>
      </Glance>
      <Glance tone="success">
        <GlanceTrigger>
          <CircleCheckIcon />
          <GlanceText>
            <GlanceLabel>Plano</GlanceLabel>
            <GlanceValue>Em dia</GlanceValue>
          </GlanceText>
        </GlanceTrigger>
        <GlanceContent>
          <GlanceTitle>Pagamentos em dia</GlanceTitle>
        </GlanceContent>
      </Glance>
      <Glance tone="warning">
        <GlanceTrigger>
          <ReceiptIcon />
          <GlanceText>
            <GlanceLabel>Fatura em atraso</GlanceLabel>
            <GlanceValue>Vence hoje</GlanceValue>
          </GlanceText>
        </GlanceTrigger>
        <GlanceContent>
          <GlanceTitle>Fatura em atraso</GlanceTitle>
        </GlanceContent>
      </Glance>
      <Glance tone="destructive">
        <GlanceTrigger>
          <TriangleAlertIcon />
          <GlanceText>
            <GlanceLabel>Acesso limitado</GlanceLabel>
            <GlanceValue>Pendência financeira</GlanceValue>
          </GlanceText>
        </GlanceTrigger>
        <GlanceContent>
          <GlanceTitle>Pendência financeira</GlanceTitle>
        </GlanceContent>
      </Glance>
    </div>
  ),
};

/** An account notice: what happened, what it means and how to fix it. */
export const Notice: Story = {
  render: () => (
    <Glance tone="warning">
      <GlanceTrigger>
        <ReceiptIcon />
        <GlanceText>
          <GlanceLabel>Fatura em atraso</GlanceLabel>
          <GlanceValue>Mantenha seus benefícios</GlanceValue>
        </GlanceText>
      </GlanceTrigger>
      <GlanceContent>
        {({ close }) => (
          <>
            <GlanceHeader>
              <GlanceMedia>
                <ReceiptIcon />
              </GlanceMedia>
              <div>
                <GlanceTitle>Plano com fatura em atraso</GlanceTitle>
                <GlanceDescription>Regularize para não perder o acesso.</GlanceDescription>
              </div>
            </GlanceHeader>
            <GlanceDescription>
              <p>Enquanto o pagamento não for regularizado, você pode:</p>
              <ul className="list-disc pl-5">
                <li>ter o acesso ao sistema bloqueado;</li>
                <li>ficar impedido de emitir novas notas;</li>
                <li>deixar de receber os benefícios do plano.</li>
              </ul>
            </GlanceDescription>
            <GlanceFooter>
              <Button variant="ghost" onPress={close}>
                Agora não
              </Button>
              <LinkButton href="#faturas" onPress={close}>
                Regularizar pagamento
              </LinkButton>
            </GlanceFooter>
          </>
        )}
      </GlanceContent>
    </Glance>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Fatura em atraso/ }));
    const body = within(document.body);
    await body.findByRole("dialog", { name: "Plano com fatura em atraso" });
    await userEvent.click(body.getByRole("button", { name: "Agora não" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/**
 * Icon-only, with a count in the corner: the base of a notification menu.
 * The meaning of the count goes in the trigger's `aria-label`.
 */
export const IconWithIndicator: Story = {
  render: () => (
    <Glance>
      <GlanceTrigger size="icon" aria-label="Notificações, 3 não lidas">
        <BellIcon />
        <GlanceIndicator>3</GlanceIndicator>
      </GlanceTrigger>
      <GlanceContent>
        <GlanceTitle>Notificações</GlanceTitle>
        <GlanceDescription>3 notificações não lidas.</GlanceDescription>
        <GlanceFooter>
          <LinkButton href="#notificacoes" variant="outline">
            Ver todas
          </LinkButton>
        </GlanceFooter>
      </GlanceContent>
    </Glance>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Notificações, 3 não lidas" });
    await userEvent.click(trigger);
    await within(document.body).findByRole("dialog", { name: "Notificações" });
  },
};

/** No children on `GlanceIndicator` draws a dot instead of a count. */
export const DotIndicator: Story = {
  render: () => (
    <Glance tone="warning">
      <GlanceTrigger size="icon" aria-label="Plano gratuito, upgrade disponível">
        <CrownIcon />
        <GlanceIndicator className="bg-warning" />
      </GlanceTrigger>
      <GlanceContent>
        <GlanceTitle>Faça um upgrade</GlanceTitle>
        <GlanceDescription>Mais notas por mês, suporte prioritário e cashback.</GlanceDescription>
      </GlanceContent>
    </Glance>
  ),
};

/** `size="sm"` keeps only the value visible; the label stays for screen readers. */
export const Small: Story = {
  render: () => (
    <Glance>
      <GlanceTrigger size="sm">
        <CircleDollarSignIcon />
        <GlanceText>
          <GlanceLabel>Saldo de cashback</GlanceLabel>
          <GlanceValue>R$ 1.250,00</GlanceValue>
        </GlanceText>
      </GlanceTrigger>
      <GlanceContent>
        <GlanceTitle>R$ 1.250,00 disponíveis</GlanceTitle>
      </GlanceContent>
    </Glance>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Saldo de cashback R$ 1.250,00" }),
    ).toBeInTheDocument();
  },
};
