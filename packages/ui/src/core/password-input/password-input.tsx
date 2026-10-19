"use client";

import { cn } from "cn";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/core/input-group/input-group";

type PasswordInputProps = Omit<React.ComponentProps<typeof InputGroupInput>, "type"> & {
  /** Accessible name of the reveal toggle; its pressed state says whether it's on. */
  toggleLabel?: string;
  /** Controlled visibility. */
  isRevealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (isRevealed: boolean) => void;
  /** Classes for the outer `InputGroup`; `className` goes to the input. */
  groupClassName?: string;
};

/**
 * A password field with a show/hide toggle. Spreads the rest onto the input,
 * so it works inside a react-aria `TextField` and takes `autoComplete`
 * ("current-password" / "new-password").
 */
function PasswordInput({
  toggleLabel = "Show password",
  isRevealed: isRevealedProp,
  defaultRevealed = false,
  onRevealedChange,
  groupClassName,
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultRevealed);
  const isRevealed = isRevealedProp ?? uncontrolled;

  function toggle() {
    const next = !isRevealed;
    if (isRevealedProp === undefined) setUncontrolled(next);
    onRevealedChange?.(next);
  }

  return (
    <InputGroup data-slot="password-input" className={groupClassName} isDisabled={disabled}>
      <InputGroupInput
        type={isRevealed ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        // Edge's own reveal button would duplicate ours.
        className={cn("[&::-ms-clear]:hidden [&::-ms-reveal]:hidden", className)}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={toggleLabel}
          aria-pressed={isRevealed}
          isDisabled={disabled}
          onPress={toggle}
        >
          {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export type { PasswordInputProps };
export { PasswordInput };
