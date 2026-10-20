"use client";

import { cn } from "cn";
import { Trash2Icon } from "lucide-react";
import * as React from "react";
import {
  FieldError,
  Form,
  Text,
  TextField,
  type TextFieldProps,
  type ValidationResult,
} from "react-aria-components";
import { Button } from "@/core/button/button";
import { ConfirmDialog } from "@/core/confirm-dialog/confirm-dialog";
import {
  CreditCard,
  type CreditCardField,
  type CreditCardProps,
} from "@/core/credit-card/credit-card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/core/description-list/description-list";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { MaskedInput } from "@/core/masked-input/masked-input";
import { useDialogPromise } from "@/hooks/use-dialog-promise";
import { getCreditCardIssuer, getCreditCardIssuerById } from "@/lib/credit-card-validation";

/* -------------------------------------------------------------------------- */
/*                                Saved card                                  */
/* -------------------------------------------------------------------------- */

type PaymentCardDetailsLabels = {
  issuer: string;
  number: string;
  holder: string;
  expiry: string;
};

const defaultPaymentCardDetailsLabels: PaymentCardDetailsLabels = {
  issuer: "Card",
  number: "Number",
  holder: "Name on card",
  expiry: "Expires",
};

type PaymentCardDetailsProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The number as the gateway returns it, digits hidden with `*` or `x`. */
  number: string;
  /** The issuer id (`visa`, `mastercard`, `amex`…). */
  issuer?: string;
  name?: string;
  /** `MM/YY`, `MM/YYYY` or digits only. */
  expiry?: string;
  /** Actions under the details, such as `PaymentCardRemove`. */
  actions?: React.ReactNode;
  i18n?: {
    labels?: Partial<PaymentCardDetailsLabels>;
    card?: CreditCardProps["labels"];
  };
};

/** `MM/YY` from the formats `CreditCard` takes. */
function formatExpiry(expiry: string) {
  const [month = "", year = ""] = expiry.includes("/")
    ? expiry.split("/")
    : [expiry.slice(0, 2), expiry.slice(2)];
  return `${month}/${year.slice(-2)}`;
}

/**
 * A saved card: the card drawn beside its details (issuer, last digits,
 * holder, expiry), with its actions under them.
 */
