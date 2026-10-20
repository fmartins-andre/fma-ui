import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalculatorIcon, MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { FieldError, Form, Link, TextField } from "react-aria-components";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Alert, AlertDescription } from "@/core/alert/alert";
import { LinkButton } from "@/core/button/button";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Input } from "@/core/input/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/core/input-otp/input-otp";
import { Label } from "@/core/label/label";
import { PasswordInput } from "@/core/password-input/password-input";
import {
  isPasswordValid,
  PasswordRules,
  passwordRules,
} from "@/core/password-rules/password-rules";
import { AuthCard, AuthLayout, AuthSubmit, ResendCode } from "./auth";
import meta from "./meta.json";

const componentMeta = {
  title: "blocks/Auth",
  component: AuthLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: meta.description } },
  },
} satisfies Meta<typeof AuthLayout>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const linkClass =
  "font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline";

function Logo() {
  return (
    <span className="flex items-center gap-2 font-medium">
      <IconTile variant="solid" size="sm">
        <CalculatorIcon />
      </IconTile>
      Painel Contábil
    </span>
  );
}

/** The brand area: a product message on a quiet surface. */
function BrandPanel() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 p-10">
      <p className="max-w-md text-2xl font-semibold text-balance">
        Notas, guias e certificados dos seus clientes num lugar só.
      </p>
      <p className="max-w-md text-muted-foreground">
        Acompanhe pendências e emita documentos sem trocar de sistema.
      </p>
    </div>
  );
}

/** Stands in for the app's sign-in request: resolves with an error message, if any. */
const signIn = (_email: string, password: string) =>
  new Promise<string | undefined>((resolve) =>
    setTimeout(
      () => resolve(password === "Segredo123" ? undefined : "E-mail ou senha incorretos."),
      500,
    ),
  );

/** Sign in, with the brand area beside it on wide screens. The fields are the app's. */
export const Login: Story = {
  render: () => {
    const [error, setError] = useState<string>();
    const [isPending, setIsPending] = useState(false);

    return (
      <AuthLayout logo={<Logo />} brand={<BrandPanel />}>
        <AuthCard
          title="Entrar"
          description="Acesse o painel com seu e-mail e senha."
          footer={
            <>
              Ainda não tem conta?{" "}
              <Link href="#cadastro" className={linkClass}>
                Criar conta
              </Link>
            </>
          }
        >
          <Form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setIsPending(true);
              setError(await signIn(String(data.get("email")), String(data.get("password"))));
              setIsPending(false);
            }}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <TextField name="email" type="email" isRequired className="flex flex-col gap-2">
              <Label>E-mail</Label>
              <Input autoComplete="email" />
              <FieldError className="text-sm text-destructive" />
            </TextField>
            <TextField name="password" isRequired className="flex flex-col gap-2">
              <div className="flex items-center">
                <Label>Senha</Label>
                <Link href="#esqueci-a-senha" className={`ml-auto text-sm ${linkClass}`}>
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput autoComplete="current-password" toggleLabel="Mostrar senha" />
              <FieldError className="text-sm text-destructive" />
            </TextField>
            <AuthSubmit isPending={isPending}>Entrar</AuthSubmit>
          </Form>
        </AuthCard>
      </AuthLayout>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "E-mail" }),
      "ana@silvacontabil.com.br",
    );
    await userEvent.type(canvas.getByLabelText("Senha"), "errada");
    await userEvent.click(canvas.getByRole("button", { name: "Entrar" }));
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos."),
    );
  },
};

/** Asking for a reset code, centered without the brand area; then a confirmation. */
export const ForgotPassword: Story = {
  render: () => {
    const [sentTo, setSentTo] = useState<string>();

    if (sentTo) {
      return (
        <AuthLayout logo={<Logo />}>
          <AuthCard
            title="Verifique seu e-mail"
            description={`Se ${sentTo} tiver uma conta, você vai receber um código para redefinir a senha.`}
          >
            <div className="flex justify-center">
              <IconTile variant="soft" size="lg">
                <MailCheckIcon />
              </IconTile>
            </div>
            <LinkButton href="#redefinir-senha" size="lg" className="w-full">
              Digitar o código
            </LinkButton>
          </AuthCard>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout logo={<Logo />}>
        <AuthCard
          title="Esqueceu a senha?"
          description="Informe o e-mail da sua conta e enviaremos um código."
          footer={
            <Link href="#entrar" className={linkClass}>
              Voltar para o login
            </Link>
          }
        >
          <Form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSentTo(String(new FormData(event.currentTarget).get("email")));
            }}
          >
            <TextField name="email" type="email" isRequired className="flex flex-col gap-2">
              <Label>E-mail</Label>
              <Input autoComplete="email" />
              <FieldError className="text-sm text-destructive" />
            </TextField>
            <AuthSubmit>Enviar código</AuthSubmit>
          </Form>
        </AuthCard>
      </AuthLayout>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "E-mail" }),
      "ana@silvacontabil.com.br",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Enviar código" }));
    await expect(canvas.getByRole("heading", { name: "Verifique seu e-mail" })).toBeInTheDocument();
  },
};

