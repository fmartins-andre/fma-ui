import { describe, expect, it } from "vitest";
import typeHelper from "@/lib/type-helper";

describe("typeHelper.get", () => {
  it.each([
    ["abc", "string"],
    [1, "number"],
    [1n, "bigint"],
    [true, "boolean"],
    [Symbol("s"), "symbol"],
    [null, "null"],
    [undefined, "undefined"],
    [{}, "object"],
    [() => {}, "function"],
    [[], "array"],
    [new Date(0), "date"],
  ])("get(%o) is %s", (value, type) => {
    expect(typeHelper.get(value)).toBe(type);
  });
});

describe("typeHelper guards", () => {
  it("tells arrays and dates apart from plain objects", () => {
    expect(typeHelper.isObject({})).toBe(true);
    expect(typeHelper.isObject([])).toBe(false);
    expect(typeHelper.isObject(new Date(0))).toBe(false);
    expect(typeHelper.isArray([])).toBe(true);
    expect(typeHelper.isDate(new Date(0))).toBe(true);
  });

  it("does not treat boxed or numeric-looking strings as numbers", () => {
    expect(typeHelper.isNumber("1")).toBe(false);
    expect(typeHelper.isString("1")).toBe(true);
    expect(typeHelper.isNumber(Number.NaN)).toBe(true);
  });

  it("distinguishes null from undefined", () => {
    expect(typeHelper.isNull(null)).toBe(true);
    expect(typeHelper.isNull(undefined)).toBe(false);
    expect(typeHelper.isUndefined(undefined)).toBe(true);
  });

  it("is() compares case-insensitively", () => {
    expect(typeHelper.is([], "Array")).toBe(true);
    expect(typeHelper.isFunction(async () => {})).toBe(false);
  });
});
