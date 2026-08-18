import {
  isTicketEligible,
  TICKET_ELIGIBLE_STATUSES,
} from "../lib/ticketAccess";

export {
  isTicketEligible,
  TICKET_ELIGIBLE_STATUSES,
};

export const CHECKOUT_POLL_INTERVAL_MS = 2000;
export const CHECKOUT_POLL_MAX_ATTEMPTS = 15;
export const TRANSIENT_INIT_RETRY_DELAY_MS = 800;

export type CheckoutPaymentSnapshot = {
  id: string;
  status: string;
  paymentStatus: string;
  payments?: Array<{
    status: string;
    provider?: string | null;
    providerRef?: string | null;
  }>;
};

export type CheckoutViewKind =
  | "pay"
  | "confirming"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "unavailable";

export type CheckoutSessionResult =
  | { ok: true; url: string }
  | { ok: false; status: number; message: string };

export function buildCheckoutSessionRequest(bookingId: string): {
  url: string;
  init: RequestInit;
} {
  return {
    url: `/api/bookings/${encodeURIComponent(bookingId)}/checkout-session`,
    init: {
      method: "POST",
      credentials: "same-origin",
    },
  };
}

export function checkoutSessionRequestHasMoneyFields(
  init: RequestInit
): boolean {
  if (init.body == null || init.body === "") {
    return false;
  }

  const raw =
    typeof init.body === "string"
      ? init.body
      : JSON.stringify(init.body);

  return /amount|currency|totalAmount|fare|tax|discount|protection/i.test(
    raw
  );
}

export function isSafeCheckoutRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isTransientInitializationConflict(
  status: number,
  message: string
): boolean {
  return status === 409 && message.includes("Retry shortly");
}

export function hasOpenStripeAttempt(
  booking: CheckoutPaymentSnapshot
): boolean {
  return Boolean(
    booking.payments?.some(
      (payment) =>
        payment.status === "PENDING" &&
        payment.provider === "STRIPE" &&
        Boolean(payment.providerRef)
    )
  );
}

export function resolveCheckoutView(
  booking: CheckoutPaymentSnapshot | null
): CheckoutViewKind {
  if (!booking) {
    return "unavailable";
  }

  if (booking.status === "FAILED") {
    return "failed";
  }

  if (booking.status === "CANCELLED") {
    return "cancelled";
  }

  if (isTicketEligible(booking)) {
    return "confirmed";
  }

  if (booking.status === "DRAFT" && hasOpenStripeAttempt(booking)) {
    return "confirming";
  }

  return "pay";
}

export function checkoutLoginPath(bookingId: string): string {
  const callbackUrl = `/checkout?bookingId=${encodeURIComponent(bookingId)}`;
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function createExclusiveRunner() {
  let running = false;

  return {
    isRunning() {
      return running;
    },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      if (running) {
        return undefined;
      }

      running = true;

      try {
        return await fn();
      } catch (error) {
        running = false;
        throw error;
      }
    },
    reset() {
      running = false;
    },
  };
}

export async function requestCheckoutSession(
  bookingId: string,
  deps: {
    fetch: typeof fetch;
  }
): Promise<CheckoutSessionResult> {
  const request = buildCheckoutSessionRequest(bookingId);
  const response = await deps.fetch(request.url, request.init);
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    data?: { url?: string };
  } | null;

  if (
    response.ok &&
    payload?.data?.url &&
    isSafeCheckoutRedirectUrl(payload.data.url)
  ) {
    return {
      ok: true,
      url: payload.data.url,
    };
  }

  return {
    ok: false,
    status: response.status,
    message:
      payload?.message ||
      "Payment is temporarily unavailable. Please try again.",
  };
}

