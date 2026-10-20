"use client";

import { cn } from "cn";
import { ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/core/card/card";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "@/core/description-list/description-list";
import { Separator } from "@/core/separator/separator";
import { Sheet, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/core/sheet/sheet";
import { Switch } from "@/core/switch/switch";

type OrderSummaryLabels = {
  /** The mobile bar's button that opens the details. */
  details: string;
};

type OrderSummaryI18n = { labels?: Partial<OrderSummaryLabels> };

const defaultOrderSummaryLabels: OrderSummaryLabels = { details: "View details" };

type OrderSummaryProps = Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  totalLabel: React.ReactNode;
  /** The total, formatted by the app. */
  total: React.ReactNode;
  /** Under the total: billing period, installments. */
  totalDescription?: React.ReactNode;
  /** The confirm button; rendered in the card, the mobile bar and its sheet. */
  action: React.ReactNode;
  i18n?: OrderSummaryI18n;
};

function OrderSummaryTotal({
  label,
  value,
  description,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div data-slot="order-summary-total" className="flex items-baseline justify-between gap-4">
      <span className="text-base font-medium">{label}</span>
      <span className="flex flex-col items-end">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
    </div>
  );
}

/**
 * What the user is about to confirm: the lines (`OrderSummaryLine`,
 * `OrderSummaryOption`), the total and the action.
 * On large screens it's a card that sticks while the page scrolls (place it
 * in the side column); smaller, a bar fixed to the bottom shows the total and
 * the action, and opens the lines in a sheet. Leave room under the page
 * content for the bar (`pb-24 lg:pb-0`).
 */
function OrderSummary({
  title,
  totalLabel,
  total,
  totalDescription,
  action,
  i18n,
  className,
  children,
  ...props
}: OrderSummaryProps) {
  const labels = { ...defaultOrderSummaryLabels, ...i18n?.labels };
  const totalBlock = (
    <OrderSummaryTotal label={totalLabel} value={total} description={totalDescription} />
  );

  return (
    <div data-slot="order-summary" className={cn("lg:sticky lg:top-4", className)} {...props}>
      <Card className="hidden lg:flex">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DescriptionList>{children}</DescriptionList>
          <Separator />
          {totalBlock}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2 border-t bg-transparent *:w-full">
          {action}
        </CardFooter>
      </Card>

      <div
        data-slot="order-summary-bar"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-background px-4 py-3 lg:hidden"
      >
        <SheetTrigger>
          <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start px-2 py-1">
            <span className="flex min-w-0 flex-col items-start">
              <span className="text-xs text-muted-foreground">{totalLabel}</span>
              <span className="text-base font-semibold tabular-nums">{total}</span>
            </span>
            <ChevronUpIcon aria-hidden="true" className="text-muted-foreground" />
            <span className="sr-only">{labels.details}</span>
          </Button>
          <Sheet side="bottom" className="max-h-[85svh]">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <DescriptionList>{children}</DescriptionList>
              <Separator />
              {totalBlock}
            </div>
            <SheetFooter>{action}</SheetFooter>
          </Sheet>
        </SheetTrigger>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

/**
 * One line: an item, a fee, a discount (pass a negative value, e.g.
 * "− R$ 20,00", and `tone="discount"`), or who the order is for
 * (`description` under the label).
 */
function OrderSummaryLine({
  label,
  value,
  description,
  tone = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  tone?: "default" | "discount";
}) {
  return (
    <DescriptionItem
      data-slot="order-summary-line"
      data-tone={tone}
      className={className}
      {...props}
    >
      <DescriptionTerm className="flex-col items-start gap-0.5 text-foreground">
        {label}
        {description && (
          <span className="text-xs font-normal text-muted-foreground">{description}</span>
        )}
      </DescriptionTerm>
      <DescriptionDetails className={cn(tone === "discount" && "text-success")}>
        {value}
      </DescriptionDetails>
    </DescriptionItem>
  );
}

/**
 * A benefit the user can apply (account balance, a gift): a switch with its
 * label and the amount it takes off, muted while off.
 */
function OrderSummaryOption({
  label,
  description,
  value,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  value: React.ReactNode;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}) {
  const id = React.useId();
  const [uncontrolled, setUncontrolled] = React.useState(defaultSelected ?? false);
  const selected = isSelected ?? uncontrolled;

  return (
    <DescriptionItem
      data-slot="order-summary-option"
      data-selected={selected || undefined}
      className={cn("items-center", className)}
    >
      <DescriptionTerm className="items-start gap-2 text-foreground">
        <Switch
          id={id}
          isSelected={selected}
          isDisabled={isDisabled}
          onChange={(next) => {
            setUncontrolled(next);
            onChange?.(next);
          }}
          aria-describedby={description ? `${id}-description` : undefined}
          className="mt-0.5"
        />
        <span className="flex flex-col gap-0.5">
          <label htmlFor={id}>{label}</label>
          {description && (
            <span id={`${id}-description`} className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </DescriptionTerm>
      <DescriptionDetails
        className={cn(selected ? "text-success" : "text-muted-foreground line-through")}
      >
        {value}
      </DescriptionDetails>
    </DescriptionItem>
  );
}

export type { OrderSummaryI18n, OrderSummaryLabels, OrderSummaryProps };
export { OrderSummary, OrderSummaryLine, OrderSummaryOption };
