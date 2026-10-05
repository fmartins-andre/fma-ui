// @vitest-environment happy-dom
import { act, type ChangeEvent, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type UseMaskOptions, useMask } from "@/hooks/use-mask";

// Tell React this environment supports act() (no @testing-library here).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let result: ReturnType<typeof useMask>;

function Harness(props: UseMaskOptions) {
  result = useMask(props);
  return null;
}

let root: Root;

beforeEach(() => {
  root = createRoot(document.createElement("div"));
});

afterEach(() => {
  act(() => root.unmount());
});

const render = (props: UseMaskOptions) => act(() => root.render(createElement(Harness, props)));

// What Maskito leaves in the input after an edit, as React's onChange sees it.
const edit = (masked: string) =>
  act(() =>
    result.inputProps.onChange({ target: { value: masked } } as ChangeEvent<HTMLInputElement>),
  );

describe("useMask", () => {
  it("formats a raw defaultValue", () => {
    render({ mask: "cpf", defaultValue: "12345678901" });
    expect(result.maskedValue).toBe("123.456.789-01");
    expect(result.rawValue).toBe("12345678901");
  });

  it("reports raw and masked values when the raw value changes", () => {
    const onValueChange = vi.fn();
    render({ mask: "cpf", onValueChange });

    edit("123.4__.___-__");
    expect(onValueChange).toHaveBeenLastCalledWith("1234", "123.4__.___-__");
    expect(result.inputProps.value).toBe("123.4__.___-__");

    // Placeholder-only change (focus): same raw value, no call.
    onValueChange.mockClear();
    render({ mask: "cpf", onValueChange });
    edit("123.4__.___-__");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps the input's own text when a controlled raw value echoes it back", () => {
    let value = "";
    const onValueChange = (raw: string) => {
      value = raw;
    };
    render({ mask: "cpf", value, onValueChange });

    edit("123.___.___-__");
    render({ mask: "cpf", value, onValueChange });
    expect(value).toBe("123");
    // Not reformatted to "123": Maskito's placeholder survives.
    expect(result.inputProps.value).toBe("123.___.___-__");
  });

  it("formats a controlled value set from outside", () => {
    render({ mask: "cpf", value: "" });
    render({ mask: "cpf", value: "98765432100" });
    expect(result.inputProps.value).toBe("987.654.321-00");
    expect(result.rawValue).toBe("98765432100");

    render({ mask: "cpf", value: "" });
    expect(result.inputProps.value).toBe("");
  });

  it("formats raw values of non-digit presets", () => {
    render({ mask: "date", value: "2024-12-31" });
    expect(result.inputProps.value).toBe("31/12/2024");

    render({ mask: { type: "decimal", prefix: "R$ " }, value: "1234.5" });
    expect(result.inputProps.value).toBe("R$ 1.234,50");
  });

  it("keeps the same Maskito options for an equal inline preset object", () => {
    render({ mask: { type: "decimal", prefix: "R$ " } });
    const { ref } = result.inputProps;
    render({ mask: { type: "decimal", prefix: "R$ " } });
    expect(result.inputProps.ref).toBe(ref);
  });

  it("exposes the preset's input hints", () => {
    render({ mask: "phone" });
    expect(result.inputProps).toMatchObject({
      inputMode: "tel",
      autoComplete: "tel",
      placeholder: "(00) 00000-0000",
    });
  });
});
