"use client";

import { cn } from "cn";
import * as React from "react";
import { Form } from "react-aria-components";
import { Button } from "@/core/button/button";
import { Spinner } from "@/core/spinner/spinner";

type SettingsFormLabels = {
  save: string;
  discard: string;
  /** Status line while `isPending`. */
  saving: string;
  /** Status line while `isDirty`. */
  unsaved: string;
  /** Status line with nothing to save. */
  saved: string;
};

type SettingsFormI18n = { labels?: Partial<SettingsFormLabels> };

const defaultSettingsFormLabels: SettingsFormLabels = {
  save: "Save changes",
  discard: "Discard",
  saving: "Saving…",
  unsaved: "You have unsaved changes",
  saved: "No unsaved changes",
};

type SettingsFormContextValue = {
  isDirty: boolean;
  isPending: boolean;
  onReset?: () => void;
  labels: SettingsFormLabels;
};

const SettingsFormContext = React.createContext<SettingsFormContextValue | null>(null);

function useSettingsForm() {
  const context = React.useContext(SettingsFormContext);
  if (!context) throw new Error("SettingsForm parts must be used within a SettingsForm.");
  return context;
}

type SettingsFormProps = Omit<React.ComponentProps<typeof Form>, "onReset"> & {
  /** Whether anything changed since the last save; enables Save and Discard. */
  isDirty?: boolean;
  /** While saving: Save shows a spinner and both actions wait. */
  isPending?: boolean;
  /** Shows a Discard button that calls it (restore the saved values here). */
  onReset?: () => void;
  i18n?: SettingsFormI18n;
};

/**
 * A long edit form split into sections, saved as a whole. The state stays in
 * the app (react-hook-form's `formState.isDirty`, a mutation's `isPending`);
 * the form only shows it. Put `SettingsSection`s inside and end with a
 * `SettingsFormFooter`.
 */
function SettingsForm({
  isDirty = false,
  isPending = false,
  onReset,
  i18n,
  className,
  ...props
}: SettingsFormProps) {
  const overrides = i18n?.labels;
  const labels = React.useMemo(() => ({ ...defaultSettingsFormLabels, ...overrides }), [overrides]);
  const context = React.useMemo(
    () => ({ isDirty, isPending, onReset, labels }),
    [isDirty, isPending, onReset, labels],
  );

  return (
    <SettingsFormContext.Provider value={context}>
      <Form
        data-slot="settings-form"
        aria-busy={isPending || undefined}
        className={cn("@container/settings-form flex w-full min-w-0 flex-col", className)}
        {...props}
      />
    </SettingsFormContext.Provider>
  );
}

/**
 * One group of settings: title and description above its fields, which sit
 * in a two-column grid when there's room; give a field `col-span-full` to
 * take the whole row.
 */
function SettingsSection({
  title,
  description,
  headingLevel = 2,
  className,
  contentClassName,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  contentClassName?: string;
}) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-slot="settings-section"
      className={cn("grid gap-4 border-b py-8 first:pt-0 last-of-type:border-b-0", className)}
      {...props}
    >
      <div data-slot="settings-section-header" className="flex flex-col gap-1">
        <Heading id={titleId} className="text-base font-medium">
          {title}
        </Heading>
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="@container/settings-section min-w-0">
        <div
          data-slot="settings-section-content"
          className={cn("grid gap-4 @md/settings-section:grid-cols-2", contentClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * The save bar, stuck to the bottom of the viewport while the form scrolls:
 * the save state (announced politely), Discard when the form has `onReset`,
 * and Save. `children` go before the buttons (a "last saved" note, a help link).
 */
function SettingsFormFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  const { isDirty, isPending, onReset, labels } = useSettingsForm();
  const status = isPending ? labels.saving : isDirty ? labels.unsaved : labels.saved;

  return (
    <div
      data-slot="settings-form-footer"
      className={cn(
        "sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t bg-background py-3",
        className,
      )}
      {...props}
    >
      <p
        role="status"
        data-dirty={isDirty || undefined}
        className="mr-auto text-sm text-muted-foreground data-dirty:text-foreground"
      >
        {status}
      </p>
      {children}
      <div className="ml-auto flex items-center gap-2">
        {onReset && (
          <Button variant="outline" isDisabled={!isDirty || isPending} onPress={onReset}>
            {labels.discard}
          </Button>
        )}
        <Button type="submit" isDisabled={!isDirty} isPending={isPending}>
          {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
          {labels.save}
        </Button>
      </div>
    </div>
  );
}

export type { SettingsFormI18n, SettingsFormLabels, SettingsFormProps };
export { SettingsForm, SettingsFormFooter, SettingsSection };
