"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import * as React from "react";
import { Form } from "react-aria-components";
import { Button } from "@/core/button/button";
import { Spinner } from "@/core/spinner/spinner";
import {
  Stepper,
  StepperContent,
  type StepperContentProps,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/core/stepper/stepper";

type FormWizardLabels = {
  /** The step list's accessible name. */
  steps: string;
  back: string;
  next: string;
  finish: string;
  progress: (step: number, total: number) => string;
};

type FormWizardI18n = { labels?: Partial<FormWizardLabels> };

const defaultFormWizardLabels: FormWizardLabels = {
  steps: "Steps",
  back: "Back",
  next: "Next",
  finish: "Finish",
  progress: (step, total) => `Step ${step} of ${total}`,
};

type FormWizardStepInfo = { title: React.ReactNode; description?: React.ReactNode };

type FormWizardContextValue = {
  step: number;
  steps: FormWizardStepInfo[];
  isPending: boolean;
  back: () => void;
  goTo: (step: number) => void;
  labels: FormWizardLabels;
};

const FormWizardContext = React.createContext<FormWizardContextValue | null>(null);

function useFormWizard() {
  const context = React.useContext(FormWizardContext);
  if (!context) throw new Error("FormWizard parts must be used within a FormWizard.");
  return context;
}

type FormWizardProps = Omit<React.ComponentProps<typeof Form>, "onSubmit"> & {
  /** One entry per step, in order: titles for the step list. */
  steps: FormWizardStepInfo[];
  /** The current step, from 1 (controlled). */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /**
   * Runs on Next (and on Finish) after the step's fields pass their own
   * validation: validate the step here (react-hook-form's `trigger`), or save
   * it. Returning `false` or throwing keeps the user on the step; a promise
   * shows the button as pending until it settles.
   */
  onNext?: (step: number) => boolean | undefined | Promise<boolean | undefined>;
  /** Runs on Finish, after `onNext` of the last step. */
  onComplete?: () => void | Promise<void>;
  i18n?: FormWizardI18n;
};

/** Whatever `onNext` decided: only an explicit `false` or a throw blocks. */
async function allowsAdvance(run: () => boolean | undefined | Promise<boolean | undefined>) {
  try {
    return (await run()) !== false;
  } catch {
    return false;
  }
}

/**
 * A form split into steps, in a dialog or on a page. It's a react-aria `Form`
 * whose submit is Next: the current step's fields validate natively (only the
 * current step is mounted), then `onNext` may block the advance. Earlier steps
 * stay reachable from the step list; later ones only through Next. Lay out
 * `FormWizardSteps`, one `FormWizardStep` per step and a `FormWizardFooter`.
 */
function FormWizard({
  steps,
  step: stepProp,
  defaultStep = 1,
  onStepChange,
  onNext,
  onComplete,
  i18n,
  className,
  children,
  ...props
}: FormWizardProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultStep);
  const [isPending, setIsPending] = React.useState(false);
  const step = stepProp ?? uncontrolled;
  const total = steps.length;
  const rootRef = React.useRef<HTMLFormElement>(null);
  const shouldFocusStep = React.useRef(false);
  const overrides = i18n?.labels;
  const labels = React.useMemo(() => ({ ...defaultFormWizardLabels, ...overrides }), [overrides]);

  const goTo = React.useCallback(
    (next: number) => {
      if (next === step || next < 1 || next > total) return;
      shouldFocusStep.current = true;
      if (stepProp === undefined) setUncontrolled(next);
      onStepChange?.(next);
    },
    [step, total, stepProp, onStepChange],
  );

  // After Back/Next, move focus into the new step so keyboard and screen
  // reader users don't stay on a button that changed meaning.
  React.useEffect(() => {
    if (!shouldFocusStep.current) return;
    shouldFocusStep.current = false;
    // The previous panel may still be mounted (inert) while it exits.
    const panel = rootRef.current?.querySelector<HTMLElement>(
      `[data-slot=form-wizard-step][data-step="${step}"]`,
    );
    const field = panel?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex='-1'])",
    );
    (field ?? panel)?.focus();
  }, [step]);

  async function submit() {
    if (isPending) return;
    setIsPending(true);
    try {
      if (!(await allowsAdvance(() => onNext?.(step)))) return;
      if (step < total) goTo(step + 1);
      else await onComplete?.();
    } finally {
      setIsPending(false);
    }
  }

  const context = {
    step,
    steps,
    isPending,
    back: () => goTo(step - 1),
    goTo,
    labels,
  };

  return (
    <FormWizardContext.Provider value={context}>
      <Form
        ref={rootRef}
        data-slot="form-wizard"
        aria-busy={isPending || undefined}
        className={cn("@container/form-wizard w-full min-w-0", className)}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        {...props}
      >
        <Stepper
          value={step}
          onValueChange={goTo}
          indicators={{ completed: <CheckIcon className="size-3.5" /> }}
          className="flex flex-col gap-6"
        >
          {children}
        </Stepper>
      </Form>
    </FormWizardContext.Provider>
  );
}

