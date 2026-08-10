"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  LockKeyhole,
  ShieldCheck,
  Tag,
} from "lucide-react";

type ReviewActionsProps = {
  bookingId: string;
  baseFare: number;
  currency?: string;
  travelerCount?: number;
  originCode?: string;
  destinationCode?: string;
  departureDate?: string;
};

type ProtectionChoice = "PROTECTED" | "DECLINED" | null;

const TRAVEL_PROTECTION_PRICE = 24.99;

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function ReviewActions({
  bookingId,
  baseFare,
  currency = "USD",
  travelerCount = 1,
  originCode = "",
  destinationCode = "",
  departureDate = "",
}: ReviewActionsProps) {
  const router = useRouter();

  const [protectionChoice, setProtectionChoice] =
    useState<ProtectionChoice>(null);

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [discount, setDiscount] = useState(0);

  const [travelerConfirmed, setTravelerConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const protectionTotal =
    protectionChoice === "PROTECTED"
      ? TRAVEL_PROTECTION_PRICE * travelerCount
      : 0;

  const total = useMemo(() => {
    return Math.max(0, baseFare + protectionTotal - discount);
  }, [baseFare, protectionTotal, discount]);

  const canContinue =
    protectionChoice !== null &&
    travelerConfirmed &&
    termsAccepted &&
    !loading;

  function handleApplyPromo() {
    const normalized = promoCode.trim().toUpperCase();

    setPromoMessage("");
    setError("");

    if (!normalized) {
      setPromoMessage("Enter a promotional code.");
      return;
    }

    /*
      DEMO CODE ONLY.

      Later this should call your backend:
      POST /api/promo/validate

      Never trust discounts calculated only in the browser.
    */

    if (normalized === "STARJET10") {
      const promoDiscount = Math.min(baseFare * 0.1, 50);

      setDiscount(promoDiscount);
      setAppliedPromo(normalized);
      setPromoMessage("Promo code applied.");
      return;
    }

    setDiscount(0);
    setAppliedPromo("");
    setPromoMessage("This promotional code is not valid.");
  }

  function removePromo() {
    setPromoCode("");
    setAppliedPromo("");
    setPromoMessage("");
    setDiscount(0);
  }

  async function handleContinue() {
    if (!canContinue) return;

    setLoading(true);
    setError("");

    try {
      /*
        Save these choices to your Booking before payment.

        If your API route uses different field names,
        change ONLY the body below.
      */

      const response = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          travelProtection: protectionChoice === "PROTECTED",
          travelProtectionPrice: protectionTotal,
          promoCode: appliedPromo || null,
          discountAmount: discount,
          travelerConfirmed,
          termsAccepted,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message ||
            data?.error ||
            "We couldn't save your booking choices."
        );
      }

      router.push(`/payment?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-[21px] font-semibold tracking-tight text-slate-950">
            Trip summary
          </h2>

          {(originCode || destinationCode || departureDate) && (
            <p className="mt-1 text-sm text-slate-500">
              {originCode && destinationCode
                ? `${originCode} → ${destinationCode}`
                : ""}

              {(originCode || destinationCode) && departureDate ? " · " : ""}

              {departureDate}
            </p>
          )}
        </div>

        {/* FARE */}
        <div className="space-y-5 px-6 py-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[15px] font-medium text-slate-700">
                Base fare
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {travelerCount}{" "}
                {travelerCount === 1 ? "traveler" : "travelers"}
              </p>
            </div>

            <p className="text-[16px] font-semibold text-slate-950">
              {money(baseFare, currency)}
            </p>
          </div>

          <div className="flex items-center justify-between gap-5">
            <p className="text-[15px] font-medium text-slate-700">
              Taxes & fees
            </p>

            <p className="text-right text-sm text-slate-500">
              Calculated at checkout
            </p>
          </div>
        </div>

        {/* TRAVEL PROTECTION */}
        <div className="border-t border-slate-200 px-6 py-6">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">
                  Travel protection
                </h3>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Optional
                </span>
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Add coverage for eligible trip interruptions, delays and
                baggage issues.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* PROTECT */}
            <button
              type="button"
              onClick={() => setProtectionChoice("PROTECTED")}
              className={`w-full rounded-xl border p-4 text-left transition ${
                protectionChoice === "PROTECTED"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    protectionChoice === "PROTECTED"
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {protectionChoice === "PROTECTED" && (
                    <Check
                      size={13}
                      strokeWidth={3}
                      className="text-white"
                    />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-950">
                      Add travel protection
                    </p>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-950">
                        {money(TRAVEL_PROTECTION_PRICE, currency)}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        per traveler
                      </p>
                    </div>
                  </div>

                  <p className="mt-1 max-w-[260px] text-sm leading-5 text-slate-500">
                    Protection for eligible travel disruptions during your
                    trip.
                  </p>
                </div>
              </div>
            </button>

            {/* DECLINE */}
            <button
              type="button"
              onClick={() => setProtectionChoice("DECLINED")}
              className={`w-full rounded-xl border p-4 text-left transition ${
                protectionChoice === "DECLINED"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    protectionChoice === "DECLINED"
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {protectionChoice === "DECLINED" && (
                    <Check
                      size={13}
                      strokeWidth={3}
                      className="text-white"
                    />
                  )}
                </span>

                <div>
                  <p className="font-semibold text-slate-950">No thanks</p>

                  <p className="mt-1 text-sm text-slate-500">
                    Continue without travel protection.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View coverage details
          </button>
        </div>

        {/* PROMO */}
        <div className="border-t border-slate-200">
          <button
            type="button"
            onClick={() => setPromoOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <Tag size={19} className="text-slate-500" />

              <div>
                <p className="font-semibold text-slate-900">
                  Have a promo code?
                </p>

                {!promoOpen && (
                  <p className="mt-0.5 text-sm text-slate-500">
                    Enter it here before payment.
                  </p>
                )}
              </div>
            </div>

            {promoOpen ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>

          {promoOpen && (
            <div className="border-t border-slate-100 px-6 pb-6 pt-5">
              {!appliedPromo ? (
                <>
                  <label
                    htmlFor="promo-code"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Promotional code
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="promo-code"
                      value={promoCode}
                      onChange={(event) => {
                        setPromoCode(event.target.value.toUpperCase());
                        setPromoMessage("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="Enter code"
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim()}
                      className="rounded-lg border border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                    >
                      Apply
                    </button>
                  </div>

                  {promoMessage && (
                    <p
                      className={`mt-2 text-sm ${
                        discount > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {promoMessage}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        className="text-emerald-700"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {appliedPromo}
                      </p>

                      <p className="text-xs text-emerald-700">
                        {money(discount, currency)} discount applied
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removePromo}
                    className="text-xs font-semibold text-slate-600 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRICE */}
        <div className="border-t border-slate-200 px-6 py-6">
          {protectionChoice === "PROTECTED" && (
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">Travel protection</span>

              <span className="font-medium text-slate-900">
                {money(protectionTotal, currency)}
              </span>
            </div>
          )}

          {discount > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-emerald-700">Promo discount</span>

              <span className="font-medium text-emerald-700">
                −{money(discount, currency)}
              </span>
            </div>
          )}

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[16px] font-semibold text-slate-950">
                Estimated total
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Before applicable taxes and fees
              </p>
            </div>

            <div className="text-right">
              <p className="text-[30px] font-semibold tracking-tight text-slate-950">
                {money(total, currency)}
              </p>

              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {currency}
              </p>
            </div>
          </div>
        </div>

        {/* CONFIRMATIONS */}
        <div className="border-t border-slate-200 px-6 py-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={travelerConfirmed}
              onChange={(event) =>
                setTravelerConfirmed(event.target.checked)
              }
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
            />

            <span className="text-sm leading-6 text-slate-600">
              I confirm that the traveler name, date of birth and travel
              document information are correct.
            </span>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
            />

            <span className="text-sm leading-6 text-slate-600">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                onClick={(event) => event.stopPropagation()}
                className="font-medium text-blue-600 hover:underline"
              >
                booking terms
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                onClick={(event) => event.stopPropagation()}
                className="font-medium text-blue-600 hover:underline"
              >
                privacy policy
              </a>
              .
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                Continue to payment
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {protectionChoice === null && (
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Choose whether you want travel protection before continuing.
            </p>
          )}

          <div className="mt-5 flex items-start justify-center gap-2 border-t border-slate-100 pt-5">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-center text-xs leading-5 text-slate-500">
              Secure checkout. Payment details are entered on the next step.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}