import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FieldError, TextField, type TextFieldProps } from "react-aria-components";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/card/card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/core/description-list/description-list";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/dialog/dialog";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import {
  FormWizard,
  FormWizardFooter,
  type FormWizardI18n,
  FormWizardStep,
  FormWizardSteps,
} from "./form-wizard";
import meta from "./meta.json";

const PT_BR: FormWizardI18n = {
  labels: {
    steps: "Etapas",
    back: "Voltar",
    next: "Próximo",
    finish: "Concluir",
    progress: (step, total) => `Etapa ${step} de ${total}`,
  },
};

const componentMeta = {
  title: "blocks/FormWizard",
  component: FormWizard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
  args: { steps: [], i18n: PT_BR, onComplete: fn() },
} satisfies Meta<typeof FormWizard>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** A text field with label and validation message. */
function TextInput({ label, ...props }: TextFieldProps & { label: string }) {
  return (
    <TextField className="flex flex-col gap-2" {...props}>
      <Label>{label}</Label>
      <Input />
      <FieldError className="text-sm text-destructive" />
    </TextField>
  );
}

const CLIENT_STEPS = [
  { title: "Identificação", description: "Nome e documento" },
  { title: "Endereço", description: "Onde fica a empresa" },
  { title: "Contato", description: "Quem recebe os avisos" },
  { title: "Revisão", description: "Confira antes de salvar" },
];

type Client = { name: string; document: string; zip: string; city: string; email: string };

const EMPTY_CLIENT: Client = { name: "", document: "", zip: "", city: "", email: "" };

/** Stands in for the app's API: is the document already registered? */
const isRegistered = (document: string) =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(document === "00000000000"), 500));

/**
 * A new customer, on a page card. Required fields block Next on their own;
 * `onNext` checks the document with the server before leaving step 1 and
 * reports it through the form's `validationErrors`. The
 * values live in the app (here `useState`; with react-hook-form, keep
 * `shouldUnregister` off so unmounted steps keep theirs).
 */
