import { cn } from "cn";
import { CheckIcon, MinusIcon } from "lucide-react";
import {
  CheckboxGroup as CheckboxGroupPrimitive,
  type CheckboxGroupProps,
  Checkbox as CheckboxPrimitive,
  type CheckboxProps,
  composeRenderProps,
} from "react-aria-components";
import { choiceCardClassName } from "@/core/field/field";

function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-focus-visible:border-ring data-focus-visible:ring-3 data-focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary data-selected:border-primary data-selected:bg-primary data-selected:text-primary-foreground data-invalid:data-selected:border-primary dark:data-selected:bg-primary",
        className,
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isIndeterminate }) => (
        <>
          <span
            data-slot="checkbox-indicator"
            className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
          >
            {(isSelected || isIndeterminate) && <CheckIcon />}
          </span>
          {children}
        </>
      ))}
    </CheckboxPrimitive>
  );
}

/**
 * A checkbox drawn as a card: the whole card toggles it. Children are the
 * card's content (an `IconTile`, a `FieldContent` with `FieldTitle` and
 * `FieldDescription`); a square indicator sits at the end. Use inside a
 * `CheckboxGroup` with a `value`, or alone.
 */
function CheckboxCard({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      data-slot="checkbox-card"
      className={composeRenderProps(className, (className) => cn(choiceCardClassName, className))}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isIndeterminate }) => (
        <>
          {children}
          <span
            data-slot="checkbox-card-indicator"
            className="mt-0.5 ml-auto flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors group-data-indeterminate/choice-card:border-primary group-data-indeterminate/choice-card:bg-primary group-data-indeterminate/choice-card:text-primary-foreground group-data-selected/choice-card:border-primary group-data-selected/choice-card:bg-primary group-data-selected/choice-card:text-primary-foreground dark:bg-input/30 [&>svg]:size-3.5"
          >
            {isIndeterminate ? <MinusIcon /> : isSelected && <CheckIcon />}
          </span>
        </>
      ))}
    </CheckboxPrimitive>
  );
}

/**
 * Groups checkboxes under one label and one `value` array (each `Checkbox`
 * takes a `value`). A `Label` without `htmlFor` inside names the group.
 */
function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={composeRenderProps(className, (className) =>
        cn("grid w-full gap-2 data-[disabled]:opacity-50", className),
      )}
      {...props}
    />
  );
}

export { Checkbox, CheckboxCard, CheckboxGroup };