const NEW_PASSWORD_RULES = [
  passwordRules.minLength(8, "Ter pelo menos 8 caracteres"),
  passwordRules.uppercase("Conter uma letra maiúscula"),
  passwordRules.lowercase("Conter uma letra minúscula"),
  passwordRules.number("Conter um número"),
  passwordRules.match("Ser igual à confirmação"),
];

/** Stands in for the app's API: sends a new code. */
const resendCode = () => new Promise<void>((resolve) => setTimeout(resolve, 300));

/** Stands in for the app's API: is this the code we sent? */
const verifyCode = (code: string) =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(code === "123456"), 400));

/**
 * Resetting with a code, in two steps: the server checks the code (resend
 * after a cooldown), then the new password follows the rules.
 */
export const ResetPassword: Story = {
  render: () => {
    const [step, setStep] = useState<"code" | "password" | "done">("code");
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState<string>();
    const [isPending, setIsPending] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");

    if (step === "code") {
      return (
        <AuthLayout logo={<Logo />}>
          <AuthCard
            title="Digite o código"
            description="Enviamos um código de 6 dígitos para a***@silvacontabil.com.br."
            footer={
              <ResendCode
                onResend={resendCode}
                i18n={{
                  labels: {
                    resend: "Reenviar código",
                    resendIn: (time) => `Reenviar código em ${time}`,
                  },
                }}
              />
            }
          >
            <Form
              className="flex flex-col gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsPending(true);
                const isValid = await verifyCode(code);
                setIsPending(false);
                if (isValid) setStep("password");
                else setCodeError("Código inválido ou expirado.");
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="reset-code" className="sr-only">
                  Código de verificação
                </Label>
                <InputOTP
                  id="reset-code"
                  maxLength={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError(undefined);
                  }}
                  autoComplete="one-time-code"
                  aria-invalid={Boolean(codeError)}
                  aria-describedby={codeError ? "reset-code-error" : undefined}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {codeError && (
                  <p id="reset-code-error" role="alert" className="text-sm text-destructive">
                    {codeError}
                  </p>
                )}
              </div>
              <AuthSubmit isPending={isPending} isDisabled={code.length < 6}>
                Verificar código
              </AuthSubmit>
            </Form>
          </AuthCard>
        </AuthLayout>
      );
    }

    if (step === "password") {
      return (
        <AuthLayout logo={<Logo />}>
          <AuthCard title="Crie uma nova senha" description="Ela substitui a senha anterior.">
            <Form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setStep("done");
              }}
            >
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-2">
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
                rules={NEW_PASSWORD_RULES}
                stateLabels={{ neutral: "pendente", met: "atendido", unmet: "não atendido" }}
              />
              <AuthSubmit isDisabled={!isPasswordValid(password, NEW_PASSWORD_RULES, confirmation)}>
                Redefinir senha
              </AuthSubmit>
            </Form>
          </AuthCard>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout logo={<Logo />}>
        <AuthCard title="Senha redefinida" description="Use a nova senha para entrar no painel.">
          <LinkButton href="#entrar" size="lg" className="w-full">
            Ir para o login
          </LinkButton>
        </AuthCard>
      </AuthLayout>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const resend = canvas.getByRole("button", {
      name: /Reenviar código em 1:00|Reenviar código em 0:5\d/,
    });
    await expect(resend).toBeDisabled();

    const code = canvas.getByLabelText("Código de verificação");
    await userEvent.type(code, "000000");
    await userEvent.click(canvas.getByRole("button", { name: "Verificar código" }));
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent("Código inválido ou expirado."),
    );

    await userEvent.clear(code);
    await userEvent.type(code, "123456");
    await userEvent.click(canvas.getByRole("button", { name: "Verificar código" }));
    await waitFor(() =>
      expect(canvas.getByRole("heading", { name: "Crie uma nova senha" })).toBeInTheDocument(),
    );

    const submit = canvas.getByRole("button", { name: "Redefinir senha" });
    await expect(submit).toBeDisabled();
    await userEvent.type(canvas.getByLabelText("Nova senha"), "Segredo123");
    await userEvent.type(canvas.getByLabelText("Confirmar nova senha"), "Segredo123");
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await expect(canvas.getByRole("heading", { name: "Senha redefinida" })).toBeInTheDocument();
  },
};

/** The cooldown ends, the code is resent and the cooldown starts over. */
export const ShouldResendAfterCooldown: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div className="p-6">
      <ResendCode cooldown={1} onResend={resendCode} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Resend code in 0:01" })).toBeDisabled();
    const button = await canvas.findByRole("button", { name: "Resend code" }, { timeout: 2500 });
    await userEvent.click(button);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Resend code in 0:01" })).toBeDisabled(),
    );
  },
};
