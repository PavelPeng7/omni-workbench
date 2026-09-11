interface JsDateLike {
  toJSDate(): Date;
}

interface IsoDateLike {
  toISODate(): string | null | undefined;
}

function hasMethod<K extends string>(value: unknown, key: K): value is Record<K, (...args: never[]) => unknown> {
  return typeof value === "object" && value !== null && typeof (value as Record<K, unknown>)[key] === "function";
}

function primitiveText(value: unknown): string {
  if (typeof value === "string") return value;
  if (["number", "boolean", "bigint", "symbol"].includes(typeof value)) return String(value);
  return "";
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (hasMethod(value, "toJSDate")) return (value as JsDateLike).toJSDate();

  const normalized = primitiveText(value).slice(0, 10).replace(/\//g, "-");
  const parts = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));

  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (hasMethod(value, "toJSDate")) return (value as JsDateLike).toJSDate();

  const parsed = new Date(primitiveText(value));
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function calendarKey(value: unknown): string {
  if (!value) return "";
  if (hasMethod(value, "toISODate")) return (value as IsoDateLike).toISODate() ?? "";

  const match = primitiveText(value).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;

  const parsed = parseDate(value);
  return parsed ? dateKey(parsed) : "";
}

export function sameCalendarDay(left: unknown, right: unknown): boolean {
  return Boolean(left) && calendarKey(left) === calendarKey(right);
}

export function isPastCalendarDay(value: unknown, reference: unknown): boolean {
  const key = calendarKey(value);
  return Boolean(key) && key < calendarKey(reference);
}
