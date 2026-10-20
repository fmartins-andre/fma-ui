"use client";

import { cn } from "cn";
import * as React from "react";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/core/card/card";
import { Spinner } from "@/core/spinner/spinner";

/**
 * The page around a sign-in, sign-up or recovery card: the `logo` on top and
 * the content centered. With `brand`, the page splits in two on wide screens
 * and the brand area (illustration, product message) fills the other half;
 * without it, the column sits centered on a muted page.
 */
function AuthLayout({
  logo,
  brand,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { logo?: React.ReactNode; brand?: React.ReactNode }) {
  return (
    <div
      data-slot="auth-layout"
      className={cn(
        "grid min-h-svh w-full",
        brand ? "bg-background lg:grid-cols-2" : "bg-muted",
        className,
      )}
      {...props}
    >
      <div
        className={cn("flex flex-col gap-6 p-6 md:p-10", !brand && "items-center justify-center")}
      >
        {logo && (
          <div
            data-slot="auth-logo"
            className={cn("flex", brand ? "justify-center md:justify-start" : "justify-center")}
          >
            {logo}
          </div>
        )}
        <main className={cn("flex w-full justify-center", brand && "flex-1 items-center")}>
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      {brand && (
        <aside
          data-slot="auth-brand"
          className="relative hidden overflow-hidden bg-muted lg:flex lg:flex-col"
        >
          {brand}
        </aside>
      )}
    </div>
  );
}

/**
 * The form's card: `title` is the page's `h1`, then the `description`, the
 * fields you put inside, and a centered `footer` for the links between screens
 * ("No account yet? Sign up").
 */
function AuthCard({
  title,
  description,
  footer,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Card>, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card data-slot="auth-card" className={cn("w-full gap-6 py-6", className)} {...props}>
      <CardHeader className="px-6 text-center">
        <h1 className="font-heading text-xl leading-snug font-semibold">{title}</h1>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-6">
        {children}
        {footer && (
          <div data-slot="auth-footer" className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** The form's main action: full width, with a spinner while `isPending`. */
function AuthSubmit({
  isPending,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & { children?: React.ReactNode }) {
  return (
    <Button
      type="submit"
      size="lg"
      isPending={isPending}
      className={cn("w-full", className)}
      {...props}
    >
      {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
      {children}
    </Button>
  );
}

type ResendCodeLabels = {
  resend: string;
  /** The disabled button while the cooldown runs, given the time left as `m:ss`. */
  resendIn: (time: string) => string;
};

type ResendCodeI18n = { labels?: Partial<ResendCodeLabels> };

const defaultResendCodeLabels: ResendCodeLabels = {
  resend: "Resend code",
  resendIn: (time) => `Resend code in ${time}`,
};

const formatCooldown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * "Resend code" behind a cooldown: disabled with a countdown, then enabled;
 * pressing it runs `onResend` (pending while its promise runs) and starts the
 * cooldown again. The cooldown starts on mount, since a code was just sent.
 */
function ResendCode({
  onResend,
  cooldown = 60,
  i18n,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onPress" | "children"> & {
  onResend: () => void | Promise<void>;
  /** Seconds between sends. */
  cooldown?: number;
  i18n?: ResendCodeI18n;
}) {
  const labels = { ...defaultResendCodeLabels, ...i18n?.labels };
  const [readyAt, setReadyAt] = React.useState(() => Date.now() + cooldown * 1000);
  const [now, setNow] = React.useState(() => Date.now());
  const [isPending, setIsPending] = React.useState(false);
  const left = Math.max(0, Math.ceil((readyAt - now) / 1000));

  React.useEffect(() => {
    if (left === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [left]);

  async function resend() {
    setIsPending(true);
    try {
      await onResend();
      const sentAt = Date.now();
      setNow(sentAt);
      setReadyAt(sentAt + cooldown * 1000);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      data-slot="resend-code"
      variant="link"
      size="sm"
      isDisabled={left > 0}
      isPending={isPending}
      onPress={resend}
      className={cn("h-auto px-0 tabular-nums", className)}
      {...props}
    >
      {left > 0 ? labels.resendIn(formatCooldown(left)) : labels.resend}
    </Button>
  );
}

export type { ResendCodeI18n, ResendCodeLabels };
export { AuthCard, AuthLayout, AuthSubmit, ResendCode };
