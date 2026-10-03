/**
 * Canonical list of required color token base names for theme validation.
 *
 * Ported from EMITTE's tests/required-tokens.ts (minus `shadow-color`, which this
 * theme doesn't define). Intentionally STATIC — not re-derived from styles.css —
 * so deleting a token from the stylesheet fails the suite instead of silently
 * shrinking the contract. To add or remove a required token: edit this array and
 * update src/styles.css (:root, .dark and @theme inline) accordingly.
 */
export const REQUIRED_TOKENS: string[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "info",
  "info-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "invert",
  "invert-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];
