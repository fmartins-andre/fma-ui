import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as z from "zod";
import { Button } from "@/core/button/button";
import { Field, FieldError, FieldLabel } from "@/core/field/field";
import { Input } from "@/core/input/input";
import { MaskedInput } from "@/core/masked-input/masked-input";
import { NativeSelect, NativeSelectOption } from "@/core/native-select/native-select";
import {
  CollectionField,
  type CollectionFieldI18n,
  CollectionFieldItem,
  CollectionFieldSummary,
  CollectionFieldSummaryItem,
} from "./collection-field";
import meta from "./meta.json";

const componentMeta = {
  title: "blocks/CollectionField",
  component: CollectionField,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
  args: { label: "", itemCount: 0, onAdd: () => {}, addLabel: "" },
} satisfies Meta<typeof CollectionField>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const PT_BR: CollectionFieldI18n = {
  labels: {
    remove: (item) => `Remover ${item.toLocaleLowerCase("pt-BR")}`,
    removeText: "Remover",
    added: (item) => `${item} adicionado`,
    removed: (item) => `${item} removido`,
    maxReached: (max) => `Até ${max} itens.`,
    empty: "Nada adicionado ainda.",
  },
};

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const INVOICE_TOTAL = 150;

const paymentsSchema = z
  .object({
    payments: z.array(
      z.object({
        method: z.string().min(1, "Escolha a forma."),
        amount: z.string().refine((value) => Number(value) > 0, "Informe o valor."),
      }),
    ),
  })
  .refine(
    ({ payments }) =>
      Math.abs(payments.reduce((sum, item) => sum + Number(item.amount || 0), 0) - INVOICE_TOTAL) <
      0.005,
    { path: ["payments"], message: "As formas de pagamento precisam somar o total da nota." },
  );

type PaymentsValues = z.infer<typeof paymentsSchema>;

const issueInvoice = fn((_values: PaymentsValues) => {});

