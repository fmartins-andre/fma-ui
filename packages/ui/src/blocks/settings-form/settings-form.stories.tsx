import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TextField } from "react-aria-components";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Field, FieldContent, FieldDescription } from "@/core/field/field";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { MaskedInput } from "@/core/masked-input/masked-input";
import { Switch } from "@/core/switch/switch";
import meta from "./meta.json";
import {
  SettingsForm,
  SettingsFormFooter,
  type SettingsFormI18n,
  SettingsSection,
} from "./settings-form";

const PT_BR: SettingsFormI18n = {
  labels: {
    save: "Salvar alterações",
    discard: "Descartar",
    saving: "Salvando…",
    unsaved: "Há alterações não salvas",
    saved: "Nenhuma alteração",
  },
};

const componentMeta = {
  title: "blocks/SettingsForm",
  component: SettingsForm,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof SettingsForm>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

type Company = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  emailAlerts: boolean;
  dueDateReminders: boolean;
};

const SAVED_COMPANY: Company = {
  legalName: "Silva & Souza Contabilidade Ltda.",
  tradeName: "Silva Contábil",
  cnpj: "12345678000195",
  email: "contato@silvacontabil.com.br",
  phone: "11987654321",
  emailAlerts: true,
  dueDateReminders: false,
};

/** Stands in for the app's save request. */
const saveCompany = (company: Company) =>
  new Promise<Company>((resolve) => setTimeout(() => resolve(company), 800));

/**
 * The company settings: the app keeps the saved and edited values (here with
 * `useState`; with react-hook-form, `formState.isDirty` and `reset`) and the
 * form shows the state in the save bar.
 */
export const Default: Story = {
  render: () => {
    const [saved, setSaved] = useState(SAVED_COMPANY);
    const [values, setValues] = useState(SAVED_COMPANY);
    const [isPending, setIsPending] = useState(false);
    const isDirty = JSON.stringify(values) !== JSON.stringify(saved);
    const set = (patch: Partial<Company>) => setValues((current) => ({ ...current, ...patch }));

    return (
      <SettingsForm
        i18n={PT_BR}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => setValues(saved)}
        onSubmit={async (event) => {
          event.preventDefault();
          setIsPending(true);
          setSaved(await saveCompany(values));
          setIsPending(false);
        }}
        className="max-w-4xl"
      >
        <SettingsSection
          title="Dados da empresa"
          description="Aparecem nas notas emitidas e nos documentos enviados aos clientes."
        >
          <TextField
            value={values.legalName}
            onChange={(legalName) => set({ legalName })}
            isRequired
            className="col-span-full flex flex-col gap-2"
          >
            <Label>Razão social</Label>
            <Input />
          </TextField>
          <TextField
            value={values.tradeName}
            onChange={(tradeName) => set({ tradeName })}
            className="flex flex-col gap-2"
          >
            <Label>Nome fantasia</Label>
            <Input />
          </TextField>
          <TextField isReadOnly className="flex flex-col gap-2">
            <Label>CNPJ</Label>
            <MaskedInput mask="cnpj" value={values.cnpj} readOnly />
          </TextField>
        </SettingsSection>
        <SettingsSection title="Contato" description="Para onde enviamos avisos e cobranças.">
          <TextField
            type="email"
            value={values.email}
            onChange={(email) => set({ email })}
            className="flex flex-col gap-2"
          >
            <Label>E-mail</Label>
            <Input />
          </TextField>
          <TextField className="flex flex-col gap-2">
            <Label>Telefone</Label>
            <MaskedInput
              mask="phone"
              value={values.phone}
              onValueChange={(phone) => set({ phone })}
            />
          </TextField>
        </SettingsSection>
        <SettingsSection title="Notificações">
          <Field orientation="horizontal" className="col-span-full">
            <FieldContent>
              <Label htmlFor="email-alerts">Alertas por e-mail</Label>
              <FieldDescription>Notas rejeitadas e certificados perto de vencer.</FieldDescription>
            </FieldContent>
            <Switch
              id="email-alerts"
              isSelected={values.emailAlerts}
              onChange={(emailAlerts) => set({ emailAlerts })}
            />
          </Field>
          <Field orientation="horizontal" className="col-span-full">
            <FieldContent>
              <Label htmlFor="due-date-reminders">Lembretes de vencimento</Label>
              <FieldDescription>Guias e faturas, três dias antes.</FieldDescription>
            </FieldContent>
            <Switch
              id="due-date-reminders"
              isSelected={values.dueDateReminders}
              onChange={(dueDateReminders) => set({ dueDateReminders })}
            />
          </Field>
        </SettingsSection>
        <SettingsFormFooter />
      </SettingsForm>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: "Salvar alterações" });
    const discard = canvas.getByRole("button", { name: "Descartar" });
    const tradeName = canvas.getByRole("textbox", { name: "Nome fantasia" });
    await expect(canvas.getByRole("group", { name: "Dados da empresa" })).toBeInTheDocument();
    await expect(canvas.getByRole("status")).toHaveTextContent("Nenhuma alteração");
    await expect(save).toBeDisabled();
    await expect(discard).toBeDisabled();

    await userEvent.type(tradeName, " ME");
    await expect(canvas.getByRole("status")).toHaveTextContent("Há alterações não salvas");
    await userEvent.click(discard);
    await expect(tradeName).toHaveValue("Silva Contábil");
    await expect(save).toBeDisabled();

    await userEvent.click(canvas.getByRole("switch", { name: "Lembretes de vencimento" }));
    await userEvent.click(save);
    await expect(canvas.getByRole("status")).toHaveTextContent("Salvando…");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Nenhuma alteração"));
    await expect(canvas.getByRole("switch", { name: "Lembretes de vencimento" })).toBeChecked();
  },
};

/** Without `onReset` there's no Discard; `children` add a note before Save. */
export const WithoutDiscard: Story = {
  args: { i18n: PT_BR, isDirty: true },
  render: (args) => (
    <SettingsForm {...args} className="max-w-4xl">
      <SettingsSection title="Senha" description="Use ao menos 8 caracteres.">
        <TextField type="password" className="flex flex-col gap-2">
          <Label>Nova senha</Label>
          <Input />
        </TextField>
        <TextField type="password" className="flex flex-col gap-2">
          <Label>Confirmar senha</Label>
          <Input />
        </TextField>
      </SettingsSection>
      <SettingsFormFooter>
        <span className="text-sm text-muted-foreground">Alterada há 3 meses</span>
      </SettingsFormFooter>
    </SettingsForm>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "Descartar" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  },
};
