import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  FilesIcon,
  FileTextIcon,
  RefreshCwIcon,
  WalletIcon,
} from "lucide-react";
import * as React from "react";
import { I18nProvider } from "react-aria-components";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Stat,
  StatDescription,
  StatGrid,
  type StatI18n,
  StatLabel,
  StatValue,
} from "@/blocks/stat-cards/stat-cards";
import { Alert, AlertTitle } from "@/core/alert/alert";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { CardFooter } from "@/core/card/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/core/chart/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/table/table";
import { ToggleGroup, ToggleGroupItem } from "@/core/toggle-group/toggle-group";
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  type DashboardCardI18n,
} from "./dashboard-card";
import meta from "./meta.json";

const withPtBR: Decorator = (Story) => (
  <I18nProvider locale="pt-BR">
    <Story />
  </I18nProvider>
);

const componentMeta = {
  title: "blocks/DashboardCard",
  component: DashboardCard,
  tags: ["autodocs"],
  decorators: [withPtBR],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof DashboardCard>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

const ptBR: DashboardCardI18n = {
  labels: {
    help: "Mais informações",
    updatedAt: (formatted) => `Atualizado em ${formatted}`,
    refreshing: "Atualizando",
    loading: "Carregando",
    empty: "Nenhum dado",
    emptyDescription: "Ainda não há nada para mostrar neste período.",
    error: "Não foi possível carregar os dados",
    errorDescription: "Verifique sua conexão e tente novamente.",
    retry: "Tentar novamente",
  },
};

const statPtBR: StatI18n = { labels: { loading: "Carregando", unavailable: "Indisponível" } };

const UPDATED_AT = new Date(2026, 9, 20, 9, 45);

const INVOICES = [
  { month: "mai", nfe: 186, nfse: 80 },
  { month: "jun", nfe: 205, nfse: 112 },
  { month: "jul", nfe: 237, nfse: 120 },
  { month: "ago", nfe: 173, nfse: 190 },
  { month: "set", nfe: 209, nfse: 130 },
  { month: "out", nfe: 214, nfse: 140 },
];

const invoicesConfig = {
  nfe: { label: "NF-e", color: "var(--chart-1)" },
  nfse: { label: "NFS-e", color: "var(--chart-2)" },
} satisfies ChartConfig;

type InvoiceType = "todas" | "nfe" | "nfse";

/**
 * A chart panel: help in the ⓘ popover, the last update, a type filter in
 * the toolbar and the period total as a `Stat` above the chart.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [type, setType] = React.useState<InvoiceType>("todas");
    const series = type === "todas" ? (["nfe", "nfse"] as const) : ([type] as const);
    const total = INVOICES.reduce(
      (sum, month) => sum + series.reduce((acc, key) => acc + month[key], 0),
      0,
    );
    return (
      <DashboardCard i18n={ptBR} className="max-w-2xl">
        <DashboardCardHeader
          icon={<FilesIcon />}
          title="Notas emitidas"
          help="Quantidade mensal de notas fiscais emitidas pelos seus clientes, por tipo."
          updatedAt={UPDATED_AT}
          toolbar={
            <Select
              aria-label="Tipo de nota"
              selectedKey={type}
              onSelectionChange={(key) => setType(key as InvoiceType)}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="todas">Todas</SelectItem>
                <SelectItem id="nfe">NF-e</SelectItem>
                <SelectItem id="nfse">NFS-e</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <DashboardCardBody className="gap-4">
          <Stat>
            <StatLabel>Total no semestre</StatLabel>
            <StatValue>{total.toLocaleString("pt-BR")}</StatValue>
          </Stat>
          <ChartContainer config={invoicesConfig} className="aspect-auto h-56 w-full">
            <BarChart accessibilityLayer data={INVOICES}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {series.map((key) => (
                <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} />
              ))}
            </BarChart>
          </ChartContainer>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Notas emitidas", level: 2 })).toBeVisible();
    await expect(canvas.getByText(/^Atualizado em /)).toBeInTheDocument();
    await expect(canvas.getByText("1.996")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Mais informações" }));
    await waitFor(() => expect(body.getByText(/Quantidade mensal/)).toBeVisible());
    await userEvent.keyboard("{Escape}");

    await userEvent.click(canvas.getByRole("button", { name: /Tipo de nota/ }));
    await userEvent.click(await body.findByRole("option", { name: "NFS-e" }));
    await expect(canvas.getByText("772")).toBeInTheDocument();
  },
};

type BodyState = "loading" | "error" | "empty" | "ready";

const retry = fn();

/**
 * The body swaps itself for loading, error (with "Tentar novamente") or
 * empty; with data, it shows its children.
 */
export const States: Story = {
  decorators: [
    (Story) => {
      retry.mockClear();
      return <Story />;
    },
  ],
  render: function StatesExample() {
    const [state, setState] = React.useState<BodyState>("loading");
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <ToggleGroup
          aria-label="Estado"
          variant="outline"
          size="sm"
          disallowEmptySelection
          selectedKeys={[state]}
          onSelectionChange={(keys) => setState([...keys][0] as BodyState)}
        >
          <ToggleGroupItem id="loading">Carregando</ToggleGroupItem>
          <ToggleGroupItem id="error">Erro</ToggleGroupItem>
          <ToggleGroupItem id="empty">Vazio</ToggleGroupItem>
          <ToggleGroupItem id="ready">Com dados</ToggleGroupItem>
        </ToggleGroup>
        <DashboardCard i18n={ptBR} className="w-full">
          <DashboardCardHeader icon={<FileTextIcon />} title="Últimas notas emitidas" />
          <DashboardCardBody
            isLoading={state === "loading"}
            isError={state === "error"}
            isEmpty={state === "empty"}
            onRetry={retry}
            className="min-h-56"
          >
            <p className="text-sm">12 notas emitidas hoje.</p>
          </DashboardCardBody>
        </DashboardCard>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Carregando", { selector: ".sr-only" })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("radio", { name: "Erro" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent("Não foi possível carregar os dados");
    await userEvent.click(canvas.getByRole("button", { name: "Tentar novamente" }));
    await expect(retry).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole("radio", { name: "Vazio" }));
    await expect(canvas.getByText("Nenhum dado")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("radio", { name: "Com dados" }));
    await expect(canvas.getByText("12 notas emitidas hoje.")).toBeInTheDocument();
  },
};

