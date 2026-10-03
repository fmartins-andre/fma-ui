/**
 * Brand<T, B> — generic nominal-typing utility for distinguishing structurally-identical types (e.g. StableMaskitoOptions).
 */

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** An inclusive from/to span of any orderable `T` (e.g. an unavailable-date range). */
export type Interval<T> = { from: T; to: T };