function PaymentCardDetails({
  number,
  issuer,
  name,
  expiry,
  actions,
  i18n,
  className,
  ...props
}: PaymentCardDetailsProps) {
  const labels = { ...defaultPaymentCardDetailsLabels, ...i18n?.labels };
  const info = issuer ? getCreditCardIssuerById(issuer) : getCreditCardIssuer(number);
  const lastDigits = /(\d{4})\D*$/.exec(number)?.[1];

  return (
    <div
      data-slot="payment-card-details"
      className={cn("@container flex flex-wrap items-start gap-x-8 gap-y-6", className)}
      {...props}
    >
      <CreditCard
        number={number}
        issuer={issuer}
        name={name}
        expiry={expiry}
        labels={i18n?.card}
        className="w-full max-w-72"
      />
      <div className="flex min-w-56 flex-1 flex-col gap-6">
        <DescriptionList>
          {info && (
            <DescriptionItem>
              <DescriptionTerm>{labels.issuer}</DescriptionTerm>
              <DescriptionDetails>{info.niceType}</DescriptionDetails>
            </DescriptionItem>
          )}
          {lastDigits && (
            <DescriptionItem>
              <DescriptionTerm>{labels.number}</DescriptionTerm>
              <DescriptionDetails className="tabular-nums">•••• {lastDigits}</DescriptionDetails>
            </DescriptionItem>
          )}
          {name && (
            <DescriptionItem>
              <DescriptionTerm>{labels.holder}</DescriptionTerm>
              <DescriptionDetails className="uppercase">{name}</DescriptionDetails>
            </DescriptionItem>
          )}
          {expiry && (
            <DescriptionItem>
              <DescriptionTerm>{labels.expiry}</DescriptionTerm>
              <DescriptionDetails className="tabular-nums">
                {formatExpiry(expiry)}
              </DescriptionDetails>
            </DescriptionItem>
          )}
        </DescriptionList>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

type PaymentCardRemoveLabels = {
  remove: string;
  confirmTitle: string;
  confirmDescription: string;
  confirm: string;
  cancel: string;
  pending: string;
  error: string;
};

const defaultPaymentCardRemoveLabels: PaymentCardRemoveLabels = {
  remove: "Remove card",
  confirmTitle: "Remove this card?",
  confirmDescription: "You'll need to add a card again to pay with one.",
  confirm: "Remove card",
  cancel: "Cancel",
  pending: "Removing…",
  error: "The card couldn't be removed. Please try again.",
};

type PaymentCardRemoveProps = Omit<
  React.ComponentProps<typeof Button>,
  "onPress" | "children" | "variant"
> & {
  /**
   * Removes the card, after the user confirms. The dialog stays open and
   * pending until it settles; if it throws, the dialog shows the error.
   */
  onRemove: () => Promise<void> | void;
  i18n?: { labels?: Partial<PaymentCardRemoveLabels> };
};

/** The destructive button that asks for confirmation, then runs `onRemove`. */
function PaymentCardRemove({ onRemove, i18n, className, ...props }: PaymentCardRemoveProps) {
  const labels = { ...defaultPaymentCardRemoveLabels, ...i18n?.labels };
  const dialog = useDialogPromise();

  return (
    <>
      <Button
        variant="destructive"
        className={className}
        onPress={() => void dialog.open()}
        {...props}
      >
        <Trash2Icon aria-hidden="true" />
        {labels.remove}
      </Button>
      <ConfirmDialog
        controller={dialog}
        tone="destructive"
        media={<Trash2Icon />}
        title={labels.confirmTitle}
        description={labels.confirmDescription}
        confirmLabel={labels.confirm}
        cancelLabel={labels.cancel}
        pendingLabel={labels.pending}
        errorMessage={labels.error}
        onConfirm={onRemove}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  New card                                  */
/* -------------------------------------------------------------------------- */

type PaymentCardValueKey = "number" | "name" | "firstName" | "lastName" | "expiry" | "cvc";

type PaymentCardFormContextValue = {
  values: Partial<Record<PaymentCardValueKey, string>>;
  focused: CreditCardField | null;
  setValue: (key: PaymentCardValueKey, value: string) => void;
  setFocused: (field: CreditCardField | null) => void;
};

const PaymentCardFormContext = React.createContext<PaymentCardFormContextValue | null>(null);

type PaymentCardFormProps = React.ComponentProps<typeof Form>;

/**
 * The new-card form: a react-aria `Form` that lays the preview
 * (`PaymentCardPreview`) beside the fields (`PaymentCardFields`) and stacks
 * them when narrow. The fields inside tell the preview what they hold and
 * which one has focus.
 */
function PaymentCardForm({ className, ...props }: PaymentCardFormProps) {
  const [values, setValues] = React.useState<PaymentCardFormContextValue["values"]>({});
  const [focused, setFocused] = React.useState<CreditCardField | null>(null);
  const setValue = React.useCallback((key: PaymentCardValueKey, value: string) => {
    setValues((current) => (current[key] === value ? current : { ...current, [key]: value }));
  }, []);
  const context = React.useMemo(
    () => ({ values, focused, setValue, setFocused }),
    [values, focused, setValue],
  );

  return (
    <PaymentCardFormContext.Provider value={context}>
      <div data-slot="payment-card-form" className="@container">
        <Form
          className={cn(
            "flex flex-col items-center gap-8 @2xl:flex-row @2xl:items-start",
            className,
          )}
          {...props}
        />
      </div>
    </PaymentCardFormContext.Provider>
  );
}

type PaymentCardPreviewProps = Omit<
  CreditCardProps,
  "number" | "name" | "expiry" | "cvc" | "focused"
>;

/** The card drawn from the fields of its `PaymentCardForm`, turning to the code. */
function PaymentCardPreview({ className, ...props }: PaymentCardPreviewProps) {
  const context = React.useContext(PaymentCardFormContext);
  if (!context) throw new Error("PaymentCardPreview must be used within a PaymentCardForm.");
  const { values, focused } = context;
  const name = values.name ?? [values.firstName, values.lastName].filter(Boolean).join(" ");

  return (
    <CreditCard
      number={values.number}
      name={name}
      expiry={values.expiry}
      cvc={values.cvc}
      focused={focused}
      className={cn("w-full max-w-72 shrink-0", className)}
      {...props}
    />
  );
}

/** The fields' grid: number and name on full rows, expiry and code side by side. */
function PaymentCardFields({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="payment-card-fields"
      className={cn("grid w-full max-w-lg grid-cols-2 gap-4", className)}
      {...props}
    />
  );
}

type PaymentCardFieldProps = Omit<TextFieldProps, "children" | "className"> & {
  /** Replaces the built-in English label. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Shown while invalid; by default the validation message. */
  errorMessage?: React.ReactNode | ((validation: ValidationResult) => React.ReactNode);
  placeholder?: string;
  className?: string;
};

/**
 * The value of a field, controlled or not, reported to the form's preview
 * with its focus.
 */
function usePaymentCardField(
  key: PaymentCardValueKey,
  focusAs: CreditCardField,
  { value, defaultValue, onChange, onFocus, onBlur }: PaymentCardFieldProps,
  transform: (value: string) => string = (next) => next,
) {
  const context = React.useContext(PaymentCardFormContext);
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const current = value ?? uncontrolled;
  const setValue = context?.setValue;
  const setFocused = context?.setFocused;

  React.useEffect(() => {
    setValue?.(key, current);
  }, [setValue, key, current]);

  return {
    value: current,
    onChange: (next: string) => {
      const transformed = transform(next);
      setUncontrolled(transformed);
      onChange?.(transformed);
    },
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused?.(focusAs);
      onFocus?.(event);
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused?.(null);
      onBlur?.(event);
    },
  };
}

/** The field around an input: label, description and error, wired by react-aria. */
function PaymentCardTextField({
  label,
  description,
  errorMessage,
  className,
  field,
  children,
  // Handled by `field`, or by the input inside.
  value: _value,
  defaultValue: _defaultValue,
  onChange: _onChange,
  onFocus: _onFocus,
  onBlur: _onBlur,
  placeholder: _placeholder,
  ...props
}: PaymentCardFieldProps & {
  field: ReturnType<typeof usePaymentCardField>;
  children: React.ReactNode;
}) {
  return (
    <TextField {...props} {...field} className={cn("col-span-2 flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      {children}
      {description && (
        <Text slot="description" className="text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      <FieldError className="text-sm text-destructive">{errorMessage}</FieldError>
    </TextField>
  );
}

/**
 * The card number, masked by issuer (Amex 4-6-5). Its value is the masked
 * text; `isValidCreditCardNumber` takes it as is.
 */
function PaymentCardNumberField({
  label = "Card number",
  placeholder,
  ...props
}: PaymentCardFieldProps) {
  const field = usePaymentCardField("number", "number", props);
  return (
    <PaymentCardTextField {...props} label={label} field={field}>
      <MaskedInput
        mask="credit-card"
        autoComplete="cc-number"
        {...(placeholder !== undefined && { placeholder })}
      />
    </PaymentCardTextField>
  );
}

const NAME_PARTS = {
  full: { key: "name", label: "Name on card", autoComplete: "cc-name", span: "col-span-2" },
  first: {
    key: "firstName",
    label: "First name",
    autoComplete: "cc-given-name",
    span: "col-span-1",
  },
  last: { key: "lastName", label: "Last name", autoComplete: "cc-family-name", span: "col-span-1" },
} as const;

/**
 * The holder's name as printed on the card. `part="first"` and `part="last"`
 * split it in two fields, for gateways that take them apart; the preview
 * joins them.
 */
function PaymentCardNameField({
  part = "full",
  label,
  placeholder,
  className,
  ...props
}: PaymentCardFieldProps & { part?: keyof typeof NAME_PARTS }) {
  const config = NAME_PARTS[part];
  const field = usePaymentCardField(config.key, "name", props);
  return (
    <PaymentCardTextField
      {...props}
      label={label ?? config.label}
      field={field}
      className={cn(config.span, className)}
    >
      <Input autoComplete={config.autoComplete} placeholder={placeholder} />
    </PaymentCardTextField>
  );
}

/** The expiry as `MM/YY`; `isValidCreditCardExpiry` checks it hasn't passed. */
function PaymentCardExpiryField({
  label = "Expiry date",
  placeholder = "MM/YY",
  className,
  ...props
}: PaymentCardFieldProps) {
  const field = usePaymentCardField("expiry", "expiry", props);
  return (
    <PaymentCardTextField
      {...props}
      label={label}
      field={field}
      className={cn("col-span-1", className)}
    >
      <MaskedInput
        mask={{ type: "date", mode: "mm/yy" }}
        autoComplete="cc-exp"
        placeholder={placeholder}
      />
    </PaymentCardTextField>
  );
}

/**
 * The security code: digits only, as many as the issuer of the number
 * typed in the same form prints (Amex 4, most 3; up to 4 while unknown).
 */
function PaymentCardCodeField({
  label = "Security code",
  placeholder,
  className,
  ...props
}: PaymentCardFieldProps) {
  const context = React.useContext(PaymentCardFormContext);
  const size = getCreditCardIssuer(context?.values.number ?? "")?.code.size ?? 4;
  const field = usePaymentCardField("cvc", "cvc", props, (next) =>
    next.replace(/\D/g, "").slice(0, size),
  );
  return (
    <PaymentCardTextField
      {...props}
      label={label}
      field={field}
      className={cn("col-span-1", className)}
    >
      <Input
        inputMode="numeric"
        autoComplete="cc-csc"
        maxLength={size}
        placeholder={placeholder ?? "•".repeat(size === 4 ? 4 : 3)}
      />
    </PaymentCardTextField>
  );
}

export type {
  PaymentCardDetailsLabels,
  PaymentCardDetailsProps,
  PaymentCardFieldProps,
  PaymentCardFormProps,
  PaymentCardPreviewProps,
  PaymentCardRemoveLabels,
  PaymentCardRemoveProps,
};
export {
  PaymentCardCodeField,
  PaymentCardDetails,
  PaymentCardExpiryField,
  PaymentCardFields,
  PaymentCardForm,
  PaymentCardNameField,
  PaymentCardNumberField,
  PaymentCardPreview,
  PaymentCardRemove,
};
