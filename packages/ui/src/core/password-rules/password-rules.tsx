"use client";

import { cn } from "cn";
import { CheckIcon, CircleIcon, XIcon } from "lucide-react";
import type * as React from "react";

type PasswordRule = {
  id: string;
  label: string;
  /** `confirmation` is the "repeat password" value, for rules like `match`. */
  test: (value: string, confirmation: string) => boolean;
  /** Stays neutral until the confirmation is typed (instead of until the password is). */
  dependsOnConfirmation?: boolean;
};

type PasswordRuleState = "neutral" | "met" | "unmet";

/** Factories for the usual rules; pass `label` to translate or reword them. */
const passwordRules = {
  minLength: (min: number, label = `At least ${min} characters`): PasswordRule => ({
    id: "min-length",
    label,
    test: (value) => [...value].length >= min,
  }),
  maxLength: (max: number, label = `At most ${max} characters`): PasswordRule => ({
    id: "max-length",
    label,
    test: (value) => [...value].length <= max,
  }),
  uppercase: (label = "An uppercase letter"): PasswordRule => ({
    id: "uppercase",
    label,
    test: (value) => /\p{Lu}/u.test(value),
  }),
  lowercase: (label = "A lowercase letter"): PasswordRule => ({
    id: "lowercase",
    label,
    test: (value) => /\p{Ll}/u.test(value),
  }),
  number: (label = "A number"): PasswordRule => ({
    id: "number",
    label,
    test: (value) => /\p{N}/u.test(value),
  }),
  special: (label = "A special character"): PasswordRule => ({
    id: "special",
    label,
    test: (value) => /[^\p{L}\p{N}\s]/u.test(value),
  }),
  match: (label = "Matches the confirmation"): PasswordRule => ({
    id: "match",
    label,
    test: (value, confirmation) => value.length > 0 && value === confirmation,
    dependsOnConfirmation: true,
  }),
};

const defaultPasswordRules: PasswordRule[] = [
  passwordRules.minLength(8),
  passwordRules.uppercase(),
  passwordRules.lowercase(),
  passwordRules.number(),
];

/**
 * Pure check of every rule. A rule is `neutral` while there's nothing to judge
 * yet (empty password, or empty confirmation for confirmation rules).
 */
function evaluatePasswordRules(
  value: string,
  rules: PasswordRule[] = defaultPasswordRules,
  confirmation = "",
): { rule: PasswordRule; state: PasswordRuleState }[] {
  return rules.map((rule) => {
    const pending = rule.dependsOnConfirmation ? !confirmation : !value;
    if (pending) return { rule, state: "neutral" };
    return { rule, state: rule.test(value, confirmation) ? "met" : "unmet" };
  });
}

/** Whether the password passes every rule. */
function isPasswordValid(
  value: string,
  rules: PasswordRule[] = defaultPasswordRules,
  confirmation = "",
): boolean {
  return rules.every((rule) => rule.test(value, confirmation));
}

const ICONS = { neutral: CircleIcon, met: CheckIcon, unmet: XIcon } as const;

type PasswordRulesProps = Omit<React.ComponentProps<"ul">, "children"> & {
  value: string;
  confirmation?: string;
  rules?: PasswordRule[];
  /** Read after each rule by screen readers, so the state isn't conveyed by color alone. */
  stateLabels?: Record<PasswordRuleState, string>;
};

/**
 * The password rules, each marked pending, met or unmet as the user types.
 * Give it an `id` and point the password input's `aria-describedby` at it.
 */
function PasswordRules({
  value,
  confirmation = "",
  rules = defaultPasswordRules,
  stateLabels = { neutral: "pending", met: "met", unmet: "not met" },
  className,
  ...props
}: PasswordRulesProps) {
  return (
    <ul
      data-slot="password-rules"
      className={cn("flex flex-col gap-1.5 text-sm", className)}
      {...props}
    >
      {evaluatePasswordRules(value, rules, confirmation).map(({ rule, state }) => {
        const Icon = ICONS[state];
        return (
          <li
            key={rule.id}
            data-slot="password-rule"
            data-state={state}
            className={cn(
              "flex items-center gap-2 text-muted-foreground transition-colors data-[state=met]:text-foreground",
              "[&>svg]:size-4 [&>svg]:shrink-0 data-[state=met]:[&>svg]:text-success data-[state=neutral]:[&>svg]:size-2.5 data-[state=neutral]:[&>svg]:mx-[3px] data-[state=unmet]:[&>svg]:text-destructive",
            )}
          >
            <Icon aria-hidden="true" />
            <span>
              {rule.label}
              <span className="sr-only">: {stateLabels[state]}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export type { PasswordRule, PasswordRuleState, PasswordRulesProps };
export {
  defaultPasswordRules,
  evaluatePasswordRules,
  isPasswordValid,
  PasswordRules,
  passwordRules,
};