function PaymentsForm() {
  const form = useForm<PaymentsValues>({
    resolver: zodResolver(paymentsSchema),
    defaultValues: { payments: [{ method: "pix", amount: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "payments" });
  const payments = form.watch("payments");
  const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = Math.round((INVOICE_TOTAL - paid) * 100) / 100;
  const listError = form.formState.errors.payments;

  return (
    <form
      onSubmit={form.handleSubmit(issueInvoice)}
      className="flex w-full max-w-[30rem] flex-col gap-4"
      noValidate
    >
      <CollectionField
        i18n={{
          labels: {
            ...PT_BR.labels,
            added: (item) => `${item} adicionada`,
            removed: (item) => `${item} removida`,
          },
        }}
        label="Formas de pagamento"
        itemCount={fields.length}
        minItems={1}
        maxItems={4}
        // A new method starts with what is left to pay.
        onAdd={() => append({ method: "", amount: remaining > 0 ? remaining.toFixed(2) : "" })}
        addLabel="Adicionar forma"
        error={listError?.message ?? listError?.root?.message}
        summary={
          <CollectionFieldSummary>
            <CollectionFieldSummaryItem label="Total da nota" value={brl(INVOICE_TOTAL)} />
            <CollectionFieldSummaryItem label="Pago" value={brl(paid)} />
            <CollectionFieldSummaryItem
              label="Restante"
              value={
                remaining > 0
                  ? `Faltam ${brl(remaining)}`
                  : remaining < 0
                    ? `${brl(-remaining)} a mais`
                    : "Valor fechado"
              }
              isEmphasized
            />
          </CollectionFieldSummary>
        }
      >
        {fields.map((item, index) => (
          <CollectionFieldItem
            key={item.id}
            label={`Forma de pagamento ${index + 1}`}
            onRemove={() => remove(index)}
          >
            <Controller
              control={form.control}
              name={`payments.${index}.method`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:w-44">
                  <FieldLabel htmlFor={`${item.id}-method`}>Forma</FieldLabel>
                  <NativeSelect
                    id={`${item.id}-method`}
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                    {...field}
                  >
                    <NativeSelectOption value="">Escolha</NativeSelectOption>
                    <NativeSelectOption value="pix">Pix</NativeSelectOption>
                    <NativeSelectOption value="cash">Dinheiro</NativeSelectOption>
                    <NativeSelectOption value="card">Cartão</NativeSelectOption>
                  </NativeSelect>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name={`payments.${index}.amount`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-1">
                  <FieldLabel htmlFor={`${item.id}-amount`}>Valor</FieldLabel>
                  <MaskedInput
                    id={`${item.id}-amount`}
                    mask={{ type: "decimal", prefix: "R$ " }}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CollectionFieldItem>
        ))}
      </CollectionField>
      <Button type="submit" className="self-end">
        Emitir
      </Button>
    </form>
  );
}

/**
 * Payment methods of a sale (`row`, at least one): the summary says what is
 * paid and what is left, in words; a new method starts with what is left. The
 * list's own error comes from validating the sum.
 */
export const PaymentMethods: Story = {
  render: () => <PaymentsForm />,
  play: async ({ canvas }) => {
    const status = canvas.getByRole("status");
    const first = canvas.getByRole("group", { name: "Forma de pagamento 1" });
    // The minimum: the only method can't be removed.
    await expect(within(first).queryByRole("button", { name: /Remover/ })).toBeNull();

    await userEvent.type(within(first).getByLabelText("Valor"), "100");
    await expect(canvas.getByText("Faltam R$ 50,00")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Emitir" }));
    await expect(
      await canvas.findByText("As formas de pagamento precisam somar o total da nota."),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Adicionar forma" }));
    const second = canvas.getByRole("group", { name: "Forma de pagamento 2" });
    await expect(status).toHaveTextContent("Forma de pagamento 2 adicionada");
    await expect(within(second).getByLabelText("Forma")).toHaveFocus();
    await expect(within(second).getByLabelText("Valor")).toHaveValue("R$ 50,00");
    await expect(canvas.getByText("Valor fechado")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Remover forma de pagamento 2" }));
    await expect(status).toHaveTextContent("Forma de pagamento 2 removida");
    await expect(canvas.getByRole("button", { name: "Adicionar forma" })).toHaveFocus();
    await expect(issueInvoice).not.toHaveBeenCalled();
  },
};

const lotsSchema = z.object({
  lots: z.array(
    z.object({
      number: z.string().min(1, "Informe o número do lote."),
      quantity: z.string().regex(/^[1-9]\d*$/, "Informe a quantidade."),
      manufacturedAt: z.string(),
      expiresAt: z.string(),
    }),
  ),
});

type LotsValues = z.infer<typeof lotsSchema>;

const emptyLot = { number: "", quantity: "", manufacturedAt: "", expiresAt: "" };

function LotsForm() {
  const form = useForm<LotsValues>({
    resolver: zodResolver(lotsSchema),
    defaultValues: { lots: [emptyLot] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lots" });

  return (
    <form className="w-full max-w-[32rem]" noValidate>
      <CollectionField
        i18n={PT_BR}
        label="Rastreio"
        description="Lotes do produto, como impressos na embalagem."
        itemCount={fields.length}
        minItems={1}
        onAdd={() => append(emptyLot)}
        addLabel="Adicionar lote"
      >
        {fields.map((item, index) => (
          <CollectionFieldItem
            key={item.id}
            layout="group"
            label={`Lote ${index + 1}`}
            onRemove={() => remove(index)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name={`lots.${index}.number`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${item.id}-number`}>Número do lote</FieldLabel>
                    <Input id={`${item.id}-number`} aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name={`lots.${index}.quantity`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${item.id}-quantity`}>Quantidade</FieldLabel>
                    <Input
                      id={`${item.id}-quantity`}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name={`lots.${index}.manufacturedAt`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${item.id}-manufactured`}>Fabricação</FieldLabel>
                    <MaskedInput
                      id={`${item.id}-manufactured`}
                      mask="date"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name={`lots.${index}.expiresAt`}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${item.id}-expires`}>Validade</FieldLabel>
                    <MaskedInput
                      id={`${item.id}-expires`}
                      mask="date"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </Field>
                )}
              />
            </div>
          </CollectionFieldItem>
        ))}
      </CollectionField>
    </form>
  );
}

/**
 * Lots of an invoice item (`group`, starts with one): many fields per lot, so
 * each one is a fieldset with a visible numbered legend and a static border,
 * and stays apart from the next when the fields stack on a phone.
 */
export const Lots: Story = {
  render: () => <LotsForm />,
  play: async ({ canvas }) => {
    const first = canvas.getByRole("group", { name: "Lote 1" });
    await expect(within(first).queryByRole("button", { name: /Remover/ })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Adicionar lote" }));
    const second = canvas.getByRole("group", { name: "Lote 2" });
    await expect(within(second).getByLabelText("Número do lote")).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent("Lote 2 adicionado");

    // From two lots on, each can be removed; the button names its lot.
    await expect(canvas.getByRole("button", { name: "Remover lote 1" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Remover lote 2" }));
    await waitFor(() => expect(canvas.queryByRole("group", { name: "Lote 2" })).toBeNull());
    await expect(canvas.getByRole("status")).toHaveTextContent("Lote 2 removido");
  },
};

const recipientsSchema = z.object({
  recipients: z.array(z.object({ email: z.email("Informe um e-mail válido.") })),
});

type RecipientsValues = z.infer<typeof recipientsSchema>;

function RecipientsForm() {
  const form = useForm<RecipientsValues>({
    resolver: zodResolver(recipientsSchema),
    defaultValues: { recipients: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "recipients" });

  return (
    <form className="w-full max-w-[28rem]" noValidate>
      <CollectionField
        i18n={{ labels: { ...PT_BR.labels, maxReached: (max) => `Até ${max} destinatários.` } }}
        label="Enviar a nota também para"
        itemCount={fields.length}
        maxItems={3}
        onAdd={() => append({ email: "" })}
        addLabel="Adicionar e-mail"
        emptyMessage="A nota vai só para o e-mail do cliente."
      >
        {fields.map((item, index) => (
          <CollectionFieldItem
            key={item.id}
            label={`E-mail ${index + 1}`}
            onRemove={() => remove(index)}
          >
            <Controller
              control={form.control}
              name={`recipients.${index}.email`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-1">
                  <FieldLabel htmlFor={`${item.id}-email`} className="sr-only">
                    E-mail {index + 1}
                  </FieldLabel>
                  <Input
                    id={`${item.id}-email`}
                    type="email"
                    placeholder="nome@empresa.com.br"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CollectionFieldItem>
        ))}
      </CollectionField>
    </form>
  );
}

/**
 * Extra e-mail recipients (`row`, optional, at most three): empty, it says
 * what happens without any; at the limit the add button gives way to a note.
 */
export const Recipients: Story = {
  render: () => <RecipientsForm />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("A nota vai só para o e-mail do cliente.")).toBeVisible();
    const add = canvas.getByRole("button", { name: "Adicionar e-mail" });
    await userEvent.click(add);
    await expect(canvas.getByRole("textbox", { name: "E-mail 1" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Adicionar e-mail" }));
    await userEvent.click(canvas.getByRole("button", { name: "Adicionar e-mail" }));
    await expect(canvas.queryByRole("button", { name: "Adicionar e-mail" })).toBeNull();
    await expect(canvas.getByText("Até 3 destinatários.")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Remover e-mail 3" }));
    await expect(canvas.getByRole("button", { name: "Adicionar e-mail" })).toHaveFocus();
  },
};
