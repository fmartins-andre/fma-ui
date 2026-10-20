"use client";

import { cn } from "cn";
import { CheckIcon, MinusIcon } from "lucide-react";
import * as React from "react";
import type { RadioGroupProps, RadioProps, ToggleButtonGroupProps } from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { RadioCard, RadioGroup } from "@/core/radio-group/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/core/toggle-group/toggle-group";

type PricingPlansLabels = {
  /** Read before an included feature. */
  included: string;
  /** Read before a feature the plan doesn't have. */
  notIncluded: string;
};

type PricingPlansI18n = { labels?: Partial<PricingPlansLabels> };

const defaultPricingPlansLabels: PricingPlansLabels = {
  included: "Included",
  notIncluded: "Not included",
};

const PricingPlansContext = React.createContext<PricingPlansLabels>(defaultPricingPlansLabels);

type PricingPlansProps = React.ComponentProps<"div"> & {
  /** The side column: an `OrderSummary` with the chosen plan and the action ("Continue"). */
  summary?: React.ReactNode;
  i18n?: PricingPlansI18n;
};

/**
 * Choose one of a few fixed plans, then confirm: the period (`PricingPeriod`)
 * and the plans (`PricingPlanGroup`) on the left, the `summary` on the right,
 * which sticks on large screens and becomes the `OrderSummary` bar fixed to
 * the bottom on smaller ones (the bottom padding leaves room for it). Prices,
 * periods and features come from the app.
 */
function PricingPlans({ summary, i18n, className, children, ...props }: PricingPlansProps) {
  const included = i18n?.labels?.included ?? defaultPricingPlansLabels.included;
  const notIncluded = i18n?.labels?.notIncluded ?? defaultPricingPlansLabels.notIncluded;
  const labels = React.useMemo(() => ({ included, notIncluded }), [included, notIncluded]);

  return (
    <PricingPlansContext.Provider value={labels}>
      <div
        data-slot="pricing-plans"
        className={cn(
          "grid gap-6",
          summary && "pb-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:pb-0",
          className,
        )}
        {...props}
      >
        <div data-slot="pricing-plans-options" className="flex min-w-0 flex-col gap-4">
          {children}
        </div>
        {summary && <div data-slot="pricing-plans-summary">{summary}</div>}
      </div>
    </PricingPlansContext.Provider>
  );
}

type PricingPeriodProps = Omit<
  ToggleButtonGroupProps,
  "selectionMode" | "selectedKeys" | "defaultSelectedKeys" | "onSelectionChange" | "children"
> & {
  /** The selected period's `id`. One is always selected. */
  value: string;
  onChange: (value: string) => void;
  /** `PricingPeriodOption`s. */
  children: React.ReactNode;
};

/** The billing period (monthly, annual): a segmented toggle where one is always selected. */
function PricingPeriod({ value, onChange, className, children, ...props }: PricingPeriodProps) {
  return (
    <ToggleGroup
      data-slot="pricing-period"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (next != null) onChange(String(next));
      }}
      variant="outline"
      spacing={0}
      className={className}
      {...props}
    >
      {children}
    </ToggleGroup>
  );
}

/** One period; `id` is its value. A `Badge` inside can show the saving ("2 months free"). */
function PricingPeriodOption({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupItem> & { id: string }) {
  return (
    <ToggleGroupItem
      data-slot="pricing-period-option"
      className={cn("px-3", className)}
      {...props}
    />
  );
}

/**
 * The plans as a radio group (`value`/`onChange`, named by `aria-label` or a
 * `Label`). One list on small screens; side by side, in equal columns, once
 * its own width fits them.
 */
function PricingPlanGroup({
  className,
  children,
  ...props
}: Omit<RadioGroupProps, "className"> & { className?: string }) {
  return (
    <RadioGroup data-slot="pricing-plan-group" className={cn("@container", className)} {...props}>
      {(renderProps) => (
        <div className="grid gap-4 @2xl:auto-cols-fr @2xl:grid-flow-col">
          {typeof children === "function" ? children(renderProps) : children}
        </div>
      )}
    </RadioGroup>
  );
}

type PricingPlanProps = Omit<RadioProps, "children" | "aria-labelledby" | "aria-describedby"> & {
  name: React.ReactNode;
  description?: React.ReactNode;
  /** The price, formatted by the app ("R$ 59,90"). */
  price: React.ReactNode;
  /** After the price ("/month"). */
  period?: React.ReactNode;
  /** Under the price: the equivalent ("R$ 718,80 per year") or a condition. */
  priceNote?: React.ReactNode;
  /** A `Badge` beside the name ("Most popular"). */
  badge?: React.ReactNode;
  /** Highlights the plan with a `primary` border (with `badge`, so it isn't color alone). */
  isFeatured?: boolean;
  /** `PricingPlanFeature`s. */
  children?: React.ReactNode;
};

/**
 * One plan as a card the user selects: name, badge, description, price and
 * the features. The radio is named by the plan's name and described by its
 * price and badge; the features stay readable in the card.
 */
function PricingPlan({
  name,
  description,
  price,
  period,
  priceNote,
  badge,
  isFeatured = false,
  className,
  children,
  ...props
}: PricingPlanProps) {
  const id = React.useId();
  const nameId = `${id}-name`;
  const priceId = `${id}-price`;
  const badgeId = `${id}-badge`;

  return (
    <RadioCard
      data-slot="pricing-plan"
      data-featured={isFeatured || undefined}
      aria-labelledby={nameId}
      aria-describedby={badge ? `${priceId} ${badgeId}` : priceId}
      className={cn(
        "h-full",
        isFeatured && "border-primary data-selected:border-primary",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span id={nameId} className="text-base font-medium">
              {name}
            </span>
            {badge && <Badge id={badgeId}>{badge}</Badge>}
          </div>
          {description && <span className="text-muted-foreground">{description}</span>}
        </div>
        <div id={priceId} className="flex flex-col gap-0.5">
          <span>
            <span className="text-2xl font-semibold tabular-nums">{price}</span>
            {period && <span className="text-muted-foreground"> {period}</span>}
          </span>
          {priceNote && <span className="text-xs text-muted-foreground">{priceNote}</span>}
        </div>
        {children && (
          <ul data-slot="pricing-plan-features" className="flex flex-col gap-2 border-t pt-4">
            {children}
          </ul>
        )}
      </div>
    </RadioCard>
  );
}

/**
 * A feature of a plan: a check when included, a dash and muted text when not.
 * The state is read too ("Not included: …"), not only drawn.
 */
function PricingPlanFeature({
  isIncluded = true,
  className,
  children,
  ...props
}: React.ComponentProps<"li"> & { isIncluded?: boolean }) {
  const labels = React.useContext(PricingPlansContext);
  return (
    <li
      data-slot="pricing-plan-feature"
      data-included={isIncluded}
      className={cn("flex items-start gap-2", !isIncluded && "text-muted-foreground", className)}
      {...props}
    >
      {isIncluded ? (
        <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <MinusIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span>
        <span className="sr-only">{isIncluded ? labels.included : labels.notIncluded}: </span>
        {children}
      </span>
    </li>
  );
}

export type { PricingPlanProps, PricingPlansI18n, PricingPlansLabels, PricingPlansProps };
export {
  PricingPeriod,
  PricingPeriodOption,
  PricingPlan,
  PricingPlanFeature,
  PricingPlanGroup,
  PricingPlans,
};
