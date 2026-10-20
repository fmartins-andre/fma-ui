import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import type { Key } from "react-aria-components";
import { flushSync } from "react-dom";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as z from "zod";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Checkbox } from "@/core/checkbox/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/core/field/field";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { Textarea } from "@/core/textarea/textarea";
import meta from "./meta.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const componentMeta = {
  title: "ui/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  args: {
    defaultSelectedKey: "account",
    className: "w-96",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Settings">
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent id="account">Make changes to your account here.</TabsContent>
      <TabsContent id="password">Change your password here.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const LineVariant: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Settings" variant="line">
        <TabsTrigger id="account">Account</TabsTrigger>
        <TabsTrigger id="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent id="account">Make changes to your account here.</TabsContent>
      <TabsContent id="password">Change your password here.</TabsContent>
    </Tabs>
  ),
};

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const password = canvas.getByRole("tab", { name: "Password" });
    await userEvent.click(password);
    expect(password).toHaveAttribute("aria-selected", "true");
    expect(canvas.getByRole("tabpanel")).toHaveTextContent("Change your password here.");
  },
};

const invoiceSchema = z
  .object({
    recipientName: z.string().min(3, "Informe o nome do destinatário."),
    recipientDocument: z
      .string()
      .regex(/^\d{11}(\d{3})?$/, "Informe o CPF ou o CNPJ, só os dígitos."),
    deliverElsewhere: z.boolean(),
    deliveryAddress: z.string(),
    productDescription: z.string().min(1, "Descreva o produto."),
    productQuantity: z.string().regex(/^[1-9]\d*$/, "Informe a quantidade."),
    notes: z.string(),
  })
  .refine((values) => !values.deliverElsewhere || values.deliveryAddress.trim() !== "", {
    path: ["deliveryAddress"],
    message: "Informe o endereço de entrega.",
  });

type InvoiceValues = z.infer<typeof invoiceSchema>;

/** The tab of each validated field, in the order errors are reported. */
const FIELD_TAB = {
  recipientName: "recipient",
  recipientDocument: "recipient",
  productDescription: "products",
  productQuantity: "products",
  deliveryAddress: "delivery",
} as const;

type ValidatedField = keyof typeof FIELD_TAB;

const issueInvoice = fn(async (_values: InvoiceValues) => {});
const saveDraft = fn((_values: InvoiceValues) => {});

