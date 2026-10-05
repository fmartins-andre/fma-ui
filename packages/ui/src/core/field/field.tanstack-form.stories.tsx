import { CalendarDate, type DateValue } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { I18nProvider } from "react-aria-components";
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
  birthDate: z.custom<DateValue | null>((value) => value != null, "Pick a date."),
});

type Values = z.infer<typeof schema>;

function ProfileForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm({
    defaultValues: { name: "", cpf: "", birthDate: null } as Values,
    // TanStack Form takes Standard Schema validators (Zod 4) directly.
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="flex w-96 flex-col gap-6"
      noValidate
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="tsf-name">Name</FieldLabel>
                <Input
                  id="tsf-name"
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="cpf">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="tsf-cpf">CPF</FieldLabel>
                <MaskedInput
                  id="tsf-cpf"
                  mask="cpf"
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(raw) => field.handleChange(raw)}
                  onBlur={field.handleBlur}
                  aria-invalid={invalid}
                />
                <FieldDescription>Only the digits are stored.</FieldDescription>
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="birthDate">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel id="tsf-birth-label">Birth date</FieldLabel>
                <DatePicker
                  aria-labelledby="tsf-birth-label"
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  isInvalid={invalid}
                />
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Button type="submit">Save</Button>
    </form>
  );
}

const componentMeta = {
  title: "ui/Field/TanStack Form",
  component: ProfileForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Registry fields in a TanStack Form validated by a Zod schema (Standard Schema): each `form.Field` renders a `Field`, with `aria-invalid` and `FieldError` from `field.state.meta.errors`. `MaskedInput` binds through `value`/`onValueChange` (raw digits), `DatePicker` through `value`/`onChange` (a `DateValue`) and `isInvalid`.",
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
    await expect(canvas.getByLabelText("CPF")).toHaveAttribute("aria-invalid", "true");
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const SubmitsValues: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Ada Lovelace");
    await userEvent.type(canvas.getByLabelText("CPF"), "12345678901");

    const date = canvas.getByRole("group", { name: "Birth date" });
    await userEvent.click(within(date).getAllByRole("spinbutton")[0] as HTMLElement);
    await userEvent.keyboard("12101990");

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalled());
    const [values] = (args.onSubmit as ReturnType<typeof fn>).mock.lastCall ?? [];
    await expect(values).toMatchObject({ name: "Ada Lovelace", cpf: "12345678901" });
    await expect((values as Values).birthDate?.compare(new CalendarDate(1990, 12, 10))).toBe(0);
  },
};
