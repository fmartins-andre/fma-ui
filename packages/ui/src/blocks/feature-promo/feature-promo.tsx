"use client";

import { cn } from "cn";
import * as React from "react";
import { ButtonContext, type CheckboxProps, LinkContext } from "react-aria-components";
import { CheckboxCard } from "@/core/checkbox/checkbox";
import { IconTile } from "@/core/icon-tile/icon-tile";

type FeaturePromoContextValue = {
  isAccepted: boolean;
  setAccepted: (isAccepted: boolean) => void;
  hasAcceptance: boolean;
  registerAcceptance: () => () => void;
};

const FeaturePromoContext = React.createContext<FeaturePromoContextValue | null>(null);

function useFeaturePromo(part: string) {
  const context = React.useContext(FeaturePromoContext);
  if (!context) throw new Error(`${part} must be used within FeaturePromo`);
  return context;
}

/**
 * A locked feature or an offer on a card surface. `split` puts the content on
 * the left and the `FeaturePromoMedia` on the right (hidden when the card is
 * narrow); `centered` stacks everything in the middle. A `FeaturePromoGrid`
 * spans the full width below the content in both.
 *
 * With a `FeaturePromoAcceptance` inside, the buttons in `FeaturePromoActions`
 * stay disabled until it's checked; the state is uncontrolled
 * (`defaultAccepted`) or controlled (`isAccepted` + `onAcceptedChange`).
 */
function FeaturePromo({
  layout = "split",
  isAccepted: isAcceptedProp,
  defaultAccepted = false,
  onAcceptedChange,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  layout?: "split" | "centered";
  isAccepted?: boolean;
  defaultAccepted?: boolean;
  onAcceptedChange?: (isAccepted: boolean) => void;
}) {
  const [uncontrolledAccepted, setUncontrolledAccepted] = React.useState(defaultAccepted);
  const isAccepted = isAcceptedProp ?? uncontrolledAccepted;
  const [acceptanceCount, setAcceptanceCount] = React.useState(0);
  const registerAcceptance = React.useCallback(() => {
    setAcceptanceCount((count) => count + 1);
    return () => setAcceptanceCount((count) => count - 1);
  }, []);

  const context = React.useMemo<FeaturePromoContextValue>(
    () => ({
      isAccepted,
      setAccepted: (next) => {
        setUncontrolledAccepted(next);
        onAcceptedChange?.(next);
      },
      hasAcceptance: acceptanceCount > 0,
      registerAcceptance,
    }),
    [isAccepted, onAcceptedChange, acceptanceCount, registerAcceptance],
  );

  return (
    <FeaturePromoContext.Provider value={context}>
      <section
        data-slot="feature-promo"
        data-layout={layout}
        className={cn(
          "group/feature-promo @container w-full overflow-hidden rounded-xl bg-card p-6 text-sm text-card-foreground ring-1 ring-foreground/10",
          className,
        )}
        {...props}
      >
        <div className="grid gap-8 group-data-[layout=split]/feature-promo:@3xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
          {children}
        </div>
      </section>
    </FeaturePromoContext.Provider>
  );
}

/**
 * Wraps the content parts. Put it, the media and the grid directly inside
 * `FeaturePromo`; the layout places them.
 */
function FeaturePromoContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-promo-content"
      className={cn(
        "flex flex-col gap-4",
        "group-data-[layout=centered]/feature-promo:mx-auto group-data-[layout=centered]/feature-promo:max-w-2xl group-data-[layout=centered]/feature-promo:items-center group-data-[layout=centered]/feature-promo:text-center",
        "[&_[data-slot=feature-promo-acceptance]]:text-left",
        className,
      )}
      {...props}
    />
  );
}

/** The promo's heading, an `h2` (the page header holds the `h1`). */
function FeaturePromoTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="feature-promo-title"
      className={cn(
        "font-heading text-xl leading-snug font-semibold text-balance @3xl:text-2xl",
        className,
      )}
      {...props}
    />
  );
}