function InvoiceForm() {
  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      recipientName: "",
      recipientDocument: "",
      deliverElsewhere: false,
      deliveryAddress: "",
      productDescription: "",
      productQuantity: "",
      notes: "",
    },
    // The first error may sit in another tab: it is focused after switching.
    shouldFocusError: false,
  });
  const [tab, setTab] = React.useState<Key>("recipient");
  const deliverElsewhere = form.watch("deliverElsewhere");
  const { errors } = form.formState;

  const tabs = [
    { id: "recipient", label: "Destinatário" },
    { id: "products", label: "Produtos" },
    ...(deliverElsewhere ? [{ id: "delivery", label: "Local de entrega" }] : []),
    { id: "notes", label: "Informações adicionais" },
  ];
  const index = tabs.findIndex((item) => item.id === tab);
  const errorCount = (id: string) =>
    (Object.keys(FIELD_TAB) as ValidatedField[]).filter(
      (name) => FIELD_TAB[name] === id && errors[name],
    ).length;

  const showFirstError = (invalid: FieldErrors<InvoiceValues>) => {
    const first = (Object.keys(FIELD_TAB) as ValidatedField[]).find((name) => invalid[name]);
    if (!first) return;
    // Panels stay mounted but inert while hidden: select the tab, then focus.
    flushSync(() => setTab(FIELD_TAB[first]));
    form.setFocus(first);
  };

  return (
    <form
      onSubmit={form.handleSubmit(issueInvoice, showFirstError)}
      className="flex w-[36rem] flex-col gap-4"
      noValidate
    >
      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <TabsList aria-label="Nota fiscal">
          {tabs.map((item) => {
            const count = errorCount(item.id);
            return (
              <TabsTrigger key={item.id} id={item.id}>
                {item.label}
                {count > 0 && (
                  <>
                    <Badge variant="destructive-dot" aria-hidden="true">
                      {count}
                    </Badge>
                    <span className="sr-only">, {count === 1 ? "1 erro" : `${count} erros`}</span>
                  </>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Mounted while hidden, so values and errors survive tab changes. */}
        <TabsContent id="recipient" shouldForceMount className="pt-2 data-inert:hidden">
          <FieldGroup>
            <Controller
              control={form.control}
              name="recipientName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoice-recipient-name">Nome ou razão social</FieldLabel>
                  <Input id="invoice-recipient-name" aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="recipientDocument"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoice-recipient-document">CPF ou CNPJ</FieldLabel>
                  <Input
                    id="invoice-recipient-document"
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
              name="deliverElsewhere"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="invoice-deliver-elsewhere"
                    inputRef={field.ref}
                    isSelected={field.value}
                    onChange={field.onChange}
                  />
                  <Label htmlFor="invoice-deliver-elsewhere" className="font-normal">
                    Entregar em outro endereço
                  </Label>
                </div>
              )}
            />
          </FieldGroup>
        </TabsContent>

        <TabsContent id="products" shouldForceMount className="pt-2 data-inert:hidden">
          <FieldGroup>
            <Controller
              control={form.control}
              name="productDescription"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoice-product-description">Produto</FieldLabel>
                  <Input
                    id="invoice-product-description"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="productQuantity"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoice-product-quantity">Quantidade</FieldLabel>
                  <Input
                    id="invoice-product-quantity"
                    inputMode="numeric"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </TabsContent>

        {deliverElsewhere && (
          <TabsContent id="delivery" shouldForceMount className="pt-2 data-inert:hidden">
            <Controller
              control={form.control}
              name="deliveryAddress"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invoice-delivery-address">Endereço de entrega</FieldLabel>
                  <Input
                    id="invoice-delivery-address"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </TabsContent>
        )}

        <TabsContent id="notes" shouldForceMount className="pt-2 data-inert:hidden">
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="invoice-notes">Informações complementares</FieldLabel>
                <Textarea id="invoice-notes" {...field} />
              </Field>
            )}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {index > 0 && (
          <Button variant="ghost" onPress={() => setTab(tabs[index - 1]?.id ?? tab)}>
            Voltar
          </Button>
        )}
        <div className="ms-auto flex flex-wrap gap-2">
          <Button variant="outline" onPress={() => saveDraft(form.getValues())}>
            Salvar rascunho
          </Button>
          {index < tabs.length - 1 && (
            <Button variant="outline" onPress={() => setTab(tabs[index + 1]?.id ?? tab)}>
              Avançar
            </Button>
          )}
          <Button type="submit" isPending={form.formState.isSubmitting}>
            Emitir
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * A long form split into tabs (issuing an invoice). The tabs are free: "Avançar"
 * only changes tabs and the draft saves at any time; validation runs on
 * "Emitir". The panels stay mounted (`shouldForceMount`, hidden while inert),
 * so values survive tab changes. On errors, each tab with problems shows a
 * count (read as part of its name) and the first invalid field is focused,
 * in its tab. "Local de entrega" only exists when delivery is elsewhere.
 */
export const FormTabs: Story = {
  render: () => <InvoiceForm />,
  play: async ({ canvas }) => {
    const tabsList = canvas.getByRole("tablist", { name: "Nota fiscal" });
    await userEvent.type(canvas.getByLabelText("Nome ou razão social"), "Mercado Silva");

    // "Avançar" only changes tabs; values survive.
    await userEvent.click(canvas.getByRole("button", { name: "Avançar" }));
    await expect(canvas.getByRole("tab", { name: "Produtos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Voltar" }));
    await expect(canvas.getByLabelText("Nome ou razão social")).toHaveValue("Mercado Silva");

    // A conditional tab.
    await expect(within(tabsList).queryByRole("tab", { name: /Local de entrega/ })).toBeNull();
    await userEvent.click(canvas.getByLabelText("Entregar em outro endereço"));
    await expect(within(tabsList).getByRole("tab", { name: "Local de entrega" })).toBeVisible();

    // Drafts save without validating.
    await userEvent.click(canvas.getByRole("button", { name: "Salvar rascunho" }));
    await expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ recipientName: "Mercado Silva", deliverElsewhere: true }),
    );

    // Issuing validates: tabs with errors say so, the first invalid field gets focus.
    await userEvent.click(canvas.getByRole("tab", { name: "Informações adicionais" }));
    await userEvent.click(canvas.getByRole("button", { name: "Emitir" }));
    await expect(
      await canvas.findByRole("tab", { name: /^Destinatário\W+1 erro$/ }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: /^Produtos\W+2 erros$/ })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: /^Local de entrega\W+1 erro$/ })).toBeVisible();
    await waitFor(() => expect(canvas.getByLabelText("CPF ou CNPJ")).toHaveFocus());
    await expect(issueInvoice).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByLabelText("CPF ou CNPJ"), "12345678000190");
    await userEvent.click(canvas.getByRole("tab", { name: /Produtos/ }));
    await userEvent.type(canvas.getByLabelText("Produto"), "Arroz 5 kg");
    await userEvent.type(canvas.getByLabelText("Quantidade"), "10");
    await userEvent.click(canvas.getByRole("tab", { name: /Local de entrega/ }));
    await userEvent.type(canvas.getByLabelText("Endereço de entrega"), "Rua das Flores, 100");
    await userEvent.click(canvas.getByRole("button", { name: "Emitir" }));
    await waitFor(() => expect(issueInvoice).toHaveBeenCalled());
  },
};
