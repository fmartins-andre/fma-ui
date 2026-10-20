import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BarcodeIcon,
  ChartColumnIcon,
  ChartPieIcon,
  ChevronRightIcon,
  CircleSlashIcon,
  CreditCardIcon,
  DownloadIcon,
  FileBadgeIcon,
  FileCheck2Icon,
  FilePlusIcon,
  HeadsetIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  ZapIcon,
} from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button, LinkButton } from "@/core/button/button";
import { IconTile } from "@/core/icon-tile/icon-tile";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/core/item/item";
import { Progress, ProgressLabel, ProgressValue } from "@/core/progress/progress";
import {
  FeaturePromo,
  FeaturePromoAcceptance,
  FeaturePromoActions,
  FeaturePromoBenefit,
  FeaturePromoBenefits,
  FeaturePromoContent,
  FeaturePromoDescription,
  FeaturePromoGrid,
  FeaturePromoMedia,
  FeaturePromoTitle,
} from "./feature-promo";
import meta from "./meta.json";

const componentMeta = {
  title: "blocks/FeaturePromo",
  component: FeaturePromo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof FeaturePromo>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A locked module: benefits, the call to hire a plan and a product preview beside. */
export const LockedFeature: Story = {
  render: (args) => (
    <FeaturePromo {...args}>
      <FeaturePromoContent>
        <FeaturePromoTitle>Ative o emissor e compre notas adicionais</FeaturePromoTitle>
        <FeaturePromoDescription>
          Para comprar notas adicionais é preciso ter um plano ativo de emissão de notas fiscais.
        </FeaturePromoDescription>
        <FeaturePromoDescription>
          Com o plano, você emite NF-e, NFC-e, NFS-e, CT-e e MDF-e e compra notas avulsas sempre que
          precisar.
        </FeaturePromoDescription>
        <FeaturePromoBenefits>
          <FeaturePromoBenefit icon={<ShieldCheckIcon />}>
            Emissão de notas com validade jurídica
          </FeaturePromoBenefit>
          <FeaturePromoBenefit icon={<ChartPieIcon />}>
            Acompanhamento do saldo de notas do mês
          </FeaturePromoBenefit>
          <FeaturePromoBenefit icon={<ShoppingCartIcon />}>
            Compra avulsa de notas conforme a demanda
          </FeaturePromoBenefit>
        </FeaturePromoBenefits>
        <FeaturePromoActions>
          <LinkButton href="/planos" size="lg">
            Quero contratar agora
          </LinkButton>
        </FeaturePromoActions>
      </FeaturePromoContent>
      <FeaturePromoMedia className="flex flex-col justify-center gap-4 p-8">
        <div className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <Progress value={184} maxValue={240}>
            <ProgressLabel>Notas do mês</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <Progress value={12} maxValue={50}>
            <ProgressLabel>Notas adicionais</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      </FeaturePromoMedia>
    </FeaturePromo>
  ),
};

/** Without media the content takes the card; here, a module that is hired from the plans page. */
export const WithoutMedia: Story = {
  render: (args) => (
    <FeaturePromo {...args}>
      <FeaturePromoContent>
        <FeaturePromoTitle>Mais controle sobre as notas dos seus clientes</FeaturePromoTitle>
        <FeaturePromoDescription>
          O Gestor de Notas consulta automaticamente as notas recebidas e emitidas pelos seus
          clientes e confere os impostos com o validador tributário.
        </FeaturePromoDescription>
        <FeaturePromoBenefits>
          <FeaturePromoBenefit icon={<DownloadIcon />}>
            Consulta automática de notas na SEFAZ
          </FeaturePromoBenefit>
          <FeaturePromoBenefit icon={<ChartColumnIcon />}>
            Gráficos e relatórios por cliente
          </FeaturePromoBenefit>
          <FeaturePromoBenefit icon={<FileCheck2Icon />}>
            Integração com o validador tributário
          </FeaturePromoBenefit>
        </FeaturePromoBenefits>
        <FeaturePromoActions>
          <LinkButton href="/planos" size="lg">
            Contratar o Gestor de Notas
          </LinkButton>
          <LinkButton href="/ajuda/gestor-de-notas" variant="ghost" size="lg">
            Saiba mais
          </LinkButton>
        </FeaturePromoActions>
      </FeaturePromoContent>
    </FeaturePromo>
  ),
};

/** The action unlocks only after the user accepts the terms. */
export const WithAcceptance: Story = {
  args: { onAcceptedChange: fn() },
  render: (args) => (
    <FeaturePromo {...args}>
      <FeaturePromoContent>
        <FeaturePromoTitle>Gerar código de acesso de suporte</FeaturePromoTitle>
        <FeaturePromoDescription>
          O código permite que um atendente acesse sua conta por 24 horas para ajudar em alguma
          tarefa. Ele verá suas informações salvas, então compartilhe com cuidado.
        </FeaturePromoDescription>
        <FeaturePromoBenefits>
          <FeaturePromoBenefit icon={<HeadsetIcon />}>
            Informe o código só nos canais oficiais de atendimento
          </FeaturePromoBenefit>
          <FeaturePromoBenefit icon={<CircleSlashIcon />}>
            Não compartilhe o código com outras pessoas
          </FeaturePromoBenefit>
        </FeaturePromoBenefits>
        <FeaturePromoAcceptance>
          Entendo e me responsabilizo pelo compartilhamento do acesso
        </FeaturePromoAcceptance>
        <FeaturePromoActions>
          <Button size="lg">Gerar código de acesso</Button>
        </FeaturePromoActions>
      </FeaturePromoContent>
    </FeaturePromo>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByRole("button", { name: "Gerar código de acesso" });
    await expect(action).toBeDisabled();

    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Entendo e me responsabilizo pelo compartilhamento do acesso",
      }),
    );
    await expect(args.onAcceptedChange).toHaveBeenCalledWith(true);
    await expect(action).toBeEnabled();
  },
};