/** A paragraph of supporting text; use several for longer copy. */
function FeaturePromoDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="feature-promo-description"
      className={cn("text-base text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

/** The list of what the feature gives, one `FeaturePromoBenefit` per item. */
function FeaturePromoBenefits({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="feature-promo-benefits"
      className={cn(
        "flex flex-col gap-3 py-1 text-left group-data-[layout=centered]/feature-promo:w-fit",
        className,
      )}
      {...props}
    />
  );
}

/** One benefit: the `icon` in a tinted round tile, then the text. */
function FeaturePromoBenefit({
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<"li"> & { icon: React.ReactNode }) {
  return (
    <li
      data-slot="feature-promo-benefit"
      className={cn("flex items-center gap-3 text-base font-medium", className)}
      {...props}
    >
      <IconTile variant="soft" radius="full" aria-hidden="true">
        {icon}
      </IconTile>
      <span>{children}</span>
    </li>
  );
}

/**
 * A checkbox card the user must check before the actions unlock ("I
 * understand…"). Its state lives on `FeaturePromo`.
 */
function FeaturePromoAcceptance(
  props: Omit<CheckboxProps, "isSelected" | "defaultSelected" | "onChange">,
) {
  const { isAccepted, setAccepted, registerAcceptance } = useFeaturePromo("FeaturePromoAcceptance");

  React.useLayoutEffect(registerAcceptance, [registerAcceptance]);

  return (
    <CheckboxCard
      data-slot="feature-promo-acceptance"
      isSelected={isAccepted}
      onChange={setAccepted}
      {...props}
    />
  );
}

/**
 * The calls to action: `Button`s or `LinkButton`s. While a
 * `FeaturePromoAcceptance` is unchecked they are disabled, unless a button
 * sets its own `isDisabled`.
 */
function FeaturePromoActions({ className, ...props }: React.ComponentProps<"div">) {
  const { isAccepted, hasAcceptance } = useFeaturePromo("FeaturePromoActions");
  const isDisabled = hasAcceptance && !isAccepted;

  return (
    <ButtonContext.Provider value={{ isDisabled }}>
      <LinkContext.Provider value={{ isDisabled }}>
        <div
          data-slot="feature-promo-actions"
          className={cn(
            "flex flex-wrap gap-2 pt-2 group-data-[layout=centered]/feature-promo:justify-center",
            "[&_a[data-disabled]]:pointer-events-none [&_a[data-disabled]]:opacity-50",
            className,
          )}
          {...props}
        />
      </LinkContext.Provider>
    </ButtonContext.Provider>
  );
}

/**
 * An illustration or product screenshot. Beside the content in `split`
 * (hidden when the card is narrow), below it in `centered`. Decorative by
 * default: give an `img` its own `alt` if it carries information.
 */
function FeaturePromoMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-promo-media"
      className={cn(
        "overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 [&_img]:size-full [&_img]:object-cover [&_img]:object-top-left",
        "group-data-[layout=split]/feature-promo:@max-3xl:hidden",
        "group-data-[layout=centered]/feature-promo:mx-auto group-data-[layout=centered]/feature-promo:w-full group-data-[layout=centered]/feature-promo:max-w-3xl",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Cards below the content, one to three columns by the card's width:
 * `RadioCard`s or `CheckboxCard`s for a choice, `Item`s with `href` for
 * shortcuts, or plain cards that explain options.
 */
function FeaturePromoGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feature-promo-grid"
      className={cn(
        "col-span-full grid gap-3 text-left @xl:grid-cols-2 @3xl:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  FeaturePromo,
  FeaturePromoAcceptance,
  FeaturePromoActions,
  FeaturePromoBenefit,
  FeaturePromoBenefits,
  FeaturePromoContent,
  FeaturePromoDescription,
  FeaturePromoGrid,
  FeaturePromoMedia,
  FeaturePromoTitle,
};
