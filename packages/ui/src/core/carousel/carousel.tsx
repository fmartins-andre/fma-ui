"use client";

import { cn } from "cn";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/core/button/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselLabels = {
  previous: string;
  next: string;
  pause: string;
  /** Starts the rotation (also when reduced motion started it paused). */
  start: string;
  /** A dot's label, given the slide number (1-based) and the total. */
  goToSlide: (slide: number, total: number) => string;
};

type CarouselI18n = { labels?: Partial<CarouselLabels> };

const defaultCarouselLabels: CarouselLabels = {
  previous: "Previous slide",
  next: "Next slide",
  pause: "Pause slides",
  start: "Play slides",
  goToSlide: (slide, total) => `Go to slide ${slide} of ${total}`,
};

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  /**
   * Advances on its own every `delay` ms (5000 by default), back to the first
   * slide after the last. Pair it with `CarouselAutoplayToggle`.
   */
  autoplay?: boolean | { delay?: number };
  i18n?: CarouselI18n;
};

// Bundlers replace process.env.NODE_ENV at build time; declared here so
// the component doesn't need Node types.
declare const process: { env: { NODE_ENV?: string } };

const DEFAULT_AUTOPLAY_DELAY = 5000;

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  labels: CarouselLabels;
  selectedIndex: number;
  slideCount: number;
  scrollTo: (index: number) => void;
  hasAutoplay: boolean;
  isPlaying: boolean;
  setPlaying: (isPlaying: boolean) => void;
  registerAutoplayToggle: () => () => void;
} & Omit<CarouselProps, "autoplay" | "i18n">;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  autoplay,
  i18n,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const labels = { ...defaultCarouselLabels, ...i18n?.labels };
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [slideCount, setSlideCount] = React.useState(0);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
    setSelectedIndex(api.selectedScrollSnap());
    setSlideCount(api.scrollSnapList().length);
  }, []);

  const scrollTo = React.useCallback((index: number) => api?.scrollTo(index), [api]);

  // Autoplay: the user's choice (the toggle), suspended while the pointer is
  // over the carousel or focus is inside it (except on the toggle itself).
  const hasAutoplay = Boolean(autoplay);
  const delay = (typeof autoplay === "object" && autoplay.delay) || DEFAULT_AUTOPLAY_DELAY;
  const [isPlaying, setPlaying] = React.useState(hasAutoplay);
  const [isHovered, setHovered] = React.useState(false);
  const [hasFocusWithin, setFocusWithin] = React.useState(false);
  const isRotating = hasAutoplay && isPlaying && !isHovered && !hasFocusWithin;

  // Reduced motion: start paused; the toggle can still start it.
  React.useEffect(() => {
    if (hasAutoplay && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
    }
  }, [hasAutoplay]);

  // Re-armed on every slide change, so manual navigation restarts the delay.
  React.useEffect(() => {
    if (!api || !isRotating || selectedIndex < 0) return;
    const timer = setTimeout(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, delay);
    return () => clearTimeout(timer);
  }, [api, isRotating, delay, selectedIndex]);

  // A ref, not state: the toggle's effect runs before this component's, so
  // the count is already up to date when the check below runs.
  const toggleCount = React.useRef(0);
  const registerAutoplayToggle = React.useCallback(() => {
    toggleCount.current += 1;
    return () => {
      toggleCount.current -= 1;
    };
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && hasAutoplay && toggleCount.current === 0) {
      console.warn(
        "[carousel] `autoplay` without a `CarouselAutoplayToggle`: users need a way to pause moving content (WCAG 2.2.2).",
      );
    }
  }, [hasAutoplay]);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("reInit", onSelect);
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        labels,
        selectedIndex,
        slideCount,
        scrollTo,
        hasAutoplay,
        isPlaying,
        setPlaying,
        registerAutoplayToggle,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        data-rotating={isRotating || undefined}
        // Hover is a moving mouse: slides passing under a still cursor don't pause it.
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
          onPointerMove?.(event);
        }}
        onPointerLeave={(event) => {
          setHovered(false);
          onPointerLeave?.(event);
        }}
        onFocus={(event) => {
          setFocusWithin(
            !(event.target as Element).closest("[data-slot=carousel-autoplay-toggle]"),
          );
          onFocus?.(event);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
          onBlur?.(event);
        }}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation, hasAutoplay, isPlaying } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        // Slide changes are announced only when the user drives them.
        aria-live={hasAutoplay && isPlaying ? "off" : "polite"}
        className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev, labels } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "inset-y-0 -left-12 my-auto"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      isDisabled={!canScrollPrev}
      onPress={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="sr-only">{labels.previous}</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext, labels } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "inset-y-0 -right-12 my-auto"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      isDisabled={!canScrollNext}
      onPress={scrollNext}
      {...props}
    >
      <ChevronRightIcon />
      <span className="sr-only">{labels.next}</span>
    </Button>
  );
}

/**
 * Pauses and resumes `autoplay`. Required whenever the carousel moves on its
 * own (WCAG 2.2.2); it isn't positioned, place it where it fits.
 */
function CarouselAutoplayToggle({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { isPlaying, setPlaying, labels, registerAutoplayToggle } = useCarousel();

  React.useEffect(registerAutoplayToggle, [registerAutoplayToggle]);

  return (
    <Button
      data-slot="carousel-autoplay-toggle"
      variant={variant}
      size={size}
      className={cn("touch-manipulation rounded-full", className)}
      onPress={() => setPlaying(!isPlaying)}
      {...props}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
      <span className="sr-only">{isPlaying ? labels.pause : labels.start}</span>
    </Button>
  );
}

/**
 * One dot per slide, the current one marked; pressing a dot goes to its
 * slide. Not positioned, like the toggle.
 */
function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
  const { selectedIndex, slideCount, scrollTo, labels } = useCarousel();

  return (
    <div
      data-slot="carousel-dots"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      {Array.from({ length: slideCount }, (_, index) => (
        // A native button: react-aria's Button doesn't forward `aria-current`.
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: one dot per scroll snap, the index is its identity
          key={index}
          type="button"
          data-slot="carousel-dot"
          aria-label={labels.goToSlide(index + 1, slideCount)}
          aria-current={index === selectedIndex || undefined}
          onClick={() => scrollTo(index)}
          className="group/carousel-dot flex size-5 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-foreground/20 transition-all group-aria-current/carousel-dot:w-4 group-aria-current/carousel-dot:bg-primary"
          />
        </button>
      ))}
    </div>
  );
}

export type { CarouselI18n, CarouselLabels };
export {
  Carousel,
  type CarouselApi,
  CarouselAutoplayToggle,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
};
