/**
 * Runtime type-checking helpers (typeHelper.isString/isNumber/isArray/...) built on Object.prototype.toString, usable as TypeScript type guards.
 */

type EnsureType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "null"
  | "undefined"
  | "object"
  | "function"
  | "array"
  | "date"
  | (string & {});

function getType(arg: unknown): EnsureType {
  return Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
}

function isType(arg: unknown, type: EnsureType): boolean {
  return getType(arg) === type.toLowerCase();
}

function isString(arg: unknown): arg is string {
  return isType(arg, "string");
}

function isNumber(arg: unknown): arg is number {
  return isType(arg, "number");
}

function isBigInt(arg: unknown): arg is bigint {
  return isType(arg, "bigint");
}

function isBoolean(arg: unknown): arg is boolean {
  return isType(arg, "boolean");
}

function isSymbol(arg: unknown): arg is symbol {
  return isType(arg, "symbol");
}

function isNull(arg: unknown): arg is null {
  return isType(arg, "null");
}

function isUndefined(arg: unknown): arg is undefined {
  return isType(arg, "undefined");
}

function isObject(arg: unknown): arg is object {
  return isType(arg, "object");
}

// biome-ignore lint/complexity/noBannedTypes: mirrors typeof === "function", which includes every callable
function isFunction(arg: unknown): arg is Function {
  return isType(arg, "function");
}

function isArray(arg: unknown): arg is Array<unknown> {
  return isType(arg, "array");
}

function isDate(arg: unknown): arg is Date {
  return isType(arg, "date");
}

const typeHelper = {
  get: getType,
  is: isType,
  isString,
  isNumber,
  isBigInt,
  isBoolean,
  isSymbol,
  isNull,
  isUndefined,
  isObject,
  isFunction,
  isArray,
  isDate,
};

export default typeHelper;
