import creditCardType from "credit-card-type";

/** What `credit-card-type` knows about an issuer: name, lengths and digit groups. */
export type CreditCardIssuer = {
  /** The id (`visa`, `mastercard`, `american-express`, `elo`…). */
  type: string;
  /** The display name (`Visa`, `American Express`…). */
  niceType: string;
  /** The valid number lengths. */
  lengths: number[];
  /** Where the number breaks into groups (`[4, 8, 12]`, Amex `[4, 10]`). */
  gaps: number[];
  /** The security code's name (`CVV`, `CVC`, `CID`…) and size. */
  code: { name: string; size: number };
};

/** The ids `getCreditCardIssuerById` also accepts, as card data often spells them. */
const ISSUER_ALIASES: Record<string, string> = {
  amex: "american-express",
  americanexpress: "american-express",
  diners: "diners-club",
  dinersclub: "diners-club",
  master: "mastercard",
};

/** Number lengths accepted while the issuer is unknown. */
const ANY_LENGTH = [12, 13, 14, 15, 16, 17, 18, 19];

function digitsOf(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * The issuer with this id (`visa`, `Mastercard`, `amex`, `diners_club`…), as a
 * saved card's data names it, or `null` if no issuer has it.
 */
export function getCreditCardIssuerById(id: string): CreditCardIssuer | null {
  const normalized = id
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  const info: CreditCardIssuer | null = creditCardType.getTypeInfo(
    ISSUER_ALIASES[normalized.replace(/-/g, "")] ?? normalized,
  );
  if (!info) return null;
  const { type, niceType, lengths, gaps, code } = info;
  return { type, niceType, lengths, gaps, code };
}

/**
 * The issuer of a card number, from its first digits, or `null` while more
 * than one issuer still matches (a lone `4` can be Visa or Elo) or none does.
 * Non-digits are ignored.
 */
export function getCreditCardIssuer(number: string): CreditCardIssuer | null {
  const digits = digitsOf(number);
  if (!digits) return null;
  const matches = creditCardType(digits);
  return matches.length === 1 && matches[0] ? getCreditCardIssuerById(matches[0].type) : null;
}

/**
 * Whether a card number is complete for its issuer (any of 12–19 digits while
 * the issuer is unknown) and passes the Luhn check. Spaces and dashes are allowed.
 */
export function isValidCreditCardNumber(number: string): boolean {
  const digits = number.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  const lengths = getCreditCardIssuer(digits)?.lengths ?? ANY_LENGTH;
  if (!lengths.includes(digits.length)) return false;
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Whether an expiry (`MM/YY`, `MM/YYYY`, `MMYY` or `MMYYYY`) is a real month
 * that hasn't ended yet: a card is valid through the last day of its month.
 */
export function isValidCreditCardExpiry(expiry: string, today: Date = new Date()): boolean {
  const match = /^(\d{2})\/?(\d{2}|\d{4})$/.exec(expiry.trim());
  if (!match?.[1] || !match[2]) return false;
  const month = Number(match[1]);
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  if (month < 1 || month > 12) return false;
  return year * 12 + month >= today.getFullYear() * 12 + today.getMonth() + 1;
}

/**
 * Whether a security code has the size the issuer prints (Amex 4, most 3);
 * 3 or 4 digits while the issuer is unknown. `issuer` takes the issuer or the
 * card number.
 */
export function isValidCreditCardCode(
  code: string,
  issuer?: CreditCardIssuer | string | null,
): boolean {
  if (!/^\d+$/.test(code)) return false;
  const info = typeof issuer === "string" ? getCreditCardIssuer(issuer) : issuer;
  return info ? code.length === info.code.size : code.length === 3 || code.length === 4;
}

/** The sizes of the digit groups of a `length`-digit number broken at `gaps`. */
function toGroups(gaps: number[], length: number) {
  const breaks = gaps.filter((gap) => gap < length);
  return [...breaks, length].map((end, index) => end - (breaks[index - 1] ?? 0));
}

/**
 * The number's layout for its issuer (4-4-4-4 while unknown): `length` is the
 * shortest valid length that fits the digits typed so far and `groups` splits
 * it (`[4, 6, 5]` for Amex); `maxLength` and `maxGroups` are the same for the
 * longest number the issuer allows.
 */
export function getCreditCardNumberLayout(number: string): {
  length: number;
  groups: number[];
  maxLength: number;
  maxGroups: number[];
} {
  const count = digitsOf(number).length;
  const issuer = getCreditCardIssuer(number);
  const lengths = issuer?.lengths ?? [16, 19];
  const gaps = issuer?.gaps ?? [4, 8, 12];
  const maxLength = Math.max(...lengths);
  const length = lengths.find((candidate) => candidate >= count) ?? maxLength;
  return {
    length,
    groups: toGroups(gaps, length),
    maxLength,
    maxGroups: toGroups(gaps, maxLength),
  };
}
