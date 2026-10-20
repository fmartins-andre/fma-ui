import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRightIcon, RefreshCwIcon, UserPlusIcon } from "lucide-react";
import * as React from "react";
import { RouterProvider } from "react-aria-components";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/core/button/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { TabNav, TabNavItem } from "@/core/tab-nav/tab-nav";
import meta from "./meta.json";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderBreadcrumbs,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderNav,
  PageHeaderTitle,
} from "./page-header";

/** An in-memory router, so tab links switch the current page. */
const withRouter =
  (initial: string): Decorator =>
  (Story) => {
    const [path, setPath] = React.useState(initial);
    return (
      <RouterProvider navigate={setPath}>
        <CurrentPath.Provider value={path}>
          <Story />
        </CurrentPath.Provider>
      </RouterProvider>
    );
  };
const CurrentPath = React.createContext("/");
const useCurrentPath = () => React.useContext(CurrentPath);

const componentMeta = {
  title: "blocks/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof PageHeader>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A list page: title, description and the main action. */
export const Default: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderHeading>
          <PageHeaderTitle>Meus clientes</PageHeaderTitle>
          <PageHeaderDescription>
            Todos os clientes cadastrados na plataforma.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <Button variant="outline" size="icon" aria-label="Atualizar lista">
            <RefreshCwIcon />
          </Button>
          <Button>
            <UserPlusIcon />
            Cadastrar cliente
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>
    </PageHeader>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Meus clientes" })).toBeVisible();
  },
};

/**
 * A record page: breadcrumbs back to the list, a status beside the title,
 * an action, and the record's sub-pages as tabs.
 */
export const WithNavigation: Story = {
  decorators: [withRouter("/clientes/42/info")],
  render: function WithNavigationExample() {
    const currentPath = useCurrentPath();
    return (
      <PageHeader>
        <PageHeaderBreadcrumbs
          aria-label="Navegação estrutural"
          items={[{ label: "Meus clientes", href: "/clientes" }, { label: "Padaria Pão Quente" }]}
        />
        <PageHeaderContent>
          <PageHeaderHeading className="sm:flex-row sm:items-center sm:gap-3">
            <PageHeaderTitle>Padaria Pão Quente</PageHeaderTitle>
            <Select aria-label="Situação" defaultValue="ativo" className="w-36">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="ativo">Ativo</SelectItem>
                <SelectItem id="bloqueado">Bloqueado</SelectItem>
                <SelectItem id="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </PageHeaderHeading>
          <PageHeaderActions>
            <Button>
              Acessar emissor de notas
              <ChevronRightIcon />
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <PageHeaderNav>
          <TabNav aria-label="Seções do cliente" currentHref={currentPath}>
            <TabNavItem href="/clientes/42/info">Informações</TabNavItem>
            <TabNavItem href="/clientes/42/inscricoes-estaduais">Inscrições estaduais</TabNavItem>
            <TabNavItem href="/clientes/42/modulos">Módulos</TabNavItem>
            <TabNavItem href="/clientes/42/certificado-digital">Certificado digital</TabNavItem>
            <TabNavItem href="/clientes/42/notas-fiscais">Notas fiscais</TabNavItem>
            <TabNavItem href="/clientes/42/das-mei">DAS MEI</TabNavItem>
          </TabNav>
        </PageHeaderNav>
      </PageHeader>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trail = canvas.getByRole("navigation", { name: "Navegação estrutural" });
    await expect(within(trail).getByRole("link", { name: "Meus clientes" })).toBeVisible();
    const tabs = canvas.getByRole("navigation", { name: "Seções do cliente" });
    await expect(within(tabs).getByRole("link", { name: "Informações" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(within(tabs).getByRole("link", { name: "Módulos" }));
    await expect(within(tabs).getByRole("link", { name: "Módulos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/** While the record loads, the title is a skeleton. */
export const Loading: Story = {
  render: () => (
    <PageHeader>
      <PageHeaderBreadcrumbs
        items={[{ label: "Meus clientes", href: "/clientes" }, { label: "…" }]}
      />
      <PageHeaderContent>
        <PageHeaderHeading>
          <PageHeaderTitle isLoading />
        </PageHeaderHeading>
      </PageHeaderContent>
    </PageHeader>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveAttribute("aria-busy", "true");
  },
};
