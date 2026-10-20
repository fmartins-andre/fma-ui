import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon, CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "@/core/badge/badge";
import { Checkbox } from "@/core/checkbox/checkbox";
import { EmptyMedia } from "@/core/empty/empty";
import { Field, FieldError } from "@/core/field/field";
import { Label } from "@/core/label/label";
import { Progress } from "@/core/progress/progress";
import { Spinner } from "@/core/spinner/spinner";
import {
  Timeline,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/core/timeline/timeline";
import { type DialogController, useDialogPromise } from "@/hooks/use-dialog-promise";
import { Button, LinkButton } from "../button/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  // `render` builds its own JSX children below — this placeholder only
  // satisfies Dialog's required `children` prop type for CSF3.
  args: { children: null },
  render: (args) => (
    <DialogTrigger>
      <Button variant="outline">Open</Button>
      <Dialog {...args}>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button>Continue</Button>
        </DialogFooter>
      </Dialog>
    </DialogTrigger>
  ),
} satisfies Meta<typeof Dialog>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const NoCloseButton: Story = {
  args: { showCloseButton: false },
};

export const OpensAndClosesWithCancel: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvasBody.findByRole("button", { name: /open/i }));
    expect(await canvasBody.findByRole("dialog")).toBeInTheDocument();

    await userEvent.click(await canvasBody.findByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(canvasBody.queryByRole("dialog")).not.toBeInTheDocument();
    });
  },
};

export const OpensAndClosesWithX: Story = {
  play: async ({ canvasElement }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvasBody.findByRole("button", { name: /open/i }));
    expect(await canvasBody.findByRole("dialog")).toBeInTheDocument();

    await userEvent.click(await canvasBody.findByRole("button", { name: /close/i }));
    await waitFor(() => {
      expect(canvasBody.queryByRole("dialog")).not.toBeInTheDocument();
    });
  },
};

type Receipt = { id: string; customer: string; amount: string; deadlinePassed: boolean };

const RECEIPTS: Receipt[] = [
  { id: "1042", customer: "Mercado Silva", amount: "R$ 189,90", deadlinePassed: false },
  { id: "0987", customer: "Padaria Pão Quente", amount: "R$ 42,00", deadlinePassed: true },
];

const CANCEL_STEPS = ["Conferir o prazo", "Estornar na maquininha", "Atualizar o recebimento"];

