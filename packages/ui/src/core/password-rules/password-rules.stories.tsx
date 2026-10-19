import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Label } from "@/core/label/label";
import { PasswordInput } from "@/core/password-input/password-input";
import meta from "./meta.json";
import { isPasswordValid, PasswordRules, passwordRules } from "./password-rules";

/** The rules with pt-BR labels: every built-in rule takes a `label`. */
function ptBrRules() {
  return [
    passwordRules.minLength(8, "Ter pelo menos 8 caracteres"),
    passwordRules.uppercase("Conter uma letra maiúscula"),
    passwordRules.lowercase("Conter uma letra minúscula"),
    passwordRules.number("Conter um número"),
  ];
}
const PT_BR_STATES = { neutral: "pendente", met: "atendido", unmet: "não atendido" };

const componentMeta = {
  title: "ui/PasswordRules",
  component: PasswordRules,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: { description: { component: meta.description } },
  },
  args: { value: "", rules: ptBrRules(), stateLabels: PT_BR_STATES },
} satisfies Meta<typeof PasswordRules>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

/** The default rules, pending until something is typed. */
export const Default: Story = {};

/** Met and unmet rules side by side. */
export const States: Story = {
  args: { value: "senha1" },
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole("listitem");
    await expect(items[0]).toHaveAttribute("data-state", "unmet");
    await expect(items[2]).toHaveAttribute("data-state", "met");
    await expect(items[0]).toHaveTextContent("Ter pelo menos 8 caracteres: não atendido");
  },
};

const rules = [
  passwordRules.minLength(8, "Ter pelo menos 8 caracteres"),
  passwordRules.maxLength(64, "Ter no máximo 64 caracteres"),
  passwordRules.uppercase("Conter uma letra maiúscula"),
  passwordRules.lowercase("Conter uma letra minúscula"),
  passwordRules.number("Conter um número"),
  passwordRules.match("Ser igual à confirmação"),
];

/** Creating a password: both fields, the rules under them, and submit gated by `isPasswordValid`. */
export const NewPassword: Story = {
  render: function NewPasswordExample() {
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");

    return (
      <form className="flex w-72 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            toggleLabel="Mostrar senha"
            aria-describedby="new-password-rules"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            toggleLabel="Mostrar senha"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        <PasswordRules
          id="new-password-rules"
          value={password}
          confirmation={confirmation}
          rules={rules}
          stateLabels={{ neutral: "pendente", met: "atendido", unmet: "não atendido" }}
        />
        <Button type="submit" isDisabled={!isPasswordValid(password, rules, confirmation)}>
          Salvar
        </Button>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const password = canvas.getByLabelText("Nova senha");
    await userEvent.type(password, "Segredo123");
    await userEvent.type(canvas.getByLabelText("Confirmar nova senha"), "Segredo123");
    const states = canvas.getAllByRole("listitem").map((item) => item.dataset.state);
    await expect(states).toEqual(["met", "met", "met", "met", "met", "met"]);
    await expect(canvas.getByRole("button", { name: "Salvar" })).toBeEnabled();
  },
};
