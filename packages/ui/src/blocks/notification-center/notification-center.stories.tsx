import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, ReceiptIcon, ShieldAlertIcon } from "lucide-react";
import * as React from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ConfirmDialog } from "@/core/confirm-dialog/confirm-dialog";
import { IconTile } from "@/core/icon-tile/icon-tile";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/core/pagination/pagination";
import { useDialogPromise } from "@/hooks/use-dialog-promise";
import meta from "./meta.json";
import {
  type NotificationData,
  type NotificationI18n,
  NotificationList,
  NotificationMenu,
} from "./notification-center";

/** pt-BR locale for the dates, and an in-memory router so links don't leave the story. */
const withEnvironment: Decorator = (Story) => (
  <I18nProvider locale="pt-BR">
    <RouterProvider navigate={fn()}>
      <Story />
    </RouterProvider>
  </I18nProvider>
);

const componentMeta = {
  title: "blocks/NotificationCenter",
  component: NotificationMenu,
  tags: ["autodocs"],
  decorators: [withEnvironment],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { notifications: [] },
} satisfies Meta<typeof NotificationMenu>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

const ptBR: NotificationI18n = {
  labels: {
    title: "Notificações",
    trigger: (unread) =>
      unread === 0
        ? "Notificações, nenhuma não lida"
        : `Notificações, ${unread} ${unread === 1 ? "não lida" : "não lidas"}`,
    unread: "Não lida",
    read: "Lida",
    markAsRead: "Marcar como lida",
    markAllAsRead: "Marcar todas como lidas",
    delete: "Apagar",
    empty: "Nenhuma notificação",
    emptyDescription: "Você está em dia.",
    loading: "Carregando notificações…",
    viewAll: "Ver todas as notificações",
  },
};

const initialNotifications: NotificationData[] = [
  {
    id: "1",
    title: "Certificado digital vence em 7 dias",
    message: "Renove o certificado A1 da Padaria Pão Quente para continuar emitindo notas.",
    date: new Date("2026-10-19T13:20:00Z"),
    href: "/certificados",
  },
  {
    id: "2",
    title: "Fatura de outubro disponível",
    message: "A fatura vence em 25/10. Pague por boleto ou Pix.",
    date: new Date("2026-10-18T09:05:00Z"),
  },
  {
    id: "3",
    title: "Nova versão do emissor",
    message: "Agora dá para duplicar notas fiscais de serviço com um clique.",
    date: new Date("2026-10-12T17:40:00Z"),
    isRead: true,
  },
];

/** Notifications held in state, with the actions the panel and the page call. */
function useNotifications(initial: NotificationData[]) {
  const [notifications, setNotifications] = React.useState(initial);
  return {
    notifications,
    markAsRead: (id: string) =>
      setNotifications((list) =>
        list.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      ),
    markAllAsRead: () =>
      setNotifications((list) => list.map((item) => ({ ...item, isRead: true }))),
    remove: (id: string) => setNotifications((list) => list.filter((item) => item.id !== id)),
  };
}

/**
 * The header bell: unread count in the indicator and in the button's name,
 * recent notifications with read/delete, "mark all" and a link to the page.
 */
export const Default: Story = {
  render: function DefaultExample() {
    const { notifications, markAsRead, markAllAsRead, remove } =
      useNotifications(initialNotifications);
    return (
      <NotificationMenu
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={remove}
        onOpen={(notification) => markAsRead(notification.id)}
        viewAllHref="/notificacoes"
        i18n={ptBR}
      />
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Notificações, 2 não lidas" }));
    const panel = await body.findByRole("dialog", { name: "Notificações" });
    const list = within(panel).getByRole("list", { name: "Notificações" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);

    const [markFirst] = within(panel).getAllByRole("button", { name: "Marcar como lida" });
    await expect(markFirst).toHaveAccessibleDescription("Certificado digital vence em 7 dias");
    await userEvent.click(markFirst as HTMLElement);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Notificações, 1 não lida" })).toBeVisible(),
    );

    const [deleteLast] = within(panel).getAllByRole("button", { name: "Apagar" }).slice(-1);
    await userEvent.click(deleteLast as HTMLElement);
    await waitFor(() => expect(within(list).getAllByRole("listitem")).toHaveLength(2));

    await userEvent.click(within(panel).getByRole("button", { name: "Marcar todas como lidas" }));
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Notificações, nenhuma não lida" }),
      ).toBeInTheDocument(),
    );
    await expect(
      within(panel).queryByRole("button", { name: "Marcar todas como lidas" }),
    ).not.toBeInTheDocument();

    await userEvent.click(within(panel).getByRole("link", { name: "Ver todas as notificações" }));
    await waitFor(() => expect(panel).not.toBeInTheDocument());
  },
};