export const Default: Story = {
  render: (args) => {
    const [client, setClient] = useState(EMPTY_CLIENT);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const set = (patch: Partial<Client>) => setClient((current) => ({ ...current, ...patch }));

    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <FormWizard
            {...args}
            steps={CLIENT_STEPS}
            validationErrors={serverErrors}
            onNext={async (step) => {
              if (step !== 1) return true;
              if (await isRegistered(client.document)) {
                setServerErrors({ document: "Já existe um cliente com este documento." });
                return false;
              }
              setServerErrors({});
              return true;
            }}
          >
            <FormWizardSteps />
            <FormWizardStep step={1}>
              <TextInput
                label="Nome ou razão social"
                isRequired
                value={client.name}
                onChange={(name) => set({ name })}
              />
              <TextInput
                label="CPF ou CNPJ"
                name="document"
                isRequired
                value={client.document}
                onChange={(document) => set({ document })}
              />
            </FormWizardStep>
            <FormWizardStep step={2}>
              <TextInput
                label="CEP"
                isRequired
                value={client.zip}
                onChange={(zip) => set({ zip })}
              />
              <TextInput
                label="Cidade"
                isRequired
                value={client.city}
                onChange={(city) => set({ city })}
              />
            </FormWizardStep>
            <FormWizardStep step={3}>
              <TextInput
                label="E-mail"
                type="email"
                isRequired
                value={client.email}
                onChange={(email) => set({ email })}
              />
            </FormWizardStep>
            <FormWizardStep step={4}>
              <DescriptionList divided>
                <DescriptionItem>
                  <DescriptionTerm>Nome</DescriptionTerm>
                  <DescriptionDetails>{client.name}</DescriptionDetails>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>Documento</DescriptionTerm>
                  <DescriptionDetails>{client.document}</DescriptionDetails>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>Cidade</DescriptionTerm>
                  <DescriptionDetails>{client.city}</DescriptionDetails>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>E-mail</DescriptionTerm>
                  <DescriptionDetails>{client.email}</DescriptionDetails>
                </DescriptionItem>
              </DescriptionList>
            </FormWizardStep>
            <FormWizardFooter />
          </FormWizard>
        </CardContent>
      </Card>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const next = () => canvas.getByRole("button", { name: "Próximo" });
    const tab = (name: string) => canvas.getByRole("tab", { name: new RegExp(name) });

    // Required fields block the advance.
    await userEvent.click(next());
    await expect(tab("Identificação")).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("textbox", { name: /Nome/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(tab("Endereço")).toHaveAttribute("aria-disabled", "true");

    // onNext blocks it too.
    await userEvent.type(canvas.getByRole("textbox", { name: /Nome/ }), "Padaria Pão Quente");
    await userEvent.type(canvas.getByRole("textbox", { name: /CPF ou CNPJ/ }), "00000000000");
    await userEvent.click(next());
    await waitFor(() =>
      expect(canvas.getByText("Já existe um cliente com este documento.")).toBeInTheDocument(),
    );
    await expect(tab("Identificação")).toHaveAttribute("aria-selected", "true");

    const document = canvas.getByRole("textbox", { name: /CPF ou CNPJ/ });
    await userEvent.clear(document);
    await userEvent.type(document, "12345678000195");
    await userEvent.click(next());
    await waitFor(() => expect(tab("Endereço")).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(canvas.getByRole("textbox", { name: /CEP/ })).toHaveFocus());
    await expect(canvas.getByRole("status")).toHaveTextContent("Etapa 2 de 4");

    // Earlier steps stay reachable, with their values.
    await userEvent.click(tab("Identificação"));
    await expect(canvas.getByRole("textbox", { name: /Nome/ })).toHaveValue("Padaria Pão Quente");
    await userEvent.click(next());

    await waitFor(() => expect(tab("Endereço")).toHaveAttribute("aria-selected", "true"));
    await userEvent.type(canvas.getByRole("textbox", { name: /CEP/ }), "01310100");
    await userEvent.type(canvas.getByRole("textbox", { name: /Cidade/ }), "São Paulo");
    await userEvent.click(next());
    await userEvent.type(canvas.getByRole("textbox", { name: /E-mail/ }), "contato@paoquente.com");
    await userEvent.click(next());

    await expect(canvas.getByText("contato@paoquente.com")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(args.onComplete).toHaveBeenCalledTimes(1));
  },
};

/** In a dialog: the Cancel button goes in the footer, before Back. */
export const InDialog: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button>Novo cliente</Button>
      <Dialog className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Cadastre a empresa para emitir notas em nome dela.</DialogDescription>
        </DialogHeader>
        <FormWizard {...args} steps={CLIENT_STEPS.slice(0, 3)}>
          <FormWizardSteps />
          <FormWizardStep step={1}>
            <TextInput label="Nome ou razão social" isRequired />
          </FormWizardStep>
          <FormWizardStep step={2}>
            <TextInput label="Cidade" isRequired />
          </FormWizardStep>
          <FormWizardStep step={3}>
            <TextInput label="E-mail" type="email" isRequired />
          </FormWizardStep>
          <FormWizardFooter>
            <DialogClose variant="ghost">Cancelar</DialogClose>
          </FormWizardFooter>
        </FormWizard>
      </Dialog>
    </DialogTrigger>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Novo cliente" }));
    const dialog = within(await within(document.body).findByRole("dialog"));
    await userEvent.type(dialog.getByRole("textbox", { name: /Nome/ }), "Padaria Pão Quente");
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(dialog.getByRole("tab", { name: /Endereço/ })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};

const ACCOUNTANT_STEPS = [
  { title: "Dados pessoais" },
  { title: "Escritório" },
  { title: "Endereço" },
  { title: "Responsável técnico" },
  { title: "Plano" },
  { title: "Pagamento" },
  { title: "Confirmação" },
];

/**
 * Seven steps in a narrow space: the list shows only numbers, with the
 * current title under them; titles return when the wizard is wide.
 */
export const ManySteps: Story = {
  render: (args) => (
    <div className="w-96">
      <FormWizard {...args} steps={ACCOUNTANT_STEPS}>
        <FormWizardSteps />
        {ACCOUNTANT_STEPS.map(({ title }, index) => (
          <FormWizardStep key={title} step={index + 1}>
            <TextInput label={`Campo de ${title.toLowerCase()}`} />
          </FormWizardStep>
        ))}
        <FormWizardFooter />
      </FormWizard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("tab")).toHaveLength(7);
    await expect(canvas.getByRole("tab", { name: /Escritório/ })).toBeInTheDocument();
    await expect(canvas.getByText("Dados pessoais", { selector: "p" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Próximo" }));
    await expect(canvas.getByText("Escritório", { selector: "p" })).toBeVisible();
  },
};
