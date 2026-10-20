import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowLeftIcon, HouseIcon, WrenchIcon } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button, LinkButton } from "@/core/button/button";
import { ErrorPage, Forbidden, NotFound, UnexpectedError } from "./error-pages";
import meta from "./meta.json";

const componentMeta = {
  title: "blocks/ErrorPages",
  component: UnexpectedError,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof UnexpectedError>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A route that doesn't exist, with the way back home. */
export const NotFoundPage: Story = {
  render: () => (
    <NotFound
      i18n={{
        labels: {
          title: "Página não encontrada",
          description: "A página que você procura não existe ou mudou de endereço.",
        },
      }}
      actions={
        <LinkButton href="/">
          <HouseIcon data-icon="inline-start" aria-hidden="true" />
          Voltar ao início
        </LinkButton>
      }
    />
  ),
};

/** The user has no permission for the page. */
export const ForbiddenPage: Story = {
  render: () => (
    <Forbidden
      i18n={{
        labels: {
          title: "Acesso negado",
          description:
            "Você não tem permissão para ver esta página. Peça acesso ao administrador da conta.",
        },
      }}
      actions={
        <>
          <LinkButton href="/" variant="outline">
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            Voltar
          </LinkButton>
          <LinkButton href="/suporte">Falar com o suporte</LinkButton>
        </>
      }
    />
  ),
};

/** An unexpected failure: try again, or open the details to copy them for support. */
export const UnexpectedErrorPage: Story = {
  args: { onRetry: fn() },
  render: (args) => (
    <UnexpectedError
      {...args}
      error={new TypeError("Cannot read properties of undefined (reading 'cnpj')")}
      i18n={{
        labels: {
          title: "Algo deu errado",
          description: "Houve um erro inesperado. Tente de novo; se continuar, fale com o suporte.",
          retry: "Tentar de novo",
          details: "Detalhes do erro",
          copy: "Copiar detalhes",
          copied: "Copiado",
        },
      }}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Tentar de novo" }));
    await expect(args.onRetry).toHaveBeenCalledOnce();

    const details = canvas.getByRole("button", { name: "Detalhes do erro" });
    await expect(details).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(details);
    await expect(details).toHaveAttribute("aria-expanded", "true");
    await expect(
      canvas.getByText(/Cannot read properties of undefined \(reading 'cnpj'\)/),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Copiar detalhes" })).toBeVisible();
  },
};

/** Inside the app's layout: the error fills the content area, the shell stays. */
export const Inline: Story = {
  render: () => (
    <div className="flex min-h-svh flex-col bg-muted/40 p-6">
      <div className="flex flex-1 flex-col rounded-xl bg-background ring-1 ring-foreground/10">
        <header className="border-b px-6 py-4 font-medium">Clientes</header>
        <UnexpectedError
          layout="inline"
          onRetry={() => window.location.reload()}
          i18n={{
            labels: {
              title: "Não foi possível carregar os clientes",
              description: "Verifique sua conexão e tente de novo.",
              retry: "Tentar de novo",
            },
          }}
        />
      </div>
    </div>
  ),
};

/** `ErrorPage` alone, for other cases: here, scheduled maintenance. */
export const Custom: Story = {
  render: () => (
    <ErrorPage
      icon={<WrenchIcon aria-hidden="true" />}
      code="503"
      title="Em manutenção"
      description="Estamos atualizando o sistema. Volte em alguns minutos."
      actions={
        <Button variant="outline" onPress={() => window.location.reload()}>
          Recarregar
        </Button>
      }
    />
  ),
};