/** The wizard width from which the step titles fit beside the numbers. */
function titleWidthFor(count: number) {
  if (count <= 4)
    return {
      show: "@xl/form-wizard:not-sr-only @xl/form-wizard:flex",
      hide: "@xl/form-wizard:hidden",
    };
  if (count <= 6)
    return {
      show: "@3xl/form-wizard:not-sr-only @3xl/form-wizard:flex",
      hide: "@3xl/form-wizard:hidden",
    };
  return {
    show: "@5xl/form-wizard:not-sr-only @5xl/form-wizard:flex",
    hide: "@5xl/form-wizard:hidden",
  };
}

/**
 * The step list. Titles show when the wizard is wide enough; narrower, only
 * the numbers do, with the current title under them. Steps after the current
 * one are disabled.
 */
function FormWizardSteps({
  showDescriptions = false,
  className,
}: {
  /** Show each step's `description` under its title (wide wizards only). */
  showDescriptions?: boolean;
  className?: string;
}) {
  const { step, steps, isPending, labels } = useFormWizard();
  const current = steps[step - 1];
  const titleWidth = titleWidthFor(steps.length);

  return (
    <div data-slot="form-wizard-steps" className={cn("flex flex-col gap-3", className)}>
      <StepperNav aria-label={labels.steps}>
        {steps.map(({ title, description }, index) => {
          const number = index + 1;
          return (
            <StepperItem key={number} step={number} isDisabled={number > step || isPending}>
              <StepperTrigger className="items-start rounded-md pr-1">
                <StepperIndicator>{number}</StepperIndicator>
                <span className={cn("sr-only flex-col gap-1 pt-[5px] text-left", titleWidth.show)}>
                  <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground">
                    {title}
                  </StepperTitle>
                  {showDescriptions && description && (
                    <StepperDescription className="text-xs">{description}</StepperDescription>
                  )}
                </span>
              </StepperTrigger>
              {number < steps.length && <StepperSeparator className="mx-2" />}
            </StepperItem>
          );
        })}
      </StepperNav>
      {current && (
        // The tab already names the step; this repeats it for sighted users
        // while the list only shows numbers.
        <p aria-hidden="true" className={cn("text-sm font-medium", titleWidth.hide)}>
          {current.title}
        </p>
      )}
    </div>
  );
}

/** One step's fields, mounted only while it's the current step. */
function FormWizardStep({
  step,
  className,
  ...props
}: Omit<StepperContentProps, "value"> & { step: number }) {
  return (
    <StepperContent
      value={step}
      data-slot="form-wizard-step"
      data-step={step}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

/**
 * Progress ("Step 2 of 4", announced politely), then Back (from the second
 * step), Next, or Finish on the last step. `children` go before Back (a
 * Cancel that closes the dialog).
 */
function FormWizardFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  const { step, steps, isPending, back, labels } = useFormWizard();
  const isLast = step === steps.length;

  return (
    <div
      data-slot="form-wizard-footer"
      className={cn("flex flex-wrap items-center gap-3 border-t pt-4", className)}
      {...props}
    >
      <p role="status" className="mr-auto text-sm text-muted-foreground">
        {labels.progress(step, steps.length)}
      </p>
      <div className="ml-auto flex items-center gap-2">
        {children}
        {step > 1 && (
          <Button variant="outline" isDisabled={isPending} onPress={back}>
            {labels.back}
          </Button>
        )}
        <Button type="submit" isPending={isPending}>
          {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
          {isLast ? labels.finish : labels.next}
        </Button>
      </div>
    </div>
  );
}

export type { FormWizardI18n, FormWizardLabels, FormWizardProps, FormWizardStepInfo };
export { FormWizard, FormWizardFooter, FormWizardStep, FormWizardSteps, useFormWizard };
