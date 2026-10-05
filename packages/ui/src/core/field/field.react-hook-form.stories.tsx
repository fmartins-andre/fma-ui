import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, type DateValue } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { I18nProvider } from "react-aria-components";
import { Controller, useForm } from "react-hook-form";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as z from "zod";
import { Button } from "@/core/button/button";
import { DatePicker } from "@/core/date-picker/date-picker";
import { Input } from "@/core/input/input";
import { MaskedInput } from "@/core/masked-input/masked-input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./field";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  // MaskedInput reports the raw digits, so validate those.
  cpf: z.string().length(11, "Enter the 11 CPF digits."),
  birthDate: z.custom<DateValue>((value) => value != null, "Pick a date."),
});

type Values = z.infer<typeof schema>;

function ProfileForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", cpf: "", birthDate: undefined },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-96 flex-col gap-6" noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="rhf-name">Name</FieldLabel>
              <Input id="rhf-name" aria-invalid={fieldState.invalid} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="cpf"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="rhf-cpf">CPF</FieldLabel>
              <MaskedInput
                id="rhf-cpf"
                mask="cpf"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>Only the digits are stored.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel id="rhf-birth-label">Birth date</FieldLabel>
              <DatePicker
                aria-labelledby="rhf-birth-label"
                value={field.value ?? null}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit">Save</Button>
    </form>
  );
}

const componentMeta = {
  title: "ui/Field/React Hook Form",
  component: ProfileForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Registry fields in a React Hook Form + Zod form: a `Controller` per field wires `field` and `fieldState` into a `Field` (`data-invalid`, `aria-invalid`, `FieldError`). `MaskedInput` binds through `value`/`onValueChange` (raw digits), `DatePicker` through `value`/`onChange` (a `DateValue`) and `isInvalid`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <I18nProvider locale="en-US">
        <Story />
      </I18nProvider>
    ),
  ],
  args: { onSubmit: fn() },
} satisfies Meta<typeof ProfileForm>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const ShowsErrors: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByText("Name must be at least 3 characters.")).toBeVisible();
    await expect(canvas.getByText("Enter the 11 CPF digits.")).toBeVisible();
    await expect(canvas.getByText("Pick a date.")).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const SubmitsValues: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Ada Lovelace");
    await userEvent.type(canvas.getByLabelText("CPF"), "12345678901");
    await expect(canvas.getByLabelText("CPF")).toHaveValue("123.456.789-01");

    const date = canvas.getByRole("group", { name: "Birth date" });
    await userEvent.click(within(date).getAllByRole("spinbutton")[0] as HTMLElement);
    await userEvent.keyboard("12101990");

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalled());
    const [values] = (args.onSubmit as ReturnType<typeof fn>).mock.lastCall ?? [];
    await expect(values).toMatchObject({ name: "Ada Lovelace", cpf: "12345678901" });
    await expect((values as Values).birthDate.compare(new CalendarDate(1990, 12, 10))).toBe(0);
  },
};
