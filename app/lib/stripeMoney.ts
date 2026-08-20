export class InvalidChargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidChargeError";
  }
}

export const SUPPORTED_CHECKOUT_CURRENCY = "USD" as const;

export function normalizeCheckoutCurrency(currency: unknown): string {
  if (typeof currency !== "string" || !currency.trim()) {
    throw new InvalidChargeError("Booking currency is missing.");
  }

  return currency.trim().toUpperCase();
}

export function assertSupportedCheckoutCurrency(currency: string): void {
  if (currency !== SUPPORTED_CHECKOUT_CURRENCY) {
    throw new InvalidChargeError(
      `Unsupported checkout currency ${currency}.`
    );
  }
}

export function toUsdCents(amount: unknown): number {
  if (amount == null) {
    throw new InvalidChargeError("Booking totalAmount is missing.");
  }

  const raw = String(amount).trim();

  if (!raw || /[eE]/.test(raw) || raw.startsWith("-")) {
    throw new InvalidChargeError("Booking totalAmount is invalid.");
  }

  const parts = raw.split(".");

  if (parts.length > 2) {
    throw new InvalidChargeError("Booking totalAmount is invalid.");
  }

  const [wholeRaw, fractionRaw = ""] = parts;

  if (!/^\d+$/.test(wholeRaw) || (fractionRaw !== "" && !/^\d+$/.test(fractionRaw))) {
    throw new InvalidChargeError("Booking totalAmount is invalid.");
  }

  if (fractionRaw.length > 2 && !/^0+$/.test(fractionRaw.slice(2))) {
    throw new InvalidChargeError(
      "Booking totalAmount must have at most two decimal places."
    );
  }

  const dollars = Number(wholeRaw);
  const fractionCents = Number((fractionRaw + "00").slice(0, 2));

  if (!Number.isSafeInteger(dollars) || !Number.isSafeInteger(fractionCents)) {
    throw new InvalidChargeError("Booking totalAmount is invalid.");
  }

  const cents = dollars * 100 + fractionCents;

  if (cents <= 0) {
    throw new InvalidChargeError("Booking totalAmount must be greater than zero.");
  }

  if (cents > Number.MAX_SAFE_INTEGER) {
    throw new InvalidChargeError("Booking totalAmount is too large.");
  }

  return cents;
}

export function resolveChargeFromBooking(booking: {
  totalAmount: unknown;
  currency: string;
}) {
  const currency = normalizeCheckoutCurrency(booking.currency);
  assertSupportedCheckoutCurrency(currency);

  return {
    amount: booking.totalAmount,
    currency,
    amountCents: toUsdCents(booking.totalAmount),
  };
}
