import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BanIcon,
  CircleCheckIcon,
  CircleXIcon,
  FileBadgeIcon,
  FileTextIcon,
  FileXIcon,
  GaugeIcon,
  UsersRoundIcon,
  WalletIcon,
} from "lucide-react";
import * as React from "react";
import { RouterProvider } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/card/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/dialog/dialog";
import meta from "./meta.json";
import {
  Stat,
  StatCard,
  StatCardButton,
  StatCardGroup,
  StatCardLink,
  StatCardToggle,
  StatDescription,
  StatGrid,
  type StatI18n,
  StatIcon,
  StatLabel,
  StatValue,
} from "./stat-cards";

const componentMeta = {
  title: "blocks/StatCards",
  component: StatCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof StatCard>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

const ptBR: StatI18n = { labels: { loading: "Carregando", unavailable: "Indisponível" } };

/**
 * The totals above the invoices list: one card per status, the tone
 * matching the status.
 */
export const Default: Story = {
  render: () => (
    <StatGrid i18n={ptBR} className="max-w-4xl">
      <StatCard>
        <StatLabel>Total de notas</StatLabel>
        <StatValue>1.284</StatValue>
        <StatIcon>
          <FileTextIcon />
        </StatIcon>
      </StatCard>
      <StatCard tone="success">
        <StatLabel>Notas validadas</StatLabel>
        <StatValue>1.197</StatValue>
        <StatIcon>
          <CircleCheckIcon />
        </StatIcon>
      </StatCard>
      <StatCard tone="destructive">
        <StatLabel>Notas canceladas</StatLabel>
        <StatValue>87</StatValue>
        <StatIcon>
          <CircleXIcon />
        </StatIcon>
      </StatCard>
    </StatGrid>
  ),
};

/**
 * While the totals load, each value shows a skeleton; a metric not offered
 * yet shows "—", with the reason in the description.
 */
export const LoadingAndUnavailable: Story = {
  render: function LoadingExample() {
    const [isLoading, setIsLoading] = React.useState(true);
    return (
      <div className="flex max-w-4xl flex-col items-start gap-4">
        <Button variant="outline" size="sm" onPress={() => setIsLoading(!isLoading)}>
          {isLoading ? "Mostrar dados" : "Recarregar"}
        </Button>
        <StatGrid i18n={ptBR} className="w-full">
          <StatCard>
            <StatLabel>Clientes monitorados</StatLabel>
            <StatValue isLoading={isLoading}>342</StatValue>
            <StatIcon>
              <UsersRoundIcon />
            </StatIcon>
          </StatCard>
          <StatCard tone="destructive">
            <StatLabel>DAS MEI vencidos</StatLabel>
            <StatValue isLoading={isLoading}>12</StatValue>
            <StatIcon>
              <FileXIcon />
            </StatIcon>
          </StatCard>
          <StatCard tone="destructive">
            <StatLabel>Certificados vencidos</StatLabel>
            <StatValue isLoading={isLoading}>5</StatValue>
            <StatIcon>
              <FileBadgeIcon />
            </StatIcon>
          </StatCard>
          <StatCard tone="muted">
            <StatLabel>MEIs no limite</StatLabel>
            <StatValue isLoading={isLoading} isUnavailable>
              0
            </StatValue>
            <StatIcon>
              <GaugeIcon />
            </StatIcon>
            <StatDescription>Em breve</StatDescription>
          </StatCard>
        </StatGrid>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText("Carregando")).toHaveLength(4);
    await userEvent.click(canvas.getByRole("button", { name: "Mostrar dados" }));
    await expect(canvas.getByText("342")).toBeInTheDocument();
    await expect(canvas.getByText("Indisponível")).toBeInTheDocument();
    await expect(canvas.queryByText("Carregando")).not.toBeInTheDocument();
    // An unavailable value never shows the placeholder number.
    await expect(canvas.queryByText("0")).not.toBeInTheDocument();
  },
};

type Status = "ativo" | "bloqueado" | "cancelado";

const CLIENTS: { name: string; status: Status }[] = [
  { name: "Padaria Pão Quente Ltda", status: "ativo" },
  { name: "João Silva MEI", status: "ativo" },
  { name: "Oficina Duas Rodas", status: "bloqueado" },
  { name: "Clínica Bem Estar S/A", status: "ativo" },
  { name: "Mercado Bom Preço", status: "cancelado" },
];

const STATUS: Record<
  Status,
  { label: string; badge: "success-dot" | "destructive-dot" | "muted" }
> = {
  ativo: { label: "Ativo", badge: "success-dot" },
  bloqueado: { label: "Bloqueado", badge: "destructive-dot" },
  cancelado: { label: "Cancelado", badge: "muted" },
};

const count = (status: Status) => CLIENTS.filter((client) => client.status === status).length;

/**
 * The totals filter the list, like radios: pressing a card shows only that
 * status, "Todos" shows everything. The selection is controlled, so the app
 * keeps it in a search param.
 */
export const FilterSingle: Story = {
  render: function FilterSingleExample() {
    const [status, setStatus] = React.useState<Status | "todos">("todos");
    const clients = CLIENTS.filter((client) => status === "todos" || client.status === status);
    return (
      <div className="flex max-w-4xl flex-col gap-4">
        <StatCardGroup
          aria-label="Filtrar por situação"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[status]}
          onSelectionChange={(keys) => setStatus([...keys][0] as Status | "todos")}
          i18n={ptBR}
        >
          <StatCardToggle id="todos">
            <StatLabel>Todos</StatLabel>
            <StatValue>{CLIENTS.length}</StatValue>
            <StatIcon>
              <UsersRoundIcon />
            </StatIcon>
          </StatCardToggle>
          <StatCardToggle id="ativo" tone="success">
            <StatLabel>Ativos</StatLabel>
            <StatValue>{count("ativo")}</StatValue>
            <StatIcon>
              <CircleCheckIcon />
            </StatIcon>
          </StatCardToggle>
          <StatCardToggle id="bloqueado" tone="destructive">
            <StatLabel>Bloqueados</StatLabel>
            <StatValue>{count("bloqueado")}</StatValue>
            <StatIcon>
              <BanIcon />
            </StatIcon>
          </StatCardToggle>
          <StatCardToggle id="cancelado" tone="muted">
            <StatLabel>Cancelados</StatLabel>
            <StatValue>{count("cancelado")}</StatValue>
            <StatIcon>
              <CircleXIcon />
            </StatIcon>
          </StatCardToggle>
        </StatCardGroup>
        <ul className="divide-y rounded-lg border">
          {clients.map((client) => (
            <li key={client.name} className="flex items-center justify-between gap-3 p-3">
              <span className="truncate font-medium">{client.name}</span>
              <Badge variant={STATUS[client.status].badge}>{STATUS[client.status].label}</Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup", { name: "Filtrar por situação" });
    const all = within(group).getByRole("radio", { name: /Todos/ });
    const blocked = within(group).getByRole("radio", { name: /Bloqueados/ });
    await expect(all).toBeChecked();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(5);

    await userEvent.click(blocked);
    await expect(blocked).toBeChecked();
    await expect(all).not.toBeChecked();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(canvas.getByText("Oficina Duas Rodas")).toBeInTheDocument();

    // `disallowEmptySelection`: pressing the picked card again keeps it.
    await userEvent.click(blocked);
    await expect(blocked).toBeChecked();
  },
};

/**
 * Like checkboxes: each card adds its status to the filter; none picked
 * means no filter.
 */
export const FilterMultiple: Story = {
  render: function FilterMultipleExample() {
    const [statuses, setStatuses] = React.useState<Status[]>([]);
    const clients = CLIENTS.filter(
      (client) => statuses.length === 0 || statuses.includes(client.status),
    );
    return (
      <div className="flex max-w-4xl flex-col gap-4">
        <StatCardGroup
          aria-label="Filtrar por situação"
          selectionMode="multiple"
          selectedKeys={statuses}
          onSelectionChange={(keys) => setStatuses([...keys] as Status[])}
          i18n={ptBR}
        >
          <StatCardToggle id="ativo" tone="success">
            <StatLabel>Ativos</StatLabel>
            <StatValue>{count("ativo")}</StatValue>
            <StatIcon>
              <CircleCheckIcon />
            </StatIcon>
          </StatCardToggle>
          <StatCardToggle id="bloqueado" tone="destructive">
            <StatLabel>Bloqueados</StatLabel>
            <StatValue>{count("bloqueado")}</StatValue>
            <StatIcon>
              <BanIcon />
            </StatIcon>
          </StatCardToggle>
          <StatCardToggle id="cancelado" tone="muted">
            <StatLabel>Cancelados</StatLabel>
            <StatValue>{count("cancelado")}</StatValue>
            <StatIcon>
              <CircleXIcon />
            </StatIcon>
          </StatCardToggle>
        </StatCardGroup>
        <p className="text-sm text-muted-foreground">{clients.length} clientes</p>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const blocked = canvas.getByRole("button", { name: /Bloqueados/ });
    const cancelled = canvas.getByRole("button", { name: /Cancelados/ });
    await expect(canvas.getByText("5 clientes")).toBeInTheDocument();

    await userEvent.click(blocked);
    await userEvent.click(cancelled);
    await expect(blocked).toHaveAttribute("aria-pressed", "true");
    await expect(cancelled).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("2 clientes")).toBeInTheDocument();

    await userEvent.click(blocked);
    await expect(blocked).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByText("1 clientes")).toBeInTheDocument();
  },
};

/** A card that opens a dialog with the details behind the total. */
export const OpensDialog: Story = {
  render: () => (
    <StatGrid i18n={ptBR} className="max-w-sm">
      <DialogTrigger>
        <StatCardButton tone="destructive">
          <StatLabel>Certificados vencidos</StatLabel>
          <StatValue>5</StatValue>
          <StatIcon>
            <FileBadgeIcon />
          </StatIcon>
          <StatDescription>Ver clientes afetados</StatDescription>
        </StatCardButton>
        <Dialog>
          <DialogHeader>
            <DialogTitle>Certificados vencidos</DialogTitle>
            <DialogDescription>
              5 clientes estão com o certificado digital vencido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button slot="close">Entendi</Button>
          </DialogFooter>
        </Dialog>
      </DialogTrigger>
    </StatGrid>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Certificados vencidos/ }));
    const dialog = await body.findByRole("dialog", { name: "Certificados vencidos" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

// Links go through react-aria's router instead of navigating the preview.
const navigate = fn();

/** Cards that lead to the list, already filtered by their status. */
export const Links: Story = {
  decorators: [
    (Story) => (
      <RouterProvider navigate={navigate}>
        <Story />
      </RouterProvider>
    ),
  ],
  render: () => (
    <StatGrid i18n={ptBR} className="max-w-4xl">
      <StatCardLink href="/clientes?situacao=ativo" tone="success">
        <StatLabel>Clientes ativos</StatLabel>
        <StatValue>298</StatValue>
        <StatIcon>
          <CircleCheckIcon />
        </StatIcon>
      </StatCardLink>
      <StatCardLink href="/clientes?situacao=bloqueado" tone="destructive">
        <StatLabel>Clientes bloqueados</StatLabel>
        <StatValue>31</StatValue>
        <StatIcon>
          <BanIcon />
        </StatIcon>
      </StatCardLink>
    </StatGrid>
  ),
  play: async ({ canvas }) => {
    navigate.mockClear();
    await userEvent.click(canvas.getByRole("link", { name: /Clientes bloqueados/ }));
    await expect(navigate).toHaveBeenCalledWith("/clientes?situacao=bloqueado", undefined);
  },
};

/**
 * Several figures in one card, without a surface each; `size="lg"` for the
 * one card that highlights a single balance.
 */
export const InsideACard: Story = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-4 lg:flex-row">
      <Card className="grow">
        <CardHeader>
          <CardTitle>Resumo do período</CardTitle>
          <CardDescription>Movimentações de cashback</CardDescription>
        </CardHeader>
        <CardContent>
          <StatGrid i18n={ptBR}>
            <Stat>
              <StatLabel>Saldo inicial</StatLabel>
              <StatValue>R$ 1.250,00</StatValue>
              <StatDescription>Saldo anterior ao período</StatDescription>
            </Stat>
            <Stat tone="success">
              <StatLabel>Total ganho</StatLabel>
              <StatValue>R$ 480,00</StatValue>
              <StatDescription>Vendas de certificados</StatDescription>
            </Stat>
            <Stat tone="destructive">
              <StatLabel>Total utilizado</StatLabel>
              <StatValue>R$ 320,00</StatValue>
              <StatDescription>Em produtos e serviços</StatDescription>
            </Stat>
            <Stat tone="warning">
              <StatLabel>Total expirado</StatLabel>
              <StatValue>R$ 45,00</StatValue>
              <StatDescription>Valor não utilizado</StatDescription>
            </Stat>
          </StatGrid>
        </CardContent>
      </Card>
      <StatCard size="lg" className="lg:w-80">
        <StatLabel>Saldo disponível</StatLabel>
        <StatValue>R$ 1.365,00</StatValue>
        <StatIcon>
          <WalletIcon />
        </StatIcon>
        <StatDescription>Pronto para uso imediato</StatDescription>
      </StatCard>
    </div>
  ),
};
