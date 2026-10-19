import { describe, expect, it } from "vitest";
import {
  defaultPasswordRules,
  evaluatePasswordRules,
  isPasswordValid,
  passwordRules,
} from "../src/core/password-rules/password-rules";

const states = (value: string, rules = defaultPasswordRules, confirmation = "") =>
  evaluatePasswordRules(value, rules, confirmation).map((r) => r.state);

describe("evaluatePasswordRules", () => {
  it("keeps every rule neutral while the password is empty", () => {
    expect(states("")).toEqual(["neutral", "neutral", "neutral", "neutral"]);
  });

  it("marks each default rule met or unmet", () => {
    // min 8, uppercase, lowercase, number
    expect(states("abc1")).toEqual(["unmet", "unmet", "met", "met"]);
    expect(states("Abcdefg1")).toEqual(["met", "met", "met", "met"]);
  });

  it("counts characters, not UTF-16 units, and handles accented letters", () => {
    expect(states("Ááá😀😀😀😀1", [passwordRules.minLength(8)])).toEqual(["met"]);
    expect(states("ção", [passwordRules.uppercase(), passwordRules.lowercase()])).toEqual([
      "unmet",
      "met",
    ]);
  });

  it("judges match only once the confirmation is typed", () => {
    const rules = [passwordRules.match()];
    expect(states("Segredo1", rules, "")).toEqual(["neutral"]);
    expect(states("Segredo1", rules, "Segredo")).toEqual(["unmet"]);
    expect(states("Segredo1", rules, "Segredo1")).toEqual(["met"]);
  });

  it("treats anything besides letters, digits and spaces as special", () => {
    const rules = [passwordRules.special()];
    expect(states("abc 123", rules)).toEqual(["unmet"]);
    expect(states("abc#123", rules)).toEqual(["met"]);
  });
});

describe("isPasswordValid", () => {
  it("requires every rule, including confirmation rules", () => {
    const rules = [passwordRules.minLength(8), passwordRules.match()];
    expect(isPasswordValid("Segredo1", rules, "Segredo1")).toBe(true);
    expect(isPasswordValid("Segredo1", rules, "")).toBe(false);
    expect(isPasswordValid("", defaultPasswordRules)).toBe(false);
  });

  it("lets labels be replaced", () => {
    expect(passwordRules.minLength(10, "At least 10").label).toBe("At least 10");
  });
});
