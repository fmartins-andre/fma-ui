import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldError, Text, TextField } from "react-aria-components";
import { expect, userEvent, waitFor } from "storybook/test";
import { Label } from "@/core/label/label";
import meta from "./meta.json";
import { PasswordInput } from "./password-input";

const componentMeta = {
  title: "ui/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: {
    "aria-label": "Senha",
    toggleLabel: "Mostrar senha",
    placeholder: "Digite sua senha",
    autoComplete: "current-password",
    groupClassName: "w-64",
  },
} satisfies Meta<typeof PasswordInput>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText("Senha");
    const toggle = canvas.getByRole("button", { name: "Mostrar senha" });
    await userEvent.type(input, "segredo123");
    await expect(input).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);
    await expect(input).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(input).toHaveValue("segredo123");
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "segredo123" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Mostrar senha" })).toBeDisabled();
  },
};

/**
 * Inside a react-aria `TextField`: label, description, required state and
 * validation reach the input as usual.
 */
export const InTextField: Story = {
  render: () => (
    <TextField
      isRequired
      validate={(value) => (value.length >= 8 ? null : "Use ao menos 8 caracteres.")}
      className="flex w-64 flex-col gap-1.5"
    >
      <Label>Senha</Label>
      <PasswordInput autoComplete="new-password" toggleLabel="Mostrar senha" />
      <Text slot="description" className="text-sm text-muted-foreground">
        Mínimo de 8 caracteres.
      </Text>
      <FieldError className="text-sm text-destructive" />
    </TextField>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/Senha/);
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription("Mínimo de 8 caracteres.");
    await userEvent.type(input, "curta");
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    await expect(canvas.getByText("Use ao menos 8 caracteres.")).toBeInTheDocument();
  },
};
