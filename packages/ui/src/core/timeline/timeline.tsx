"use client";

import { cn } from "cn";
import * as React from "react";

const TimelineContext = React.createContext<number | null>(null);

function useActiveStep() {
  const activeStep = React.useContext(TimelineContext);
  if (activeStep === null) throw new Error("TimelineItem must be used within a Timeline");
  return activeStep;
}

type TimelineProps = React.ComponentProps<"ol"> & {
  /** The current step: items with `step <= value` are marked completed. */
  value?: number;
  orientation?: "horizontal" | "vertical";
};

function Timeline({ value = 1, orientation = "vertical", className, ...props }: TimelineProps) {
  return (
    <TimelineContext.Provider value={value}>
      <ol
        data-slot="timeline"
        data-orientation={orientation}
        className={cn(
          "group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        )}
        {...props}
      />
    </TimelineContext.Provider>
  );
}

type TimelineItemProps = React.ComponentProps<"li"> & { step: number };

function TimelineItem({ step, className, ...props }: TimelineItemProps) {
  const activeStep = useActiveStep();
  return (
    <li
      data-slot="timeline-item"
      data-completed={step <= activeStep || undefined}
      aria-current={step === activeStep ? "step" : undefined}
      className={cn(
        "group/timeline-item relative flex flex-1 flex-col gap-0.5 group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8 group-data-[orientation=vertical]/timeline:not-last:pb-6 has-[+[data-completed]]:**:data-[slot=timeline-separator]:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

function TimelineHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline-header" className={className} {...props} />;
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 data-slot="timeline-title" className={cn("text-sm font-medium", className)} {...props} />
  );
}

function TimelineDate({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <time
      data-slot="timeline-date"
      className={cn(
        "mb-1 block text-xs font-medium text-muted-foreground group-data-[orientation=vertical]/timeline:max-sm:h-4",
        className,
      )}
      {...props}
    />
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-content"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function TimelineIndicator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="timeline-indicator"
      className={cn(
        "absolute size-4 rounded-full border-2 border-primary/20 group-data-completed/timeline-item:border-primary group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2",
        className,
      )}
      {...props}
    />
  );
}

function TimelineSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="timeline-separator"
      className={cn(
        "absolute self-start bg-primary/10 group-last/timeline-item:hidden group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:h-[calc(100%-1rem-0.25rem)] group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=vertical]/timeline:translate-y-4.5",
        className,
      )}
      {...props}
    />
  );
}

export type { TimelineItemProps, TimelineProps };
export {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
};
