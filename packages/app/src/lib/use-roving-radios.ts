import type { KeyboardEvent } from "react";

interface RovingRadio<Value> {
  value: Value;
}

/**
 * The radio-group keyboard pattern for a row of `role="radio"` buttons: one
 * tab stop (the checked option, else the first), arrows and Home/End moving
 * both focus and selection.
 */
export function rovingRadioProps<Value>(
  options: readonly RovingRadio<Value>[],
  selected: Value,
  select: (value: Value) => void,
  value: Value,
): { tabIndex: number; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void } {
  const index = options.findIndex((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === selected);
  const tabIndex = index === (selectedIndex === -1 ? 0 : selectedIndex) ? 0 : -1;
  return {
    tabIndex,
    onKeyDown: (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      let next: number | undefined;
      if (step !== undefined) {
        next = (index + step + options.length) % options.length;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = options.length - 1;
      }
      if (next === undefined) {
        return;
      }
      event.preventDefault();
      const target = options[next];
      if (target !== undefined) {
        select(target.value);
        const siblings = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        siblings?.[next]?.focus();
      }
    },
  };
}