/** An `icon` per notification replaces the unread dot; the title links to its subject. */
export const WithIcons: Story = {
  render: function WithIconsExample() {
    const { notifications, markAsRead, remove } = useNotifications([
      {
        id: "1",
        title: "Nota fiscal rejeitada",
        message: "A NFS-e 1.204 foi rejeitada pela prefeitura: código de serviço inválido.",
        date: new Date("2026-10-19T15:02:00Z"),
        href: "/notas/1204",
        icon: (
          <IconTile size="sm" variant="soft" className="text-destructive">
            <ShieldAlertIcon />
          </IconTile>
        ),
      },
      {
        id: "2",
        title: "Guia do DAS gerada",
        message: "A guia de outubro do MEI João Silva está pronta para pagamento.",
        date: new Date("2026-10-18T11:30:00Z"),
        href: "/das",
        icon: (
          <IconTile size="sm" variant="soft">
            <ReceiptIcon />
          </IconTile>
        ),
      },
      {
        id: "3",
        title: "Relatório mensal pronto",
        date: new Date("2026-10-01T08:00:00Z"),
        href: "/relatorios",
        isRead: true,
        icon: (
          <IconTile size="sm" variant="soft">
            <FileTextIcon />
          </IconTile>
        ),
      },
    ]);
    return (
      <NotificationMenu
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={remove}
        onOpen={(notification) => markAsRead(notification.id)}
        i18n={ptBR}
      />
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Notificações, 2 não lidas" }));
    const panel = await body.findByRole("dialog", { name: "Notificações" });
    await userEvent.click(within(panel).getByRole("link", { name: "Nota fiscal rejeitada" }));
    await waitFor(() => expect(panel).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Notificações, 1 não lida" })).toBeVisible();
  },
};

/** Nothing to show: the panel says so instead of an empty list. */
export const Empty: Story = {
  render: () => <NotificationMenu notifications={[]} viewAllHref="/notificacoes" i18n={ptBR} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Notificações, nenhuma não lida" }));
    const title = await body.findByText("Nenhuma notificação");
    await waitFor(() => expect(title).toBeVisible());
  },
};

/** Placeholders while the first page loads, announced to screen readers. */
export const Loading: Story = {
  render: () => <NotificationMenu notifications={[]} isLoading i18n={ptBR} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Notificações/ }));
    await expect(await body.findByRole("status")).toHaveTextContent("Carregando notificações…");
  },
};

/**
 * The page with every notification: cards with status, full message and
 * actions, followed by `Pagination`.
 */
export const Page: Story = {
  parameters: { layout: "padded" },
  render: function PageExample() {
    const { notifications, markAsRead, remove } = useNotifications(initialNotifications);
    const [page, setPage] = React.useState(1);
    const pages = 3;
    return (
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <NotificationList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onDelete={remove}
          onOpen={(notification) => markAsRead(notification.id)}
          i18n={ptBR}
        />
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Anterior"
                aria-label="Página anterior"
                href={`?pagina=${page - 1}`}
                isDisabled={page === 1}
                onPress={() => setPage(page - 1)}
              />
            </PaginationItem>
            {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
              <PaginationItem key={number}>
                <PaginationLink
                  href={`?pagina=${number}`}
                  isActive={number === page}
                  onPress={() => setPage(number)}
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="Próxima"
                aria-label="Próxima página"
                href={`?pagina=${page + 1}`}
                isDisabled={page === pages}
                onPress={() => setPage(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  },
  play: async ({ canvas }) => {
    const list = canvas.getByRole("list", { name: "Notificações" });
    await expect(within(list).getAllByText("Não lida")).toHaveLength(2);
    const [markFirst] = canvas.getAllByRole("button", { name: "Marcar como lida" });
    await userEvent.click(markFirst as HTMLElement);
    await waitFor(() => expect(within(list).getAllByText("Não lida")).toHaveLength(1));
    await expect(within(list).getAllByText("Lida")).toHaveLength(2);
  },
};

/** The page while loading and when empty. */
export const PageStates: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid w-full max-w-3xl gap-6">
      <NotificationList notifications={[]} isLoading loadingCount={2} i18n={ptBR} />
      <NotificationList notifications={[]} i18n={ptBR} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("Carregando notificações…");
    await expect(canvas.getByText("Você está em dia.")).toBeVisible();
  },
};

/**
 * Urgent notifications interrupt with a `ConfirmDialog` (from
 * `useDialogPromise`) one at a time, until each is acknowledged.
 */
export const Urgent: Story = {
  render: function UrgentExample() {
    const { notifications, markAsRead, markAllAsRead, remove } = useNotifications([
      {
        id: "urgent-1",
        title: "Pagamento pendente",
        message: "Regularize a fatura de setembro para não ter a emissão de notas bloqueada.",
        date: new Date("2026-10-19T10:00:00Z"),
      },
      ...initialNotifications,
    ]);
    const urgentIds = React.useRef(new Set(["urgent-1"]));
    const notice = useDialogPromise<NotificationData>();
    const { open } = notice;

    React.useEffect(() => {
      const pending = notifications.find((item) => urgentIds.current.has(item.id) && !item.isRead);
      if (!pending) return;
      urgentIds.current.delete(pending.id);
      void open(pending).then((result) => {
        if (result.status === "confirmed") markAsRead(pending.id);
      });
    }, [notifications, open, markAsRead]);

    return (
      <>
        <NotificationMenu
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={remove}
          i18n={ptBR}
        />
        <ConfirmDialog
          controller={notice}
          title={(data) => data?.title}
          description={(data) => data?.message}
          confirmLabel="Marcar como lida"
          cancelLabel={null}
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    const dialog = await body.findByRole("alertdialog", { name: "Pagamento pendente" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Marcar como lida" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Notificações, 2 não lidas" })).toBeVisible();
  },
};
