import { describe, expect, it } from "vitest";
import {
  cnpjOrCpfMaskFormatter,
  cnpjOrCpfMaskRemover,
  createCnpjOrCpfMaskOptions,
} from "@/lib/input-masks/cnpj-or-cpf-mask";

// ─── Remover ────────────────────────────────────────────────────────

describe("cnpjOrCpfMaskRemover", () => {
  it("strips formatting from a CPF value", () => {
    expect(cnpjOrCpfMaskRemover("123.456.789-01")).toBe("12345678901");
  });

  it("strips formatting from a CNPJ value", () => {
    expect(cnpjOrCpfMaskRemover("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("uppercases letter characters", () => {
    expect(cnpjOrCpfMaskRemover("ab.cde.fg/hijk-lm")).toBe("ABCDEFGHIJKLM");
  });

  it("returns empty string for null input", () => {
    expect(cnpjOrCpfMaskRemover(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(cnpjOrCpfMaskRemover(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(cnpjOrCpfMaskRemover("")).toBe("");
  });

  it("returns only digits and letters, stripping everything else", () => {
    expect(cnpjOrCpfMaskRemover("1@#2$%3")).toBe("123");
  });
});

// ─── Formatter ──────────────────────────────────────────────────────

describe("cnpjOrCpfMaskFormatter", () => {
  describe("CPF formatting (11 digits)", () => {
    it("formats a raw 11-digit CPF", () => {
      expect(cnpjOrCpfMaskFormatter("12345678901")).toBe("123.456.789-01");
    });

    it("formats with leading zeros", () => {
      expect(cnpjOrCpfMaskFormatter("00123456000")).toBe("001.234.560-00");
    });
  });

  describe("CNPJ formatting (14 digits)", () => {
    it("formats a raw 14-digit CNPJ", () => {
      expect(cnpjOrCpfMaskFormatter("12345678000199")).toBe("12.345.678/0001-99");
    });

    it("formats with leading zeros", () => {
      expect(cnpjOrCpfMaskFormatter("00123456000199")).toBe("00.123.456/0001-99");
    });
  });

  describe("transition CPF→CNPJ (12 digits triggers CNPJ mask)", () => {
    it("applies CNPJ mask when 12 digits are entered", () => {
      expect(cnpjOrCpfMaskFormatter("123456789012")).toBe("12.345.678/9012");
    });

    it("applies CNPJ mask for 13 digits", () => {
      expect(cnpjOrCpfMaskFormatter("1234567890123")).toBe("12.345.678/9012-3");
    });
  });

  describe("letter characters trigger CNPJ mask", () => {
    it("applies CNPJ mask when the value contains letters", () => {
      expect(cnpjOrCpfMaskFormatter("AB12345678901")).toBe("AB.123.456/7890-1");
    });

    it("uppercases lowercase letter input", () => {
      expect(cnpjOrCpfMaskFormatter("ab12345678901")).toBe("AB.123.456/7890-1");
    });
  });

  describe("partial/incomplete input", () => {
    it("formats partial CPF (8 digits)", () => {
      expect(cnpjOrCpfMaskFormatter("12345678")).toBe("123.456.78");
    });

    it("formats partial CPF (3 digits, before first separator)", () => {
      expect(cnpjOrCpfMaskFormatter("123")).toBe("123");
    });

    it("formats a single digit", () => {
      expect(cnpjOrCpfMaskFormatter("1")).toBe("1");
    });

    it("formats exactly 4 digits (crosses first separator)", () => {
      expect(cnpjOrCpfMaskFormatter("1234")).toBe("123.4");
    });
  });

  describe("null / undefined / empty input", () => {
    it("returns empty string for null input", () => {
      expect(cnpjOrCpfMaskFormatter(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(cnpjOrCpfMaskFormatter(undefined)).toBe("");
    });

    it("returns empty string for empty input", () => {
      expect(cnpjOrCpfMaskFormatter("")).toBe("");
    });
  });
});

// ─── Dynamic mask selection ─────────────────────────────────────────

describe("createCnpjOrCpfMaskOptions — mask (dynamic pattern)", () => {
  it("returns CPF pattern for 11-digit value", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    const result = maskFn({ value: "12345678901" });
    expect(result).toHaveLength(15);
    expect(result[3]).toBe(".");
    expect(result[7]).toBe(".");
    expect(result[11]).toBe("-");
  });

  it("returns CNPJ pattern for 12-digit value", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    const result = maskFn({ value: "123456789012" });
    expect(result).toHaveLength(18);
    expect(result[2]).toBe(".");
    expect(result[6]).toBe(".");
    expect(result[10]).toBe("/");
    expect(result[15]).toBe("-");
  });

  it("returns CNPJ pattern for 14-digit value", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    const result = maskFn({ value: "12345678000199" });
    expect(result).toHaveLength(18);
  });

  it("returns CNPJ pattern when value contains letters", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    const result = maskFn({ value: "AB12345678" });
    expect(result).toHaveLength(18);
  });

  it("returns CPF pattern for value with 11 or fewer chars without letters", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    expect(maskFn({ value: "123" })).toHaveLength(15);
    expect(maskFn({ value: "12345678" })).toHaveLength(15);
    expect(maskFn({ value: "12345678901" })).toHaveLength(15);
  });

  it("returns CPF pattern for empty value", () => {
    const options = createCnpjOrCpfMaskOptions();
    const maskFn = options.mask as unknown as (state: {
      value: string;
    }) => readonly (string | RegExp)[];
    const result = maskFn({ value: "" });
    expect(result).toHaveLength(15);
  });
});

// ─── Postprocessor ──────────────────────────────────────────────────

describe("createCnpjOrCpfMaskOptions — postprocessors", () => {
  const options = createCnpjOrCpfMaskOptions();
  const postprocessors = options.postprocessors;
  const postprocessor = postprocessors?.[0];
  if (!postprocessor) throw new Error("createCnpjOrCpfMaskOptions has no postprocessor");

  const emptyState = { value: "", selection: [0, 0] as [number, number] };

  it("uppercases the value", () => {
    const result = postprocessor(
      { selection: [0, 0] as [number, number], value: "abc123" },
      emptyState,
    );
    expect(result.value).toBe("ABC123");
  });

  it("preserves the selection range", () => {
    const result = postprocessor(
      { selection: [3, 5] as [number, number], value: "abc" },
      emptyState,
    );
    expect(result.selection).toEqual([3, 5]);
  });

  it("does not alter already-uppercase values", () => {
    const result = postprocessor(
      { selection: [0, 0] as [number, number], value: "ABC123" },
      emptyState,
    );
    expect(result.value).toBe("ABC123");
  });

  it("handles empty value", () => {
    const result = postprocessor({ selection: [0, 0] as [number, number], value: "" }, emptyState);
    expect(result.value).toBe("");
  });
});

// ─── Plugins (event handlers) ───────────────────────────────────────

describe("createCnpjOrCpfMaskOptions — plugins", () => {
  it("includes two event handler plugins for focus and blur", () => {
    const options = createCnpjOrCpfMaskOptions();
    const plugins = options.plugins;
    expect(plugins).toBeDefined();
    expect(plugins).toHaveLength(2);
  });

  it("each plugin is a callable function", () => {
    const options = createCnpjOrCpfMaskOptions();
    for (const plugin of options.plugins ?? []) {
      expect(typeof plugin).toBe("function");
    }
  });
});

// ─── Factory isolation ───────────────────────────────────────────────

describe("createCnpjOrCpfMaskOptions (factory)", () => {
  it("returns a MaskitoOptions object", () => {
    const options = createCnpjOrCpfMaskOptions();
    expect(options).toBeDefined();
    expect(typeof options.mask).toBe("function");
  });

  it("returns distinct instances with independent plugins", () => {
    const a = createCnpjOrCpfMaskOptions();
    const b = createCnpjOrCpfMaskOptions();
    expect(a).not.toBe(b);
    expect(a.plugins).not.toBe(b.plugins);
    expect(a.plugins).toHaveLength(2);
    expect(b.plugins).toHaveLength(2);
  });

  it("returns instances with preprocessors", () => {
    const options = createCnpjOrCpfMaskOptions();
    expect(options.preprocessors).toBeDefined();
    expect(options.preprocessors?.length).toBeGreaterThanOrEqual(1);
  });

  it("returns instances with postprocessors", () => {
    const options = createCnpjOrCpfMaskOptions();
    expect(options.postprocessors).toBeDefined();
    expect(options.postprocessors?.length).toBeGreaterThanOrEqual(2);
  });
});
