import { type CalendarDate, parseDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BanIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/alert-dialog/alert-dialog";
import { Button } from "@/core/button/button";
import { DatePicker } from "@/core/date-picker/date-picker";
import { type DialogController, useDialogPromise } from "@/hooks/use-dialog-promise";
import { ConfirmDialog } from "./confirm-dialog";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/ConfirmDialog",
  component: ConfirmDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  // Each story renders its own controller; these only satisfy the required props.
  args: { controller: undefined as unknown as DialogController<unknown>, title: "" },
} satisfies Meta<typeof ConfirmDialog>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const body = within(document.body);

/** Ask, await, act: the promise says how the dialog ended. */
export const Default: Story = {
  render: function DefaultExample() {
    const block = useDialogPromise<{ name: string }>();
    const [status, setStatus] = React.useState("Ativo");

    async function handleBlock() {
      const result = await block.open({ name: "Padaria Pão Quente" });
      if (result.status === "confirmed") setStatus("Bloqueado");
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">Situação: {status}</p>
        <Button variant="outline" onPress={handleBlock}>
          Bloquear cliente
        </Button>
        <ConfirmDialog
          controller={block}
          tone="destructive"
          media={<BanIcon />}
          title={(data) => `Bloquear ${data?.name}?`}
          description="O cliente perde o acesso ao emissor de notas até ser reativado."
          confirmLabel="Bloquear"
          cancelLabel="Cancelar"
        />
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Bloquear cliente" }));
    const dialog = await body.findByRole("alertdialog", { name: "Bloquear Padaria Pão Quente?" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByText("Situação: Ativo")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Bloquear cliente" }));
    await userEvent.click(await body.findByRole("button", { name: "Bloquear" }));
    await waitFor(() => expect(canvas.getByText("Situação: Bloqueado")).toBeInTheDocument());
  },
};

/**
 * `onConfirm` runs with the dialog open: the button shows it's working, and a
 * failure keeps the dialog open with the error so the user can retry.
 */
export const AsyncConfirm: Story = {
  render: function AsyncConfirmExample() {
    const download = useDialogPromise();
    const attempts = React.useRef(0);

    async function generateGuide() {
      await new Promise((resolve) => setTimeout(resolve, 400));
      attempts.current += 1;
      if (attempts.current === 1) throw new Error("Serviço indisponível");
    }

    return (
      <>
        <Button variant="outline" onPress={() => download.open()}>
          Baixar DAS
        </Button>
        <ConfirmDialog
          controller={download}
          title="Gerar a guia do DAS?"
          description="A guia é gerada na Receita Federal e pode levar alguns segundos."
          confirmLabel="Gerar guia"
          cancelLabel="Cancelar"
          pendingLabel="Gerando…"
          onConfirm={generateGuide}
          errorMessage={(error) => `Não foi possível gerar a guia: ${(error as Error).message}.`}
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Baixar DAS" }));
    await userEvent.click(await body.findByRole("button", { name: "Gerar guia" }));
    await expect(await body.findByRole("alert")).toHaveTextContent("Serviço indisponível");
    await userEvent.click(body.getByRole("button", { name: "Gerar guia" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};

/** `cancelLabel={null}`: a notice with a single action. */
export const SingleAction: Story = {
  render: function SingleActionExample() {
    const notice = useDialogPromise();
    return (
      <>
        <Button variant="outline" onPress={() => notice.open()}>
          Comprar 70 notas
        </Button>
        <ConfirmDialog
          controller={notice}
          title="Quantidade indisponível"
          description="Há apenas 60 notas adicionais disponíveis no seu plano neste ciclo."
          confirmLabel="Entendi"
          cancelLabel={null}
        />
      </>
    );
  },
};

type DueDateData = { clientName: string; dueDate: CalendarDate };

/** A dialog of your own that collects and validates a value, as its own component. */
function UpdateDueDateDialog({
  controller,
}: {
  controller: DialogController<DueDateData, CalendarDate>;
}) {
  const { data, dialogProps, confirm, cancel } = controller;
  const [date, setDate] = React.useState<CalendarDate | null>(null);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (dialogProps.isOpen) {
      setDate(data?.dueDate ?? null);
      setError(undefined);
    }
  }, [dialogProps.isOpen, data]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return setError("Informe a data de vencimento.");
    void confirm(date);
  }

  return (
    <AlertDialog {...dialogProps}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Atualizar vencimento</AlertDialogTitle>
          <AlertDialogDescription>DAS MEI de {data?.clientName}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <DatePicker aria-label="Vencimento" value={date} onChange={setDate} isInvalid={!!error} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onPress={cancel}>Sair</AlertDialogCancel>
          <Button type="submit">Alterar</Button>
        </AlertDialogFooter>
      </form>
    </AlertDialog>
  );
}

/**
 * The same hook drives your own dialogs: `confirm(value)` resolves the
 * promise with it. Here the due date is validated before it's returned.
 */
export const CollectAValue: Story = {
  render: function CollectAValueExample() {
    const dueDate = useDialogPromise<DueDateData, CalendarDate>();
    const [saved, setSaved] = React.useState("2026-10-20");

    async function handleEdit() {
      const result = await dueDate.open({
        clientName: "Padaria Pão Quente",
        dueDate: parseDate(saved),
      });
      if (result.status === "confirmed") setSaved(result.value.toString());
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm">Vencimento: {saved}</p>
        <Button variant="outline" onPress={handleEdit}>
          Atualizar vencimento
        </Button>
        <UpdateDueDateDialog controller={dueDate} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Atualizar vencimento" }));
    await body.findByRole("alertdialog", { name: "Atualizar vencimento" });
    await userEvent.click(body.getByRole("button", { name: "Alterar" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
    await expect(canvas.getByText("Vencimento: 2026-10-20")).toBeInTheDocument();
  },
};
