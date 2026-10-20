import { CalendarDate } from "@internationalized/date";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { I18nProvider, type RangeValue } from "react-aria-components";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { DateInput } from "@/core/date-field/date-field";
import {
  DatePickerContent,
  DatePickerTrigger,
  DateRangePicker,
} from "@/core/date-picker/date-picker";
import { FieldLabel } from "@/core/field/field";
import { InputGroup, InputGroupAddon } from "@/core/input-group/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { ToggleGroupItem } from "@/core/toggle-group/toggle-group";
import {
  type FilterChip,
  FilterChips,
  FilterQuickToggles,
  FilterRefresh,
  FilterSearch,
  FilterSheet,
  FilterToolbar,
  FilterToolbarActions,
  type FilterToolbarI18n,
} from "./filter-toolbar";
import meta from "./meta.json";

const withPtBR: Decorator = (Story) => (
  <I18nProvider locale="pt-BR">
    <Story />
  </I18nProvider>
);

const componentMeta = {
  title: "blocks/FilterToolbar",
  component: FilterToolbar,
  tags: ["autodocs"],
  decorators: [withPtBR],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof FilterToolbar>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

const ptBR: FilterToolbarI18n = {
  labels: {
    search: "Buscar",
    searchPlaceholder: "Buscar…",
    clearSearch: "Limpar busca",
    quickFilters: "Filtros rápidos",
    filters: "Filtros",
    filtersTrigger: (active) => (active > 0 ? `Filtros, ${active} ativos` : "Filtros"),
    filtersTitle: "Filtrar resultados",
    apply: "Aplicar",
    clear: "Limpar",
    activeFilters: "Filtros ativos",
    clearAll: "Limpar filtros",
    refresh: "Atualizar lista",
  },
};

type Client = {
  name: string;
  document: string;
  status: "ativo" | "bloqueado";
  regime: "mei" | "simples" | "presumido";
  modules: ("emissor" | "radar")[];
  createdAt: CalendarDate;
};

const CLIENTS: Client[] = [
  {
    name: "Padaria Pão Quente Ltda",
    document: "12.345.678/0001-90",
    status: "ativo",
    regime: "simples",
    modules: ["emissor", "radar"],
    createdAt: new CalendarDate(2026, 2, 10),
  },
  {
    name: "João Silva MEI",
    document: "45.987.321/0001-12",
    status: "ativo",
    regime: "mei",
    modules: ["emissor"],
    createdAt: new CalendarDate(2026, 5, 3),
  },
  {
    name: "Oficina Duas Rodas",
    document: "08.112.443/0001-55",
    status: "bloqueado",
    regime: "simples",
    modules: [],
    createdAt: new CalendarDate(2025, 11, 21),
  },
  {
    name: "Clínica Bem Estar S/A",
    document: "33.004.876/0001-07",
    status: "ativo",
    regime: "presumido",
    modules: ["radar"],
    createdAt: new CalendarDate(2026, 8, 18),
  },
  {
    name: "Maria Souza",
    document: "123.456.789-09",
    status: "ativo",
    regime: "mei",
    modules: [],
    createdAt: new CalendarDate(2026, 9, 1),
  },
];

const STATUS_LABELS = { ativo: "Ativo", bloqueado: "Bloqueado" };
const REGIME_LABELS = { mei: "MEI", simples: "Simples Nacional", presumido: "Lucro Presumido" };

/** What the app would keep in the route's search params. */
type ClientFilters = {
  search: string;
  modules: string[];
  status: keyof typeof STATUS_LABELS | null;
  regime: keyof typeof REGIME_LABELS | null;
  createdAt: RangeValue<CalendarDate> | null;
};

const NO_FILTERS: ClientFilters = {
  search: "",
  modules: [],
  status: null,
  regime: null,
  createdAt: null,
};

function applyFilters(clients: Client[], filters: ClientFilters) {
  const term = filters.search.toLowerCase();
  return clients.filter(
    (client) =>
      (!term || `${client.name} ${client.document}`.toLowerCase().includes(term)) &&
      filters.modules.every((module) =>
        module === "nenhum"
          ? client.modules.length === 0
          : client.modules.includes(module as "emissor" | "radar"),
      ) &&
      (!filters.status || client.status === filters.status) &&
      (!filters.regime || client.regime === filters.regime) &&
      (!filters.createdAt ||
        (client.createdAt.compare(filters.createdAt.start) >= 0 &&
          client.createdAt.compare(filters.createdAt.end) <= 0)),
  );
}

const formatDate = (date: CalendarDate) =>
  date.toDate("UTC").toLocaleDateString("pt-BR", { timeZone: "UTC" });

/** The applied advanced filters, formatted for the chips. */
function activeChips(filters: ClientFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.status) {
    chips.push({ id: "status", label: "Situação", value: STATUS_LABELS[filters.status] });
  }
  if (filters.regime) {
    chips.push({ id: "regime", label: "Regime", value: REGIME_LABELS[filters.regime] });
  }
  if (filters.createdAt) {
    const { start, end } = filters.createdAt;
    chips.push({
      id: "createdAt",
      label: "Cadastro",
      value: `${formatDate(start)} – ${formatDate(end)}`,
    });
  }
  return chips;
}

