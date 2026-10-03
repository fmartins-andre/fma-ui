import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariantsConfig = {
  variant: {
    default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
    outline: "border-border bg-transparent dark:bg-input/32 [a]:hover:bg-muted",
    ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
    link: "text-primary underline-offset-4 hover:underline",
    info: "bg-info text-background",
    success: "bg-success text-background",
    warning: "bg-warning text-background",
    destructive: "bg-destructive text-background",
    invert: "bg-invert text-invert-foreground",
    "primary-light": "bg-primary/10 border-primary/15 text-primary dark:bg-primary/20",
    "secondary-light": "bg-secondary border-secondary-foreground/10 text-secondary-foreground",
    "warning-light": "bg-warning/10 border-warning/15 text-warning-foreground dark:bg-warning/20",
    "success-light": "bg-success/10 border-success/15 text-success-foreground dark:bg-success/20",
    "info-light": "bg-info/10 border-info/15 text-info-foreground dark:bg-info/20",
    "destructive-light":
      "bg-destructive/10 border-destructive/15 text-destructive-foreground dark:bg-destructive/20",
    "invert-light": "bg-invert/10 border-invert/15 text-foreground dark:bg-invert/20",
    "primary-outline": "bg-background border-primary/30 text-primary dark:bg-input/30",
    "secondary-outline": "bg-background border-border text-secondary-foreground dark:bg-input/30",
    "warning-outline": "bg-background border-warning/30 text-warning-foreground dark:bg-input/30",
    "success-outline": "bg-background border-success/30 text-success-foreground dark:bg-input/30",
    "info-outline": "bg-background border-info/30 text-info-foreground dark:bg-input/30",
    "destructive-outline":
      "bg-background border-destructive/30 text-destructive-foreground dark:bg-input/30",
    "invert-outline": "bg-background border-invert/30 text-foreground dark:bg-input/30",
  },
  size: {
    xs: "px-1 py-0.25 text-[0.6rem] leading-none h-4 min-w-4 gap-1",
    sm: "px-1.5 py-0.25 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1",
    default: "px-1.75 py-0.5 text-xs h-5 min-w-5 gap-1",
    lg: "px-2 py-0.5 text-xs h-5.5 min-w-5.5 gap-1",
    xl: "px-2.25 py-0.75 text-sm h-6 min-w-6 gap-1.5",
  },
  radius: {
    default: "rounded-md",
    full: "rounded-full",
  },
} as const;

const badgeVariants = cva(
  "group/badge relative inline-flex w-fit shrink-0 items-center justify-center overflow-hidden border border-transparent font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3",
  {
    variants: badgeVariantsConfig,
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size,
  radius,
  render,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
  }) {
  if (render) {
    const renderProps = {
      "data-slot": "badge",
      "data-variant": variant,
      className: cn(badgeVariants({ variant, size, radius }), className),
      ...props,
    };

    return render(renderProps);
  }

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, radius }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants, badgeVariantsConfig };
