// @vitest-environment happy-dom
import { CalendarDate, type DateValue } from "@internationalized/date";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAvailableDateCorrection } from "@/hooks/use-available-date-correction";
import type { Interval } from "@/lib/types";

// Tell React this environment supports act() (no @testing-library here).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const d = (day: number) => new CalendarDate(2024, 1, day);

type Props = {
  value: DateValue[] | undefined;
  min?: DateValue;
  max?: DateValue;
  unavailableRanges?: Interval<DateValue>[];
  selectionMode?: string;
  clearValue: () => void;
  setValue: (value: DateValue[]) => void;
};

function Harness(props: Props) {
  useAvailableDateCorrection(props);
  return null;
}

let root: Root;
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
});

function render(props: Props) {
  act(() => root.render(createElement(Harness, props)));
}

describe("useAvailableDateCorrection", () => {
  it("leaves an available value alone", () => {
    const setValue = vi.fn();
    const clearValue = vi.fn();
    render({ value: [d(10)], min: d(1), max: d(31), setValue, clearValue });
    expect(setValue).not.toHaveBeenCalled();
    expect(clearValue).not.toHaveBeenCalled();
  });

  it("travels a blocked value to the nearest available date", () => {
    const setValue = vi.fn();
    const clearValue = vi.fn();
    render({ value: [d(3)], min: d(5), setValue, clearValue });
    expect(setValue).toHaveBeenCalledTimes(1);
    expect(String(setValue.mock.calls[0]?.[0])).toBe(String([d(5)]));
    expect(clearValue).not.toHaveBeenCalled();
  });

  it("clears the value when no available date exists", () => {
    const setValue = vi.fn();
    const clearValue = vi.fn();
    render({
      value: [d(10)],
      min: d(5),
      max: d(20),
      unavailableRanges: [{ from: d(1), to: d(31) }],
      setValue,
      clearValue,
    });
    expect(clearValue).toHaveBeenCalledTimes(1);
    expect(setValue).not.toHaveBeenCalled();
  });

  it("re-corrects when constraints narrow after a value was committed", () => {
    const setValue = vi.fn();
    const clearValue = vi.fn();
    const value = [d(10)];
    render({ value, setValue, clearValue });
    expect(setValue).not.toHaveBeenCalled();
    render({ value, min: d(15), setValue, clearValue });
    expect(String(setValue.mock.calls[0]?.[0])).toBe(String([d(15)]));
  });

  it("attempts a correction only once per (value, constraints) pair", () => {
    const setValue = vi.fn();
    const clearValue = vi.fn();
    // A controlled parent that ignores the correction and re-renders with a
    // fresh array of the same blocked date must not loop.
    render({ value: [d(3)], min: d(5), setValue, clearValue });
    render({ value: [d(3)], min: d(5), setValue, clearValue });
    expect(setValue).toHaveBeenCalledTimes(1);
  });
});