/** "Sem módulos" can't be combined with a module, and vice versa. */
function nextModules(previous: string[], selected: string[]) {
  const added = selected.filter((key) => !previous.includes(key));
  if (added.includes("nenhum")) return ["nenhum"];
  return added.length ? selected.filter((key) => key !== "nenhum") : selected;
}

/**
 * A customer list: search on Enter, module quick filters, the less frequent
 * filters in the sheet, removable chips and refresh. Every value maps to a
 * search param; the sheet edits a draft until "Aplicar".
 */
export const Default: Story = {
  render: function DefaultExample() {
    const [filters, setFilters] = React.useState(NO_FILTERS);
    const [draft, setDraft] = React.useState(NO_FILTERS);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const chips = activeChips(filters);
    const clients = applyFilters(CLIENTS, filters);

    function refresh() {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
    }

    return (
      <div className="flex w-full max-w-4xl flex-col gap-4">
        <FilterToolbar i18n={ptBR}>
          <FilterSearch
            value={filters.search}
            onChange={(search) => setFilters({ ...filters, search })}
            placeholder="Nome, CNPJ ou CPF"
            maxLength={120}
          />
          <FilterQuickToggles
            selectionMode="multiple"
            size="sm"
            selectedKeys={filters.modules}
            onSelectionChange={(keys) =>
              setFilters({
                ...filters,
                modules: nextModules(filters.modules, [...keys].map(String)),
              })
            }
          >
            <ToggleGroupItem id="emissor">Emissor</ToggleGroupItem>
            <ToggleGroupItem id="radar">Radar</ToggleGroupItem>
            <ToggleGroupItem id="nenhum">Sem módulos</ToggleGroupItem>
          </FilterQuickToggles>
          <FilterToolbarActions>
            <FilterSheet
              activeCount={chips.length}
              onOpenChange={(isOpen) => isOpen && setDraft(filters)}
              onApply={() => {
                setFilters({ ...filters, ...draft, search: filters.search });
                return undefined;
              }}
              onClear={() => setDraft({ ...draft, status: null, regime: null, createdAt: null })}
            >
              <Select
                placeholder="Todas"
                selectedKey={draft.status}
                onSelectionChange={(status) =>
                  setDraft({ ...draft, status: status as ClientFilters["status"] })
                }
                className="flex w-full flex-col gap-2"
              >
                <FieldLabel>Situação</FieldLabel>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id="ativo">Ativo</SelectItem>
                  <SelectItem id="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                placeholder="Todos"
                selectedKey={draft.regime}
                onSelectionChange={(regime) =>
                  setDraft({ ...draft, regime: regime as ClientFilters["regime"] })
                }
                className="flex w-full flex-col gap-2"
              >
                <FieldLabel>Regime tributário</FieldLabel>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id="mei">MEI</SelectItem>
                  <SelectItem id="simples">Simples Nacional</SelectItem>
                  <SelectItem id="presumido">Lucro Presumido</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker
                value={draft.createdAt}
                onChange={(createdAt) =>
                  setDraft({
                    ...draft,
                    createdAt: createdAt as RangeValue<CalendarDate> | null,
                  })
                }
              >
                <FieldLabel>Data de cadastro</FieldLabel>
                <InputGroup>
                  <DateInput slot="start" />
                  <span aria-hidden="true" className="text-muted-foreground">
                    –
                  </span>
                  <DateInput slot="end" />
                  <InputGroupAddon align="inline-end" className="ml-auto">
                    <DatePickerTrigger />
                  </InputGroupAddon>
                </InputGroup>
                <DatePickerContent />
              </DateRangePicker>
            </FilterSheet>
            <FilterRefresh onRefresh={refresh} isPending={isRefreshing} />
          </FilterToolbarActions>
          <FilterChips
            items={chips}
            onRemove={(id) => setFilters({ ...filters, [id]: null })}
            onClearAll={() => setFilters(NO_FILTERS)}
          />
        </FilterToolbar>
        <p className="text-sm text-muted-foreground">{clients.length} clientes</p>
        <ul className="divide-y rounded-lg border">
          {clients.map((client) => (
            <li key={client.document} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{client.name}</span>
                <span className="text-sm text-muted-foreground">{client.document}</span>
              </div>
              <Badge variant={client.status === "ativo" ? "success-dot" : "destructive-dot"}>
                {STATUS_LABELS[client.status]}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const count = () => canvas.getByText(/\d+ clientes/);
    await expect(count()).toHaveTextContent("5 clientes");

    // Typing alone doesn't search; Enter does.
    const search = canvas.getByRole("searchbox", { name: "Buscar" });
    await userEvent.type(search, "padaria");
    await expect(count()).toHaveTextContent("5 clientes");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(count()).toHaveTextContent("1 clientes"));
    await userEvent.click(canvas.getByRole("button", { name: "Limpar busca" }));
    await waitFor(() => expect(count()).toHaveTextContent("5 clientes"));

    // "Sem módulos" excludes the modules.
    await userEvent.click(canvas.getByRole("button", { name: "Emissor" }));
    await waitFor(() => expect(count()).toHaveTextContent("2 clientes"));
    await userEvent.click(canvas.getByRole("button", { name: "Sem módulos" }));
    await expect(canvas.getByRole("button", { name: "Emissor" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(count()).toHaveTextContent("2 clientes"));
    await userEvent.click(canvas.getByRole("button", { name: "Sem módulos" }));

    // The sheet edits a draft; "Aplicar" commits it and shows a chip.
    await userEvent.click(canvas.getByRole("button", { name: "Filtros" }));
    const sheet = await body.findByRole("dialog", { name: "Filtrar resultados" });
    // `size="md"`: 448px wide, not the default 384px.
    await expect(sheet.closest("[data-slot=sheet-content]")).toHaveAttribute("data-size", "md");
    await waitFor(() =>
      expect(sheet.closest("[data-slot=sheet-content]")?.getBoundingClientRect().width).toBe(448),
    );
    await userEvent.click(within(sheet).getByRole("button", { name: /Situação/ }));
    await userEvent.click(await body.findByRole("option", { name: "Bloqueado" }));
    await userEvent.click(within(sheet).getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(sheet).not.toBeInTheDocument());
    await expect(count()).toHaveTextContent("1 clientes");
    await expect(canvas.getByRole("button", { name: "Filtros, 1 ativos" })).toBeVisible();

    const chips = canvas.getByRole("grid", { name: "Filtros ativos" });
    await expect(within(chips).getByRole("row", { name: /Situação: Bloqueado/ })).toBeVisible();
    await userEvent.click(within(chips).getByRole("button", { name: /Remov/ }));
    await waitFor(() => expect(count()).toHaveTextContent("5 clientes"));
    await expect(canvas.queryByRole("grid", { name: "Filtros ativos" })).not.toBeInTheDocument();
  },
};

/** With `debounceMs`, the search also fires a moment after the user stops typing. */
export const DebouncedSearch: Story = {
  render: function DebouncedSearchExample() {
    const [search, setSearch] = React.useState("");
    const clients = applyFilters(CLIENTS, { ...NO_FILTERS, search });
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <FilterToolbar i18n={ptBR}>
          <FilterSearch value={search} onChange={setSearch} debounceMs={300} />
        </FilterToolbar>
        <ul className="text-sm">
          {clients.map((client) => (
            <li key={client.document}>{client.name}</li>
          ))}
        </ul>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole("searchbox", { name: "Buscar" }), "maria");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(1));
    await expect(canvas.getByText("Maria Souza")).toBeVisible();
  },
};

/** Applied filters without the sheet: chips can come from anywhere (e.g. a column filter). */
export const Chips: Story = {
  render: function ChipsExample() {
    const [chips, setChips] = React.useState<FilterChip[]>([
      { id: "status", label: "Situação", value: "Ativo" },
      { id: "regime", label: "Regime", value: "MEI" },
      { id: "uf", label: "UF", value: "SP" },
    ]);
    return (
      <FilterToolbar i18n={ptBR}>
        <FilterChips
          items={chips}
          onRemove={(id) => setChips(chips.filter((chip) => chip.id !== id))}
          onClearAll={() => setChips([])}
        />
      </FilterToolbar>
    );
  },
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid", { name: "Filtros ativos" });
    await userEvent.click(within(grid).getByRole("row", { name: /Regime: MEI/ }));
    await userEvent.keyboard("{Backspace}");
    await waitFor(() => expect(within(grid).getAllByRole("row")).toHaveLength(2));
    await userEvent.click(canvas.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(grid).not.toBeInTheDocument());
  },
};
