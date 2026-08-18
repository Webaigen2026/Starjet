"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import {
  checkoutLoginPath,
  createExclusiveRunner,
  fetchAuthoritativeBooking,
  isTicketEligible,
  pollAuthoritativeBooking,
  requestCheckoutSessionWithTransientRetry,
  resolveCheckoutView,
  userFacingCheckoutError,
  type CheckoutPaymentSnapshot,
  type CheckoutViewKind,
} from "./checkoutPayment";

type CheckoutPayButtonProps = {
  bookingId: string;
  initialBooking: CheckoutPaymentSnapshot;
};

export default function CheckoutPayButton({
  bookingId,
  initialBooking,
}: CheckoutPayButtonProps) {
  const [booking, setBooking] = useState(initialBooking);
  const [view, setView] = useState<CheckoutViewKind>(
    resolveCheckoutView(initialBooking)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const payLock = useRef(createExclusiveRunner());
  const cancelled = useRef(false);
  const pollInFlight = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    async function refreshAndMaybePoll() {
      const result = await fetchAuthoritativeBooking(bookingId, {
        fetch,
      });

      if (cancelled.current) {
        return;
      }

      if (result.kind === "unauthorized") {
        window.location.assign(checkoutLoginPath(bookingId));
        return;
      }

      if (result.kind === "not_found") {
        setView("unavailable");
        setError("This booking is unavailable.");
        return;
      }

      if (result.kind !== "ok") {
        return;
      }

      setBooking(result.booking);
      const nextView = resolveCheckoutView(result.booking);
      setView(nextView);

      if (
        nextView !== "confirming" ||
        pollInFlight.current ||
        cancelled.current
      ) {
        return;
      }

      pollInFlight.current = true;

      const polled = await pollAuthoritativeBooking({
        bookingId,
        fetch,
        isCancelled: () => cancelled.current,
        onSnapshot: (snapshot) => {
          if (!cancelled.current) {
            setBooking(snapshot);
            setView(resolveCheckoutView(snapshot));
          }
        },
      });

      pollInFlight.current = false;

      if (cancelled.current || polled.reason === "unmounted") {
        return;
      }

      if (polled.reason === "unauthorized") {
        window.location.assign(checkoutLoginPath(bookingId));
        return;
      }

      if (polled.reason === "not_found") {
        setView("unavailable");
        setError("This booking is unavailable.");
        return;
      }

      if (polled.booking) {
        setBooking(polled.booking);
        setView(resolveCheckoutView(polled.booking));
      }

      if (polled.reason === "timeout") {
        setTimedOut(true);
      }
    }

    void refreshAndMaybePoll();

    return () => {
      cancelled.current = true;
    };
  }, [bookingId]);

  async function handlePay() {
    setError("");
    setTimedOut(false);

    const started = await payLock.current.run(async () => {
      setBusy(true);

      try {
        const result = await requestCheckoutSessionWithTransientRetry(
          bookingId,
          { fetch }
        );

        if (result.ok) {
          window.location.assign(result.url);
          return;
        }

        if (result.status === 401) {
          window.location.assign(checkoutLoginPath(bookingId));
          return;
        }

        if (result.status === 409) {
          const refreshed = await fetchAuthoritativeBooking(bookingId, {
            fetch,
          });

          if (refreshed.kind === "ok") {
            setBooking(refreshed.booking);
            const nextView = resolveCheckoutView(refreshed.booking);
            setView(nextView);

            if (nextView === "confirmed" || nextView === "failed" || nextView === "cancelled") {
              payLock.current.reset();
              setBusy(false);
              return;
            }
          }

          setError(userFacingCheckoutError(result.status, result.message));
          payLock.current.reset();
          setBusy(false);
          return;
        }

        setError(userFacingCheckoutError(result.status, result.message));
        payLock.current.reset();
        setBusy(false);
      } catch {
        setError("Payment is temporarily unavailable. Please try again.");
        payLock.current.reset();
        setBusy(false);
      }
    });

    if (started === undefined && !payLock.current.isRunning()) {
      return;
    }
  }

  if (view === "confirmed" && isTicketEligible(booking)) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm font-medium text-emerald-700">
          Payment confirmed. Your booking is complete.
        </p>
        <Link
          href={`/tickets/${encodeURIComponent(bookingId)}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          View ticket
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (view === "failed") {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm leading-6 text-slate-700">
          This reservation is no longer active.
        </p>
        <p className="text-xs leading-5 text-slate-500">
          If a payment was taken, it will not appear as a confirmed booking
          here. Contact StarJet if you need help with a charge.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/flights"
            className="flex h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white"
          >
            Search flights
          </Link>
          <Link
            href="/my-trips"
            className="flex h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700"
          >
            My Trips
          </Link>
        </div>
      </div>
    );
  }

  if (view === "cancelled") {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm leading-6 text-slate-700">
          This booking was cancelled and is not confirmed.
        </p>
        <Link
          href="/my-trips"
          className="flex h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700"
        >
          My Trips
        </Link>
      </div>
    );
  }

  const showPay = view === "pay" || view === "confirming";

  return (
    <div className="mt-6">
      {view === "confirming" && (
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Payment is being confirmed. This can take a few seconds.
        </p>
      )}

      {timedOut && view !== "confirmed" && (
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Payment is still being processed. Check My Trips shortly.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
        >
          {error}
        </div>
      )}

      {showPay && (
        <button
          type="button"
          onClick={() => {
            void handlePay();
          }}
          disabled={busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Redirecting to secure payment...
            </>
          ) : (
            <>
              Pay
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      )}

      {view === "unavailable" && !error && (
        <p className="text-sm text-slate-600">This booking is unavailable.</p>
      )}

      <div className="mt-4 flex items-start gap-2">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-xs leading-5 text-slate-500">
          You will complete payment on Stripe. This page confirms your booking
          only after StarJet receives payment.
        </p>
      </div>
    </div>
  );
}