export async function requestCheckoutSessionWithTransientRetry(
  bookingId: string,
  deps: {
    fetch: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<CheckoutSessionResult> {
  const first = await requestCheckoutSession(bookingId, deps);

  if (first.ok) {
    return first;
  }

  if (!isTransientInitializationConflict(first.status, first.message)) {
    return first;
  }

  const sleep = deps.sleep ?? ((ms: number) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }));

  await sleep(TRANSIENT_INIT_RETRY_DELAY_MS);

  return requestCheckoutSession(bookingId, deps);
}

export async function fetchAuthoritativeBooking(
  bookingId: string,
  deps: {
    fetch: typeof fetch;
  }
): Promise<
  | { kind: "ok"; booking: CheckoutPaymentSnapshot }
  | { kind: "unauthorized" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
> {
  const response = await deps.fetch(
    `/api/bookings/${encodeURIComponent(bookingId)}`,
    {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    return { kind: "unauthorized" };
  }

  if (response.status === 404) {
    return { kind: "not_found" };
  }

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: CheckoutPaymentSnapshot;
  } | null;

  if (!response.ok || !payload?.data) {
    return {
      kind: "error",
      message:
        payload?.message ||
        "Unable to refresh booking status.",
    };
  }

  return {
    kind: "ok",
    booking: {
      id: payload.data.id,
      status: payload.data.status,
      paymentStatus: payload.data.paymentStatus,
      payments: payload.data.payments,
    },
  };
}

export async function pollAuthoritativeBooking(options: {
  bookingId: string;
  fetch: typeof fetch;
  intervalMs?: number;
  maxAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
  isCancelled?: () => boolean;
  onSnapshot?: (booking: CheckoutPaymentSnapshot) => void;
}): Promise<{
  reason:
    | "confirmed"
    | "failed"
    | "cancelled"
    | "timeout"
    | "unauthorized"
    | "not_found"
    | "unmounted";
  booking: CheckoutPaymentSnapshot | null;
  attempts: number;
}> {
  const intervalMs = options.intervalMs ?? CHECKOUT_POLL_INTERVAL_MS;
  const maxAttempts = options.maxAttempts ?? CHECKOUT_POLL_MAX_ATTEMPTS;
  const sleep =
    options.sleep ??
    ((ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      }));

  let attempts = 0;
  let lastBooking: CheckoutPaymentSnapshot | null = null;

  while (attempts < maxAttempts) {
    if (options.isCancelled?.()) {
      return {
        reason: "unmounted",
        booking: lastBooking,
        attempts,
      };
    }

    attempts += 1;
    const result = await fetchAuthoritativeBooking(options.bookingId, {
      fetch: options.fetch,
    });

    if (result.kind === "unauthorized") {
      return { reason: "unauthorized", booking: lastBooking, attempts };
    }

    if (result.kind === "not_found") {
      return { reason: "not_found", booking: lastBooking, attempts };
    }

    if (result.kind === "ok") {
      lastBooking = result.booking;
      options.onSnapshot?.(result.booking);

      const view = resolveCheckoutView(result.booking);

      if (view === "confirmed") {
        return { reason: "confirmed", booking: result.booking, attempts };
      }

      if (view === "failed") {
        return { reason: "failed", booking: result.booking, attempts };
      }

      if (view === "cancelled") {
        return { reason: "cancelled", booking: result.booking, attempts };
      }
    }

    if (attempts < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  return {
    reason: "timeout",
    booking: lastBooking,
    attempts,
  };
}

export function userFacingCheckoutError(
  status: number,
  message: string
): string {
  if (status === 404) {
    return "This booking is unavailable.";
  }

  if (status === 409 && message.toLowerCase().includes("expired")) {
    return "This reservation has expired. Search again to start a new booking.";
  }

  if (status === 409 && message.includes("Retry shortly")) {
    return "A payment attempt is already starting. Please try again.";
  }

  if (status === 409) {
    return message || "This booking cannot be paid right now.";
  }

  if (status === 500 || status === 502 || status === 503) {
    return "Payment is temporarily unavailable. Please try again.";
  }

  return "Payment is temporarily unavailable. Please try again.";
}
