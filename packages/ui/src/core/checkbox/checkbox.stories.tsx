import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, RadarIcon, ReceiptIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as z from "zod";
import { Button } from "../button/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldTitle } from "../field/field";
import { IconTile } from "../icon-tile/icon-tile";
import { Label } from "../label/label";
import { Checkbox, CheckboxCard, CheckboxGroup } from "./checkbox";
import meta from "./meta.json";

const componentMeta = {
  title: "ui/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: meta.description } },
  },
  argTypes: {
    isDisabled: { control: "boolean" },
    isIndeterminate: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

// Checkbox's own children slot is for a custom indicator/icon override, not
// label text — passing long text there crams it into the fixed size-4 box.
// The real pattern pairs Checkbox with an external Label via id/htmlFor,
// laid out as a flex row.
export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms-disabled" />
      <Label htmlFor="terms-disabled">Accept terms and conditions</Label>
    </div>
  ),
};

// isIndeterminate is a controlled prop, not user-toggleable by clicking — set
// programmatically (e.g. a "select all" checkbox whose children are only
// partially selected).
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="select-all" />
      <Label htmlFor="select-all">Select all</Label>
    </div>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} id="terms-interactive" />
      <Label htmlFor="terms-interactive">Accept terms and conditions</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  },
};

/** Several options under one label; the group's value is the array of checked `value`s. */
export const Group: Story = {
  render: () => (
    <CheckboxGroup defaultValue={["emissor"]}>
      <Label>Módulos</Label>
      <div className="flex items-center gap-2">
        <Checkbox value="emissor" id="module-emissor" />
        <Label htmlFor="module-emissor">Emissor de notas</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox value="radar" id="module-radar" />
        <Label htmlFor="module-radar">Radar de notas</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox value="validador" id="module-validador" />
        <Label htmlFor="module-validador">Validador tributário</Label>
      </div>
    </CheckboxGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Módulos" });
    const radar = within(group).getByRole("checkbox", { name: "Radar de notas" });
    await expect(within(group).getByRole("checkbox", { name: "Emissor de notas" })).toBeChecked();
    await userEvent.click(radar);
    await expect(radar).toBeChecked();
  },
};

/**
 * Choice cards: `CheckboxCard` makes the whole card the checkbox, for a few
 * options that need an icon and a description (the modules a customer uses).
 * For an option with a secondary action, or options grouped under titles, see
 * RadioGroup's `ChoiceCardWithAction` and `ChoiceCardGroups`: the same
 * composition works with `CheckboxCard` in a `CheckboxGroup`.
 */
export const ChoiceCard: Story = {
  render: () => (
    <CheckboxGroup defaultValue={["emissor"]} className="w-96">
      <Label>Módulos do cliente</Label>
      <CheckboxCard value="emissor">
        <IconTile variant="soft" size="sm">
          <ReceiptIcon />
        </IconTile>
        <FieldContent>
          <FieldTitle>Emissor de notas</FieldTitle>
          <FieldDescription>Emissão de NF-e, NFS-e e NFC-e.</FieldDescription>
        </FieldContent>
      </CheckboxCard>
      <CheckboxCard value="radar">
        <IconTile variant="soft" size="sm">
          <RadarIcon />
        </IconTile>
        <FieldContent>
          <FieldTitle>Radar de notas</FieldTitle>
          <FieldDescription>Notas emitidas contra o CNPJ, capturadas na Sefaz.</FieldDescription>
        </FieldContent>
      </CheckboxCard>
      <CheckboxCard value="das" isDisabled>
        <IconTile variant="soft" size="sm">
          <FileTextIcon />
        </IconTile>
        <FieldContent>
          <FieldTitle>Guias DAS</FieldTitle>
          <FieldDescription>Disponível só para clientes MEI.</FieldDescription>
        </FieldContent>
      </CheckboxCard>
    </CheckboxGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emissor = canvas.getByRole("checkbox", { name: /Emissor de notas/ });
    const radar = canvas.getByRole("checkbox", { name: /Radar de notas/ });
    await expect(emissor).toBeChecked();
    // A click anywhere on the card toggles it.
    await userEvent.click(canvas.getByText("Notas emitidas contra o CNPJ, capturadas na Sefaz."));
    await expect(radar).toBeChecked();
    await userEvent.click(canvas.getByText("Emissor de notas"));
    await expect(emissor).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: /Guias DAS/ })).toBeDisabled();
    // No label nested in another label.
    await expect(canvasElement.querySelector("label label")).toBeNull();
  },
};

const acceptanceSchema = z.object({
  acceptedTerms: z.boolean().refine(Boolean, "Aceite os termos de compra para continuar."),
});

type AcceptanceValues = z.infer<typeof acceptanceSchema>;

const finishPurchase = fn(async (_values: AcceptanceValues) => {});

function AcceptanceForm() {
  const form = useForm<AcceptanceValues>({
    resolver: zodResolver(acceptanceSchema),
    defaultValues: { acceptedTerms: false },
  });

  return (
    <form
      onSubmit={form.handleSubmit(finishPurchase)}
      className="flex w-96 flex-col gap-4"
      noValidate
    >
      <Controller
        control={form.control}
        name="acceptedTerms"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms"
                inputRef={field.ref}
                name={field.name}
                isSelected={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
                aria-describedby={fieldState.invalid ? "accept-terms-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="accept-terms" className="font-normal">
                <span>
                  Li e aceito os{" "}
                  <a
                    href="https://example.com/termos-de-compra"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    termos de compra
                  </a>
                </span>
              </Label>
            </div>
            {fieldState.invalid && (
              <FieldError id="accept-terms-error" errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />
      <Button type="submit" isPending={form.formState.isSubmitting}>
        Finalizar compra
      </Button>
    </form>
  );
}

/**
 * Accepting terms: a required `Checkbox` in a React Hook Form + Zod form. The
 * button stays enabled; submitting without the check shows a `FieldError`
 * and focuses the checkbox. The link in the label opens the terms without
 * checking the box. The button is pending only while the purchase runs.
 */
export const Acceptance: Story = {
  render: () => <AcceptanceForm />,
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole("checkbox", { name: /Li e aceito os termos de compra/ });
    const submit = canvas.getByRole("button", { name: "Finalizar compra" });
    await expect(submit).toBeEnabled();

    await userEvent.click(submit);
    await expect(
      await canvas.findByText("Aceite os termos de compra para continuar."),
    ).toBeVisible();
    await waitFor(() => expect(checkbox).toHaveFocus());
    await expect(checkbox).toHaveAccessibleDescription(
      "Aceite os termos de compra para continuar.",
    );
    await expect(finishPurchase).not.toHaveBeenCalled();

    // The link opens the terms; it doesn't check the box.
    const link = canvas.getByRole("link", { name: "termos de compra" });
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(link);
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await userEvent.click(submit);
    await waitFor(() =>
      expect(finishPurchase).toHaveBeenCalledWith({ acceptedTerms: true }, expect.anything()),
    );
  },
};