/** Centered onboarding: the pitch, the action and a grid that explains the options. */
export const Centered: Story = {
  args: { layout: "centered" },
  render: (args) => (
    <FeaturePromo {...args}>
      <FeaturePromoContent>
        <FeaturePromoTitle>
          O jeito mais fácil de cobrar e receber dos seus clientes
        </FeaturePromoTitle>
        <FeaturePromoDescription>
          Receba direto na sua conta com as melhores taxas. Cadastre seus dados bancários para
          começar.
        </FeaturePromoDescription>
        <FeaturePromoActions>
          <Button size="lg">
            Cadastrar dados bancários
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </FeaturePromoActions>
      </FeaturePromoContent>
      <FeaturePromoGrid>
        {[
          { icon: <QrCodeIcon />, title: "Pix", description: "Taxa de R$ 0,99 por cobrança paga." },
          {
            icon: <BarcodeIcon />,
            title: "Boleto",
            description: "Taxa de R$ 1,99 por boleto compensado.",
          },
          {
            icon: <CreditCardIcon />,
            title: "Cartão de crédito",
            description: "Taxa de 2,99% por venda, em até 12 vezes.",
          },
        ].map((method) => (
          <div key={method.title} className="flex flex-col gap-3 rounded-lg border p-4">
            <IconTile variant="soft">{method.icon}</IconTile>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{method.title}</p>
              <p className="text-muted-foreground">{method.description}</p>
            </div>
          </div>
        ))}
      </FeaturePromoGrid>
    </FeaturePromo>
  ),
};

/** Shortcuts that navigate: where to use a balance, as `Item`s with `href`. */
export const Shortcuts: Story = {
  args: { layout: "centered" },
  render: (args) => (
    <FeaturePromo {...args}>
      <FeaturePromoContent>
        <FeaturePromoTitle>Onde usar seu saldo de cashback</FeaturePromoTitle>
        <FeaturePromoDescription>
          Você tem R$ 182,40 disponíveis. Escolha onde quer usar.
        </FeaturePromoDescription>
      </FeaturePromoContent>
      <FeaturePromoGrid>
        <Item variant="outline" href="/certificados-digitais/comprar">
          <ItemMedia>
            <IconTile variant="soft" size="sm">
              <FileBadgeIcon />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Certificado digital</ItemTitle>
            <ItemDescription>Desconto na compra de certificados</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </ItemActions>
        </Item>
        <Item variant="outline" href="/planos">
          <ItemMedia>
            <IconTile variant="soft" size="sm">
              <ZapIcon />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Assinatura do sistema</ItemTitle>
            <ItemDescription>Assine ou renove seu plano</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </ItemActions>
        </Item>
        <Item variant="outline" href="/notas-adicionais/comprar">
          <ItemMedia>
            <IconTile variant="soft" size="sm">
              <FilePlusIcon />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Notas adicionais</ItemTitle>
            <ItemDescription>Compre pacotes de notas</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </ItemActions>
        </Item>
      </FeaturePromoGrid>
    </FeaturePromo>
  ),
};
