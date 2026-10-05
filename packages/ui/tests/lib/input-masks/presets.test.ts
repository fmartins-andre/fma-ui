import { describe, expect, it } from "vitest";
import { makeStableMaskitoOptions } from "@/lib/input-masks";
import { type MaskSpec, resolveMask } from "@/lib/input-masks/presets";

// [spec, masked text, raw value]: unmask(masked) === raw and format(raw) === masked.
const ROUND_TRIPS: [MaskSpec, string, string][] = [
  ["cpf", "123.456.789-01", "12345678901"],
  ["cnpj", "12.345.678/0001-99", "12345678000199"],
  ["cpf-cnpj", "123.456.789-01", "12345678901"],
  ["cpf-cnpj", "12.345.678/0001-99", "12345678000199"],
  ["cep", "01001-000", "01001000"],
  ["phone", "(11) 98765-4321", "11987654321"],
  ["phone", "(11) 3322-4455", "1133224455"],
  ["credit-card", "1234 5678 9012 3456", "1234567890123456"],
  ["date", "31/12/2024", "2024-12-31"],
  [{ type: "date", mode: "mm/yyyy" }, "12/2024", "2024-12"],
  [{ type: "date", mode: "yyyy" }, "2024", "2024"],
  ["time", "09:30", "09:30"],
  ["date-range", "01/01/2024 – 31/12/2024", "0101202431122024"],
  ["decimal", "1.234,50", "1234.50"],
  [{ type: "decimal", prefix: "R$ " }, "R$ 1.234,50", "1234.50"],
];

describe("resolveMask", () => {
  it.each(ROUND_TRIPS)("%j: %s ⇄ %s", (spec, masked, raw) => {
    const mask = resolveMask(spec);
    expect(mask.unmask(masked)).toBe(raw);
    expect(mask.format(raw)).toBe(masked);
  });

  it("formats already-masked text unchanged", () => {
    for (const [spec, masked] of ROUND_TRIPS) {
      if (spec === "date" || (typeof spec === "object" && spec.type !== "decimal")) continue;
      expect(resolveMask(spec).format(masked)).toBe(masked);
    }
  });

  it("round-trips date-time through ISO in local time", () => {
    const mask = resolveMask("date-time");
    const raw = mask.unmask("31/12/2024, 09:30");
    expect(raw).toBe(new Date(2024, 11, 31, 9, 30).toISOString());
    expect(mask.format(raw)).toBe("31/12/2024, 09:30");
  });

  it("gives an empty raw value for incomplete dates", () => {
    expect(resolveMask("date").unmask("31/12/20__")).toBe("");
    expect(resolveMask("date-time").unmask("31/12/2024, 09:__")).toBe("");
  });

  it("formats an empty raw value as empty text", () => {
    for (const [spec] of ROUND_TRIPS) expect(resolveMask(spec).format("")).toBe("");
  });

  it("derives input hints from the preset", () => {
    expect(resolveMask("phone")).toMatchObject({ inputMode: "tel", autoComplete: "tel" });
    expect(resolveMask("cep")).toMatchObject({ autoComplete: "postal-code" });
    expect(resolveMask("credit-card")).toMatchObject({ autoComplete: "cc-number" });
    expect(resolveMask("decimal")).toMatchObject({ inputMode: "decimal", placeholder: "0,00" });
    expect(resolveMask({ type: "decimal", prefix: "R$ " }).placeholder).toBe("R$ 0,00");
    expect(resolveMask({ type: "date", mode: "mm/yyyy" }).placeholder).toBe("mm/aaaa");
    expect(resolveMask("date-time").placeholder).toBe("dd/mm/aaaa, hh:mm");
    expect(resolveMask("date-range").placeholder).toBe("dd/mm/aaaa – dd/mm/aaaa");
  });

  it("wraps custom options with the masked text as raw value", () => {
    const options = makeStableMaskitoOptions({ mask: ["A", "-", /\d/, /\d/] });
    const mask = resolveMask(options);
    expect(mask.options).toBe(options);
    expect(mask.unmask("A-12")).toBe("A-12");
    expect(mask.format("12")).toBe("A-12");
    expect(mask.inputMode).toBeUndefined();
  });
});
