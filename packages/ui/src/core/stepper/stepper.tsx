"use client";

import { cn } from "cn";
import * as React from "react";
import {
  composeRenderProps,
  Tab,
  TabList,
  type TabListProps,
  TabPanel,
  type TabPanelProps,
  Tabs,
  type TabsProps,
} from "react-aria-components";

type StepState = "active" | "completed" | "inactive";

type StepIndicators = {
  active?: React.ReactNode;
  completed?: React.ReactNode;
  inactive?: React.ReactNode;
  loading?: React.ReactNode;
};

// Provided above the TabList, so it also reaches StepperItem while react-aria
// builds the collection (TabListStateContext doesn't exist yet there).
const StepperContext = React.createContext<{ activeStep: number; indicators: StepIndicators }>({
  activeStep: 1,
  indicators: {},
});

type StepItemContextValue = { step: number; state: StepState; isLoading: boolean };

const StepItemContext = React.createContext<StepItemContextValue | null>(null);

function useStepItem() {
  const context = React.useContext(StepItemContext);
  if (!context) throw new Error("Stepper parts must be used within a StepperItem");
  return context;
}

type StepperProps = Omit<
  TabsProps,
  "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "keyboardActivation"
> & {
  /** The current step (controlled). */
  value?: number;
  /** The initial step (uncontrolled). */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Replace an indicator's content per state; falls back to its children. */
  indicators?: StepIndicators;
};

/**
 * Built on react-aria `Tabs` with manual activation: arrow keys, Home and End
 * move focus between steps, Enter or Space selects one.
 */
function Stepper({
  value,
  defaultValue = 1,
  onValueChange,
  orientation = "horizontal",
  indicators = {},
  className,
  ...props
}: StepperProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const activeStep = value ?? uncontrolled;
  const context = React.useMemo(() => ({ activeStep, indicators }), [activeStep, indicators]);
  return (
    <StepperContext.Provider value={context}>
      <Tabs
        data-slot="stepper"
        selectedKey={activeStep}
        onSelectionChange={(key) => {
          setUncontrolled(Number(key));
          onValueChange?.(Number(key));
        }}
        orientation={orientation}
        keyboardActivation="manual"
        className={composeRenderProps(className, (className) => cn("w-full", className))}
        {...props}
      />
    </StepperContext.Provider>
  );
}

function StepperNav<T extends object>({ className, ...props }: TabListProps<T>) {
  return (
    <TabList
      data-slot="stepper-nav"
      className={composeRenderProps(className, (className) =>
        cn(
          "group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        ),
      )}
      {...props}
    />
  );
}

type StepperItemProps = Omit<React.ComponentProps<typeof Tab>, "id" | "children"> & {
  step: number;
  /** Marks the step completed even when it isn't before the current one. */
  isCompleted?: boolean;
  /** Shows the loading indicator while this is the current step. */
  isLoading?: boolean;
  children?: React.ReactNode;
};

/** One step: the tab itself, holding its trigger and the separator after it. */
function StepperItem({
  step,
  isCompleted = false,
  isLoading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = React.useContext(StepperContext);
  const state: StepState =
    isCompleted || step < activeStep ? "completed" : step === activeStep ? "active" : "inactive";
  const loading = isLoading && step === activeStep;

  return (
    <Tab
      id={step}
      data-slot="stepper-item"
      data-state={state}
      data-loading={loading || undefined}
      className={composeRenderProps(className, (className) =>
        cn(
          "group/step flex items-center justify-center outline-none not-last:flex-1 group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col group-data-[orientation=vertical]/stepper-nav:items-start data-disabled:opacity-60",
          className,
        ),
      )}
      {...props}
    >
      <StepItemContext.Provider value={{ step, state, isLoading: loading }}>
        {children}
      </StepItemContext.Provider>
    </Tab>
  );
}

/** The clickable-looking part of a step; carries the focus ring. */
// In vertical steppers the separator's start margin (11px) centers it under
// the 24px indicator, so keep the indicator first in the trigger.
function StepperTrigger({ className, ...props }: React.ComponentProps<"span">) {
  const { state, isLoading } = useStepItem();
  return (
    <span
      data-slot="stepper-trigger"
      data-state={state}
      data-loading={isLoading || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2.5 rounded-full group-data-disabled/step:cursor-default group-data-focus-visible/step:z-10 group-data-focus-visible/step:ring-3 group-data-focus-visible/step:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function StepperIndicator({ className, children, ...props }: React.ComponentProps<"div">) {
  const { state, isLoading } = useStepItem();
  const { indicators } = React.useContext(StepperContext);
  const custom = (isLoading && indicators.loading) || indicators[state];

  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-background bg-accent text-xs text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <div className="absolute">{custom || children}</div>
    </div>
  );
}

function StepperSeparator({ className, ...props }: React.ComponentProps<"div">) {
  const { state } = useStepItem();
  return (
    <div
      aria-hidden="true"
      data-slot="stepper-separator"
      data-state={state}
      className={cn(
        "m-0.5 rounded-sm bg-muted data-[state=completed]:bg-primary group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1 group-data-[orientation=vertical]/stepper-nav:ms-[11px] group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5",
        className,
      )}
      {...props}
    />
  );
}

function StepperTitle({ className, ...props }: React.ComponentProps<"h3">) {
  const { state } = useStepItem();
  return (
    <h3
      data-slot="stepper-title"
      data-state={state}
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  );
}

function StepperDescription({ className, ...props }: React.ComponentProps<"div">) {
  const { state } = useStepItem();
  return (
    <div
      data-slot="stepper-description"
      data-state={state}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function StepperPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="stepper-panel" className={cn("w-full", className)} {...props} />;
}

type StepperContentProps = Omit<TabPanelProps, "id"> & {
  /** The step this content belongs to. */
  value: number;
};

/** A step's content, shown while that step is current. `shouldForceMount` keeps it mounted. */
function StepperContent({ value, className, ...props }: StepperContentProps) {
  return (
    <TabPanel
      id={value}
      data-slot="stepper-content"
      className={composeRenderProps(className, (className) =>
        cn("w-full outline-none data-inert:hidden", className),
      )}
      {...props}
    />
  );
}

export type { StepperContentProps, StepperItemProps, StepperProps };
export {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  useStepItem,
};