const DAS = [
  { client: "João Silva MEI", due: "20/10/2026", amount: "R$ 75,90", overdue: false },
  { client: "Ana Costa MEI", due: "20/10/2026", amount: "R$ 75,90", overdue: false },
  { client: "Oficina Duas Rodas", due: "20/09/2026", amount: "R$ 80,90", overdue: true },
];

/**
 * A table panel with its own refresh: while it refetches, the spinner sits
 * next to the date and the table stays on screen.
 */
export const Refreshing: Story = {
  render: function RefreshingExample() {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [updatedAt, setUpdatedAt] = React.useState(UPDATED_AT);

    function refresh() {
      setIsRefreshing(true);
      setTimeout(() => {
        setUpdatedAt(new Date(updatedAt.getTime() + 5 * 60_000));
        setIsRefreshing(false);
      }, 800);
    }

    return (
      <DashboardCard i18n={ptBR} className="max-w-2xl">
        <DashboardCardHeader
          icon={<FilesIcon />}
          title="DAS MEI a vencer"
          help="Guias DAS dos seus clientes MEI que vencem ou venceram neste mês."
          updatedAt={updatedAt}
          isRefreshing={isRefreshing}
          toolbar={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Atualizar"
              isDisabled={isRefreshing}
              onPress={refresh}
            >
              <RefreshCwIcon />
            </Button>
          }
        />
        <DashboardCardBody>
          <Table aria-label="DAS MEI a vencer">
            <TableHeader>
              <TableHead isRowHeader>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableHeader>
            <TableBody>
              {DAS.map((das) => (
                <TableRow key={das.client} id={das.client}>
                  <TableCell>{das.client}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {das.due}
                      {das.overdue && <Badge variant="destructive-light">Vencido</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{das.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Atualizar" }));
    await expect(canvas.getByRole("status", { name: "Atualizando" })).toBeInTheDocument();
    await expect(canvas.getByRole("grid", { name: "DAS MEI a vencer" })).toBeVisible();
    await waitFor(() =>
      expect(canvas.queryByRole("status", { name: "Atualizando" })).not.toBeInTheDocument(),
    );
  },
};

const PERIODS = [
  { id: "7", label: "Últimos 7 dias" },
  { id: "30", label: "Últimos 30 dias" },
  { id: "90", label: "Últimos 90 dias" },
];

/**
 * The cashback page: a period summary with several figures and the period
 * picker in the toolbar, next to the balance highlighted with `size="lg"`, a
 * warning and the action in the footer.
 */
export const WithStats: Story = {
  render: function WithStatsExample() {
    const [period, setPeriod] = React.useState("30");
    return (
      <div className="flex max-w-5xl flex-col gap-4 xl:flex-row">
        <DashboardCard i18n={ptBR} className="grow">
          <DashboardCardHeader
            title="Resumo do período"
            description="Movimentações de cashback"
            toolbar={
              <Select
                aria-label="Período"
                selectedKey={period}
                onSelectionChange={(key) => setPeriod(String(key))}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((item) => (
                    <SelectItem key={item.id} id={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <DashboardCardBody>
            <StatGrid i18n={statPtBR}>
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
          </DashboardCardBody>
        </DashboardCard>
        <DashboardCard i18n={ptBR} className="xl:w-80">
          <DashboardCardHeader
            icon={<WalletIcon />}
            title="Saldo disponível"
            description="Pronto para uso imediato"
            updatedAt={UPDATED_AT}
          />
          <DashboardCardBody className="gap-3">
            <Stat size="lg">
              <StatLabel className="sr-only">Saldo</StatLabel>
              <StatValue>R$ 1.365,00</StatValue>
            </Stat>
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>R$ 120,00 expiram em 5 dias</AlertTitle>
            </Alert>
          </DashboardCardBody>
          <CardFooter>
            <Button className="w-full">
              Usar cashback
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </CardFooter>
        </DashboardCard>
      </div>
    );
  },
};
