import { describe, expect, it } from "vitest";
import {
  getCreditCardIssuer,
  getCreditCardIssuerById,
  getCreditCardNumberLayout,
  isValidCreditCardCode,
  isValidCreditCardExpiry,
  isValidCreditCardNumber,
} from "@/lib/credit-card-validation";

describe("getCreditCardIssuer", () => {
  it.each([
    ["4111 1111 1111 1111", "visa"],
    ["5555555555554444", "mastercard"],
    ["378282246310005", "american-express"],
    ["6362970000457013", "elo"],
    ["6062825624254001", "hipercard"],
    ["30569309025904", "diners-club"],
  ])("detects %s as %s", (number, type) => {
    expect(getCreditCardIssuer(number)?.type).toBe(type);
  });

  it("returns null while the prefix is ambiguous or empty", () => {
    expect(getCreditCardIssuer("4")).toBeNull();
    expect(getCreditCardIssuer("")).toBeNull();
  });

  it("describes the issuer", () => {
    expect(getCreditCardIssuer("37")).toEqual({
      type: "american-express",
      niceType: "American Express",
      lengths: [15],
      gaps: [4, 10],
      code: { name: "CID", size: 4 },
    });
  });
});

describe("getCreditCardIssuerById", () => {
  it.each([
    ["visa", "visa"],
    ["Mastercard", "mastercard"],
    ["AMEX", "american-express"],
    ["diners_club", "diners-club"],
    ["American Express", "american-express"],
  ])("reads %s as %s", (id, type) => {
    expect(getCreditCardIssuerById(id)?.type).toBe(type);
  });

  it("returns null for an unknown id", () => {
    expect(getCreditCardIssuerById("foo")).toBeNull();
  });
});

describe("isValidCreditCardNumber", () => {
  it("accepts complete numbers that pass the Luhn check", () => {
    expect(isValidCreditCardNumber("4111 1111 1111 1111")).toBe(true);
    expect(isValidCreditCardNumber("3782-822463-10005")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidCreditCardNumber("4111111111111112")).toBe(false);
  });

  it("rejects a length the issuer doesn't use", () => {
    expect(isValidCreditCardNumber("37828224631000")).toBe(false);
    expect(isValidCreditCardNumber("411111111111")).toBe(false);
  });

  it("rejects letters and empty input", () => {
    expect(isValidCreditCardNumber("4111 1111 1111 111a")).toBe(false);
    expect(isValidCreditCardNumber("")).toBe(false);
  });
});

describe("isValidCreditCardExpiry", () => {
  const today = new Date(2026, 9, 20);

  it("accepts the current month and later", () => {
    expect(isValidCreditCardExpiry("10/26", today)).toBe(true);
    expect(isValidCreditCardExpiry("01/2030", today)).toBe(true);
    expect(isValidCreditCardExpiry("1228", today)).toBe(true);
  });

  it("rejects a past month", () => {
    expect(isValidCreditCardExpiry("09/26", today)).toBe(false);
  });

  it("rejects an invalid month or format", () => {
    expect(isValidCreditCardExpiry("13/28", today)).toBe(false);
    expect(isValidCreditCardExpiry("00/28", today)).toBe(false);
    expect(isValidCreditCardExpiry("1/28", today)).toBe(false);
    expect(isValidCreditCardExpiry("", today)).toBe(false);
  });
});

describe("isValidCreditCardCode", () => {
  it("takes the issuer's size from the number", () => {
    expect(isValidCreditCardCode("123", "4111111111111111")).toBe(true);
    expect(isValidCreditCardCode("1234", "4111111111111111")).toBe(false);
    expect(isValidCreditCardCode("1234", "378282246310005")).toBe(true);
    expect(isValidCreditCardCode("123", "378282246310005")).toBe(false);
  });

  it("takes an issuer object", () => {
    expect(isValidCreditCardCode("1234", getCreditCardIssuerById("amex"))).toBe(true);
  });

  it("accepts 3 or 4 digits without an issuer", () => {
    expect(isValidCreditCardCode("123")).toBe(true);
    expect(isValidCreditCardCode("1234")).toBe(true);
    expect(isValidCreditCardCode("12")).toBe(false);
    expect(isValidCreditCardCode("12a")).toBe(false);
  });
});

describe("getCreditCardNumberLayout", () => {
  it("groups 4-4-4-4 while the issuer is unknown", () => {
    expect(getCreditCardNumberLayout("")).toEqual({
      length: 16,
      groups: [4, 4, 4, 4],
      maxLength: 19,
      maxGroups: [4, 4, 4, 7],
    });
  });

  it("groups Amex 4-6-5", () => {
    expect(getCreditCardNumberLayout("37")).toMatchObject({ length: 15, groups: [4, 6, 5] });
  });

  it("groups Diners 4-6-4", () => {
    expect(getCreditCardNumberLayout("36")).toMatchObject({ length: 14, groups: [4, 6, 4] });
  });

  it("grows to the next valid length", () => {
    expect(getCreditCardNumberLayout("41111111111111111")).toMatchObject({
      length: 18,
      groups: [4, 4, 4, 6],
    });
  });
});
