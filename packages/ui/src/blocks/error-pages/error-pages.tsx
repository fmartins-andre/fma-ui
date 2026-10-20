"use client";

import { cn } from "cn";
import {
  ChevronDownIcon,
  LockIcon,
  RotateCwIcon,
  SearchXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/core/button/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/collapsible/collapsible";
import { CopyButton } from "@/core/copy-button/copy-button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/core/empty/empty";
import { IconStack } from "@/core/icon-stack/icon-stack";

type ErrorPageProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** `page` fills the viewport; `inline` fills the content area of the app's layout. */
  layout?: "page" | "inline";
  /** The glyph on the icon stack. */
  icon?: React.ReactNode;
  /** The status code ("404"), shown as a small label above the title. */
  code?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links below the text: go home, go back, try again. */
  actions?: React.ReactNode;
};

/**
 * The frame of an error screen: icon, status code, title (`h1`, since it
 * replaces the page), description and actions, centered. Anything in
 * `children` (like `ErrorDetails`) goes below the actions.
 */
function ErrorPage({
  layout = "page",
  icon,
  code,
  title,
  description,
  actions,
  className,
  children,
  ...props
}: ErrorPageProps) {
  return (
    <Empty
      data-slot="error-page"
      data-layout={layout}
      className={cn("gap-6", layout === "page" ? "min-h-svh bg-background" : "min-h-96", className)}
      {...props}
    >
      <EmptyHeader className="max-w-md">
        {icon && (
          <EmptyMedia className="text-muted-foreground">
            <IconStack>{icon}</IconStack>
          </EmptyMedia>
        )}
        {code && (
          <p
            data-slot="error-page-code"
            className="font-mono text-sm font-medium text-muted-foreground tabular-nums"
          >
            {code}
          </p>
        )}
        <h1 className="font-heading text-xl leading-snug font-semibold tracking-tight">{title}</h1>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {(actions || children) && (
        <EmptyContent className="max-w-md">
          {actions && (
            <div data-slot="error-page-actions" className="flex flex-wrap justify-center gap-2">
              {actions}
            </div>
          )}
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}

type ErrorDetailsLabels = {
  details: string;
  copy: string;
  copied: string;
  copyFailed: string;
};

const defaultErrorDetailsLabels: ErrorDetailsLabels = {
  details: "Error details",
  copy: "Copy details",
  copied: "Copied",
  copyFailed: "Couldn't copy",
};

/** The error as text: the stack when there is one (it starts with the message). */
function formatError(error: unknown) {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2) ?? String(error);
  } catch {
    return String(error);
  }
}

/**
 * Technical details behind a collapsible: the error's message and stack in
 * monospace, with a button that copies them for a support ticket.
 */
function ErrorDetails({
  error,
  labels: labelsProp,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, "children"> & {
  error: unknown;
  labels?: Partial<ErrorDetailsLabels>;
}) {
  const labels = { ...defaultErrorDetailsLabels, ...labelsProp };
  const text = formatError(error);

  return (
    <Collapsible
      data-slot="error-details"
      className={cn("group/error-details w-full text-left", className)}
      {...props}
    >
      <CollapsibleTrigger className="mx-auto flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        {labels.details}
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 transition-transform group-data-expanded/error-details:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="relative mt-2 rounded-lg border bg-muted/50">
          <CopyButton
            value={text}
            timeout={1500}
            labels={{ copy: labels.copy, copied: labels.copied, failed: labels.copyFailed }}
            className="absolute top-1.5 right-1.5"
          />
          <pre className="max-h-64 overflow-auto p-3 pr-11 font-mono text-xs/relaxed wrap-anywhere whitespace-pre-wrap text-muted-foreground">
            {text}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type PresetProps<Labels> = Omit<ErrorPageProps, "title"> & {
  title?: React.ReactNode;
  i18n?: { labels?: Partial<Labels> };
};

type NotFoundLabels = { code: string; title: string; description: string };

const defaultNotFoundLabels: NotFoundLabels = {
  code: "404",
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has moved.",
};

/** The page doesn't exist. Pass the way out in `actions` (home, back). */
function NotFound({ i18n, ...props }: PresetProps<NotFoundLabels>) {
  const labels = { ...defaultNotFoundLabels, ...i18n?.labels };
  return (
    <ErrorPage
      data-kind="not-found"
      icon={<SearchXIcon aria-hidden="true" />}
      code={labels.code}
      title={labels.title}
      description={labels.description}
      {...props}
    />
  );
}

type ForbiddenLabels = NotFoundLabels;

const defaultForbiddenLabels: ForbiddenLabels = {
  code: "403",
  title: "Access denied",
  description: "You don't have permission to view this page. Ask an administrator for access.",
};

/** The user can't see this page. */
function Forbidden({ i18n, ...props }: PresetProps<ForbiddenLabels>) {
  const labels = { ...defaultForbiddenLabels, ...i18n?.labels };
  return (
    <ErrorPage
      data-kind="forbidden"
      icon={<LockIcon aria-hidden="true" />}
      code={labels.code}
      title={labels.title}
      description={labels.description}
      {...props}
    />
  );
}

type UnexpectedErrorLabels = Omit<NotFoundLabels, "code"> &
  ErrorDetailsLabels & {
    retry: string;
  };

const defaultUnexpectedErrorLabels: UnexpectedErrorLabels = {
  title: "Something went wrong",
  description: "An unexpected error occurred. Try again; if it keeps happening, contact support.",
  retry: "Try again",
  ...defaultErrorDetailsLabels,
};

/**
 * An unexpected failure. With `onRetry`, a "Try again" button comes first in
 * the actions (pending while its promise runs); with `error`, the details sit
 * in a collapsible below. Leave `error` out where users shouldn't see it.
 */
function UnexpectedError({
  error,
  onRetry,
  actions,
  i18n,
  children,
  ...props
}: PresetProps<UnexpectedErrorLabels> & {
  error?: unknown;
  onRetry?: () => void | Promise<void>;
}) {
  const labels = { ...defaultUnexpectedErrorLabels, ...i18n?.labels };
  const [isPending, setIsPending] = React.useState(false);

  async function retry() {
    setIsPending(true);
    try {
      await onRetry?.();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <ErrorPage
      data-kind="unexpected-error"
      icon={<TriangleAlertIcon aria-hidden="true" />}
      title={labels.title}
      description={labels.description}
      actions={
        (onRetry || actions) && (
          <>
            {onRetry && (
              <Button isPending={isPending} onPress={retry}>
                <RotateCwIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                  className={cn(isPending && "animate-spin")}
                />
                {labels.retry}
              </Button>
            )}
            {actions}
          </>
        )
      }
      {...props}
    >
      {children}
      {error !== undefined && <ErrorDetails error={error} labels={labels} />}
    </ErrorPage>
  );
}

export type {
  ErrorDetailsLabels,
  ErrorPageProps,
  ForbiddenLabels,
  NotFoundLabels,
  UnexpectedErrorLabels,
};
export { ErrorDetails, ErrorPage, Forbidden, NotFound, UnexpectedError };