/** Stands in for the app's API: reports each step and fails past the deadline. */
async function cancelReceipt(receipt: Receipt, onStep: (step: number) => void) {
  for (const [index] of CANCEL_STEPS.entries()) {
    onStep(index + 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (index === 0 && receipt.deadlinePassed) {
      throw new Error("O prazo para cancelar esta venda terminou em 12/10/2026.");
    }
  }
}

type Phase = "confirm" | "processing" | "success" | "error";

function CancelReceiptDialog({ controller }: { controller: DialogController<Receipt> }) {
  const receipt = controller.data;
  const [phase, setPhase] = React.useState<Phase>("confirm");
  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);
  const [showAcceptError, setShowAcceptError] = React.useState(false);
  const acceptRef = React.useRef<HTMLInputElement>(null);

  // Every open starts over.
  React.useEffect(() => {
    if (!controller.isOpen) return;
    setPhase("confirm");
    setStep(0);
    setAccepted(false);
    setShowAcceptError(false);
  }, [controller.isOpen]);

  async function run() {
    if (!receipt) return;
    if (!accepted) {
      setShowAcceptError(true);
      acceptRef.current?.focus();
      return;
    }
    setPhase("processing");
    try {
      await cancelReceipt(receipt, setStep);
      setPhase("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setPhase("error");
    }
  }

  const announcement = {
    confirm: "",
    processing: "Cancelando o recebimento.",
    success: "Recebimento cancelado.",
    error: `Não foi possível cancelar o recebimento. ${error}`,
  }[phase];

  return (
    <Dialog
      {...controller.dialogProps}
      // Nothing closes it while the cancellation runs.
      isDismissable={phase !== "processing"}
      isKeyboardDismissDisabled={phase === "processing"}
      showCloseButton={phase !== "processing"}
    >
      <span role="status" className="sr-only">
        {announcement}
      </span>

      {phase === "confirm" && (
        <>
          <DialogHeader>
            <DialogTitle>Cancelar recebimento #{receipt?.id}</DialogTitle>
            <DialogDescription>
              {receipt?.amount} volta para {receipt?.customer} pela maquininha.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={showAcceptError}>
            <div className="flex items-start gap-2">
              <Checkbox
                id="cancel-receipt-accept"
                inputRef={acceptRef}
                isSelected={accepted}
                onChange={(isSelected) => {
                  setAccepted(isSelected);
                  if (isSelected) setShowAcceptError(false);
                }}
                isInvalid={showAcceptError}
                aria-describedby={showAcceptError ? "cancel-receipt-accept-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="cancel-receipt-accept" className="font-normal">
                Entendo que o cancelamento não pode ser desfeito.
              </Label>
            </div>
            {showAcceptError && (
              <FieldError id="cancel-receipt-accept-error">
                Confirme que entendeu para continuar.
              </FieldError>
            )}
          </Field>
          <DialogFooter>
            <Button variant="outline" onPress={controller.cancel}>
              Voltar
            </Button>
            <Button variant="destructive" onPress={run}>
              Cancelar recebimento
            </Button>
          </DialogFooter>
        </>
      )}

      {phase === "processing" && (
        <>
          <DialogHeader>
            <DialogTitle>Cancelando recebimento #{receipt?.id}</DialogTitle>
            <DialogDescription>Isso leva alguns segundos. Não feche esta janela.</DialogDescription>
          </DialogHeader>
          <Progress
            aria-label="Progresso do cancelamento"
            value={((step - 1) / CANCEL_STEPS.length) * 100}
            className="[&_[data-slot=progress-indicator]]:motion-reduce:transition-none"
          />
          <Timeline value={step}>
            {CANCEL_STEPS.map((title, index) => {
              const current = index + 1;
              return (
                <TimelineItem key={title} step={current}>
                  <TimelineIndicator className="flex items-center justify-center">
                    {current < step && <CheckIcon className="size-2.5" />}
                    {current === step && (
                      <Spinner aria-hidden="true" className="size-3 motion-reduce:animate-none" />
                    )}
                  </TimelineIndicator>
                  <TimelineSeparator />
                  <TimelineHeader>
                    <TimelineTitle>
                      {title}
                      <span className="sr-only">
                        {current < step
                          ? ", concluída"
                          : current === step
                            ? ", em andamento"
                            : ", pendente"}
                      </span>
                    </TimelineTitle>
                  </TimelineHeader>
                </TimelineItem>
              );
            })}
          </Timeline>
        </>
      )}

      {phase === "success" && (
        <>
          <DialogHeader className="items-center text-center">
            <EmptyMedia variant="icon">
              <CircleCheckIcon className="text-success" />
            </EmptyMedia>
            <DialogTitle>Recebimento cancelado</DialogTitle>
            <DialogDescription>
              {receipt?.amount} volta para {receipt?.customer} em até 2 dias úteis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onPress={() => controller.confirm()}>Concluir</Button>
          </DialogFooter>
        </>
      )}

      {phase === "error" && (
        <>
          <DialogHeader className="items-center text-center">
            <EmptyMedia variant="icon">
              <CircleAlertIcon className="text-destructive" />
            </EmptyMedia>
            <DialogTitle>Não foi possível cancelar</DialogTitle>
            <DialogDescription>
              {error} O estorno ainda pode ser pedido ao suporte, que devolve o valor por Pix.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={controller.cancel}>
              Fechar
            </Button>
            <LinkButton href="https://example.com/suporte/estorno" target="_blank">
              Pedir estorno ao suporte
            </LinkButton>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}

/**
 * A dialog in phases — confirm, processing, then success or error — driven by
 * `useDialogPromise`. Confirming needs the acceptance (the button stays
 * enabled and points to it); while it runs, the steps show done, current and
 * pending and nothing closes the dialog; each phase is announced from a status
 * region. The error offers another way out. No gradients, and the motion
 * stops with `prefers-reduced-motion`.
 */
export const Phases: Story = {
  render: function PhasesExample() {
    const cancel = useDialogPromise<Receipt>();
    const [cancelled, setCancelled] = React.useState<string[]>([]);

    async function handleCancel(receipt: Receipt) {
      const result = await cancel.open(receipt);
      if (result.status === "confirmed") setCancelled((ids) => [...ids, receipt.id]);
    }

    return (
      <div className="flex w-96 flex-col gap-2">
        {RECEIPTS.map((receipt) => (
          <div
            key={receipt.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"
          >
            <span>
              #{receipt.id} · {receipt.customer} · {receipt.amount}
            </span>
            {cancelled.includes(receipt.id) ? (
              <Badge variant="muted">Cancelado</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                aria-label={`Cancelar recebimento #${receipt.id}`}
                onPress={() => handleCancel(receipt)}
              >
                Cancelar
              </Button>
            )}
          </div>
        ))}
        <CancelReceiptDialog controller={cancel} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const body = within(document.body);
    const status = () => body.getByRole("dialog").querySelector("[role=status]");

    await userEvent.click(canvas.getByRole("button", { name: "Cancelar recebimento #1042" }));
    await body.findByRole("dialog", { name: "Cancelar recebimento #1042" });
    await userEvent.click(body.getByRole("button", { name: "Cancelar recebimento" }));
    await expect(body.getByText("Confirme que entendeu para continuar.")).toBeVisible();
    await expect(body.getByRole("checkbox")).toHaveFocus();

    await userEvent.click(body.getByRole("checkbox"));
    await userEvent.click(body.getByRole("button", { name: "Cancelar recebimento" }));
    await expect(await body.findByRole("dialog", { name: /Cancelando/ })).toBeVisible();
    await expect(status()).toHaveTextContent("Cancelando o recebimento.");
    await expect(body.getByRole("listitem", { current: "step" })).toBeVisible();

    await body.findByRole("dialog", { name: "Recebimento cancelado" }, { timeout: 3000 });
    await expect(status()).toHaveTextContent("Recebimento cancelado.");
    await userEvent.click(body.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByText("Cancelado")).toBeVisible();

    // Past the deadline: the error offers another way out.
    await userEvent.click(canvas.getByRole("button", { name: "Cancelar recebimento #0987" }));
    await userEvent.click(await body.findByRole("checkbox"));
    await userEvent.click(body.getByRole("button", { name: "Cancelar recebimento" }));
    await body.findByRole("dialog", { name: "Não foi possível cancelar" }, { timeout: 3000 });
    await expect(status()).toHaveTextContent(/prazo para cancelar/);
    await expect(body.getByRole("link", { name: "Pedir estorno ao suporte" })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Cancelar recebimento #0987" })).toBeVisible();
  },
};
