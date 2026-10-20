"use client";

import { cn } from "cn";
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/accordion/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/card/card";
import { IconTile } from "@/core/icon-tile/icon-tile";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Slider, type SliderProps } from "@/core/slider/slider";
import { Switch } from "@/core/switch/switch";

type PlanBuilderLabels = {
  /** The trigger of a resource's "what's included" accordion. */
  included: string;
};

type PlanBuilderI18n = { labels?: Partial<PlanBuilderLabels> };

const defaultPlanBuilderLabels: PlanBuilderLabels = { included: "What's included" };

const PlanBuilderContext = React.createContext<{
  isCalculating: boolean;
  labels: PlanBuilderLabels;
}>({ isCalculating: false, labels: defaultPlanBuilderLabels });

type PlanBuilderProps = React.ComponentProps<"div"> & {
  /** The side column: an `OrderSummary` with the lines, the total and the action. */
  summary: React.ReactNode;
  /** While the app recalculates the price; every `PlanPrice` shows a skeleton. */
  isCalculating?: boolean;
  i18n?: PlanBuilderI18n;
};

/**
 * Builds what the user is about to buy: the resources (`PlanResource`) on the
 * left and the `summary` on the right, which sticks on large screens and
 * becomes the `OrderSummary` bar fixed to the bottom on smaller ones (the
 * bottom padding leaves room for it). The price comes from the app.
 */
function PlanBuilder({
  summary,
  isCalculating = false,
  i18n,
  className,
  children,
  ...props
}: PlanBuilderProps) {
  const included = i18n?.labels?.included ?? defaultPlanBuilderLabels.included;
  const context = React.useMemo(
    () => ({ isCalculating, labels: { included } }),
    [isCalculating, included],
  );

  return (
    <PlanBuilderContext.Provider value={context}>
      <div
        data-slot="plan-builder"
        className={cn(
          "grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:pb-0",
          className,
        )}
        {...props}
      >
        <div data-slot="plan-builder-resources" className="flex min-w-0 flex-col gap-4">
          {children}
        </div>
        <div data-slot="plan-builder-summary" aria-busy={isCalculating || undefined}>
          {summary}
        </div>
      </div>
    </PlanBuilderContext.Provider>
  );
}

/** A price formatted by the app; a skeleton while `PlanBuilder` is `isCalculating`. */
function PlanPrice({ className, children, ...props }: React.ComponentProps<"span">) {
  const { isCalculating } = React.useContext(PlanBuilderContext);
  if (isCalculating) {
    return <Skeleton data-slot="plan-price" className={cn("inline-block h-4 w-16", className)} />;
  }
  return (
    <span data-slot="plan-price" className={cn("tabular-nums", className)} {...props}>
      {children}
    </span>
  );
}

type PlanResourceProps = Omit<SliderProps<number>, "label" | "showValue" | "description"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Names the slider: what is being chosen ("Notes per month"). */
  label: React.ReactNode;
  /** Under the slider: why it stops at `limit`, or why it's disabled. */
  hint?: React.ReactNode;
  /** The body of the "what's included" accordion; omitted, there's no accordion. */
  included?: React.ReactNode;
  /** Add-ons for this resource (`PlanResourceAddon`), between the slider and the accordion. */
  children?: React.ReactNode;
};

/**
 * One resource of the plan: what it is, a slider for the quantity (with
 * `marks` for common amounts and an optional `limit`), add-ons and what's
 * included. Controlled like the `Slider` (`value`, `onChange`).
 */
function PlanResource({
  icon,
  title,
  description,
  label,
  hint,
  included,
  children,
  className,
  ...sliderProps
}: PlanResourceProps) {
  const { labels } = React.useContext(PlanBuilderContext);

  return (
    <Card data-slot="plan-resource" className={className}>
      <CardHeader className="flex items-start gap-3">
        {icon && (
          <IconTile variant="soft" className="shrink-0 text-primary">
            {icon}
          </IconTile>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Slider
          {...sliderProps}
          label={label}
          showValue
          description={hint}
          className="**:data-[slot=slider-value]:text-base **:data-[slot=slider-value]:font-semibold **:data-[slot=slider-value]:text-foreground"
        />
        {children}
        {included && (
          <Accordion className="rounded-lg border px-3">
            <AccordionItem>
              <AccordionTrigger>{labels.included}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{included}</AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

/** An add-on of a resource (a module, a validator): a switch with its label and description. */
function PlanResourceAddon({
  label,
  description,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  className,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}) {
  const id = React.useId();

  return (
    <div
      data-slot="plan-resource-addon"
      className={cn("flex items-start gap-3 rounded-lg border p-3", className)}
    >
      <Switch
        id={id}
        isSelected={isSelected}
        defaultSelected={defaultSelected}
        onChange={onChange}
        isDisabled={isDisabled}
        aria-describedby={description ? `${id}-description` : undefined}
        className="mt-0.5"
      />
      <span className="flex flex-col gap-0.5">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && (
          <span id={`${id}-description`} className="text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}

export type { PlanBuilderI18n, PlanBuilderLabels, PlanBuilderProps, PlanResourceProps };
export { PlanBuilder, PlanPrice, PlanResource, PlanResourceAddon };
