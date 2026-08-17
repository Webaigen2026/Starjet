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

/* =========================================================
   TYPES
========================================================= */

type ReviewActionsProps = {
  bookingId: string;
  baseFare: number;
  currency: string;
  travelerCount: number;
  originCode: string;
  destinationCode: string;
  departureDate: string;
};

type ProtectionChoice = "PROTECTED" | "DECLINED" | null;

/* =========================================================
   CONSTANTS
========================================================= */

const PROTECTION_PRICE_PER_TRAVELER = 24.99;

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ReviewActions({
  bookingId,
  baseFare,
  currency,
  travelerCount,
  originCode,
  destinationCode,
  departureDate,
}: ReviewActionsProps) {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [protectionChoice, setProtectionChoice] =
    useState<ProtectionChoice>(null);

  const [promoOpen, setPromoOpen] =
    useState(false);

  const [promoCode, setPromoCode] =
    useState("");

  const [appliedPromoCode, setAppliedPromoCode] =
    useState("");

  const [discountAmount, setDiscountAmount] =
    useState(0);

  const [promoError, setPromoError] =
    useState("");

  const [promoSuccess, setPromoSuccess] =
    useState("");

  const [
    travelerInformationConfirmed,
    setTravelerInformationConfirmed,
  ] = useState(false);

  const [
    termsAccepted,
    setTermsAccepted,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  /* =======================================================
     PRICE CALCULATIONS
  ======================================================= */

  const protectionAmount =
    protectionChoice === "PROTECTED"
      ? PROTECTION_PRICE_PER_TRAVELER *
        travelerCount
      : 0;

  const estimatedTotal = useMemo(() => {
    const amount =
      baseFare +
      protectionAmount -
      discountAmount;

    return Math.max(amount, 0);
  }, [
    baseFare,
    protectionAmount,
    discountAmount,
  ]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  const protectionSelected =
    protectionChoice !== null;

  const canContinue =
    protectionSelected &&
    travelerInformationConfirmed &&
    termsAccepted &&
    !submitting;

  /* =======================================================
     PROMO
  ======================================================= */

  function handleApplyPromo() {
    setPromoError("");
    setPromoSuccess("");

    const normalizedCode = promoCode
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      setPromoError(
        "Enter a promotional code."
      );

      return;
    }

    /*
      TEMPORARY DEVELOPMENT PROMO

      This lets you test the UI.

      Later, promo validation should happen through
      your backend/database instead of trusting the
      browser.
    */

    if (normalizedCode === "STARJET10") {
      const calculatedDiscount =
        Math.min(baseFare * 0.1, 50);

      setAppliedPromoCode(normalizedCode);
      setDiscountAmount(calculatedDiscount);

      setPromoSuccess(
        `${formatMoney(
          calculatedDiscount,
          currency
        )} discount applied.`
      );

      return;
    }

    setAppliedPromoCode("");
    setDiscountAmount(0);

    setPromoError(
      "This promotional code is not valid."
    );
  }

  function handleRemovePromo() {
    setPromoCode("");
    setAppliedPromoCode("");
    setDiscountAmount(0);
    setPromoError("");
    setPromoSuccess("");
  }

  /* =======================================================
     CONTINUE TO PAYMENT
  ======================================================= */

  async function handleContinue() {
    if (!protectionSelected) {
      setSubmitError(
        "Choose whether you would like travel protection."
      );

      return;
    }

    if (!travelerInformationConfirmed) {
      setSubmitError(
        "Please confirm the traveler information."
      );

      return;
    }

    if (!termsAccepted) {
      setSubmitError(
        "Please accept the booking terms before continuing."
      );

      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      /*
        SAVE REVIEW SELECTIONS

        This expects:

        app/api/bookings/[bookingId]/review/route.ts

        with a PATCH handler.
      */

      const response = await fetch(
        `/api/bookings/${encodeURIComponent(
          bookingId
        )}/review`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            travelProtection:
              protectionChoice ===
              "PROTECTED",

            travelProtectionPrice:
              protectionAmount,

            promoCode:
              appliedPromoCode || null,

            discountAmount,

            travelerConfirmed:
              travelerInformationConfirmed,

            termsAccepted,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to save your booking."
        );
      }

      /*
        NEXT PAGE

        We will build /payment next.
      */

      router.push(
        `/payment?bookingId=${encodeURIComponent(
          bookingId
        )}`
      );
    } catch (error) {
      console.error(
        "Continue to payment error:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Trip summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {originCode} → {destinationCode}
            {departureDate
              ? ` · ${departureDate}`
              : ""}
          </p>
        </div>

        {/* =================================================
            FARE
        ================================================= */}

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[15px] font-medium text-slate-700">
                Base fare
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {travelerCount}{" "}
                {travelerCount === 1
                  ? "traveler"
                  : "travelers"}
              </p>
            </div>

            <p className="text-[16px] font-semibold text-slate-950">
              {formatMoney(
                baseFare,
                currency
              )}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-[15px] font-medium text-slate-700">
              Taxes & fees
            </p>

            <p className="text-right text-sm text-slate-500">
              Calculated at checkout
            </p>
          </div>
        </div>

        {/* =================================================
            TRAVEL PROTECTION
        ================================================= */}

        <div className="border-t border-slate-200 px-6 py-6">
          {/* TITLE */}

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">
                  Travel protection
                </h3>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Optional
                </span>
              </div>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Choose whether you would like
                protection for this trip.
              </p>
            </div>
          </div>

          {/* OPTIONS */}

          <div className="mt-5 space-y-3">
            {/* ADD PROTECTION */}

            <button
              type="button"
              onClick={() => {
                setProtectionChoice(
                  "PROTECTED"
                );

                setSubmitError("");
              }}
              className={`w-full rounded-xl border p-4 text-left transition ${
                protectionChoice ===
                "PROTECTED"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* RADIO */}

                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    protectionChoice ===
                    "PROTECTED"
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {protectionChoice ===
                    "PROTECTED" && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-white"
                    />
                  )}
                </span>

                {/* TEXT */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        Add travel protection
                      </p>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        Coverage for eligible
                        delays, interruptions and
                        baggage issues.
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-950">
                        {formatMoney(
                          PROTECTION_PRICE_PER_TRAVELER,
                          currency
                        )}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        per traveler
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* NO THANKS */}

            <button
              type="button"
              onClick={() => {
                setProtectionChoice(
                  "DECLINED"
                );

                setSubmitError("");
              }}
              className={`w-full rounded-xl border p-4 text-left transition ${
                protectionChoice ===
                "DECLINED"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* RADIO */}

                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    protectionChoice ===
                    "DECLINED"
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {protectionChoice ===
                    "DECLINED" && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-white"
                    />
                  )}
                </span>

                <div>
                  <p className="font-semibold text-slate-950">
                    No thanks
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Continue without travel
                    protection.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* COVERAGE DETAILS */}

          <button
            type="button"
            className="mt-4 text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
          >
            View coverage details
          </button>
        </div>

        {/* =================================================
            PROMO CODE
        ================================================= */}

        <div className="border-t border-slate-200">
          <button
            type="button"
            onClick={() =>
              setPromoOpen(
                (current) => !current
              )
            }
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <Tag
                size={19}
                className="text-slate-500"
              />

              <div>
                <p className="font-semibold text-slate-900">
                  Have a promo code?
                </p>

                {!promoOpen && (
                  <p className="mt-0.5 text-sm text-slate-500">
                    Enter it before payment.
                  </p>
                )}
              </div>
            </div>

            {promoOpen ? (
              <ChevronUp
                size={18}
                className="text-slate-400"
              />
            ) : (
              <ChevronDown
                size={18}
                className="text-slate-400"
              />
            )}
          </button>

          {/* PROMO CONTENT */}

          {promoOpen && (
            <div className="border-t border-slate-100 px-6 pb-6 pt-5">
              {!appliedPromoCode ? (
                <>
                  <label
                    htmlFor="promoCode"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Promotional code
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="promoCode"
                      type="text"
                      value={promoCode}
                      onChange={(event) => {
                        setPromoCode(
                          event.target.value
                            .toUpperCase()
                            .replace(
                              /[^A-Z0-9]/g,
                              ""
                            )
                        );

                        setPromoError("");
                        setPromoSuccess("");
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="Enter code"
                      maxLength={30}
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={
                        handleApplyPromo
                      }
                      disabled={
                        !promoCode.trim()
                      }
                      className="rounded-lg border border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                    >
                      Apply
                    </button>
                  </div>

                  {promoError && (
                    <p className="mt-2 text-sm text-red-600">
                      {promoError}
                    </p>
                  )}

                  {promoSuccess && (
                    <p className="mt-2 text-sm text-emerald-600">
                      {promoSuccess}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check
                          size={16}
                          strokeWidth={2.5}
                          className="text-emerald-700"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          {
                            appliedPromoCode
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-700">
                          {formatMoney(
                            discountAmount,
                            currency
                          )}{" "}
                          discount applied
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleRemovePromo
                      }
                      className="text-xs font-semibold text-slate-600 transition hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            TOTAL
        ================================================= */}

        <div className="border-t border-slate-200 px-6 py-6">
          {/* PROTECTION PRICE */}

          {protectionChoice ===
            "PROTECTED" && (
            <div className="mb-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-600">
                Travel protection
              </span>

              <span className="font-medium text-slate-900">
                {formatMoney(
                  protectionAmount,
                  currency
                )}
              </span>
            </div>
          )}

          {/* DISCOUNT */}

          {discountAmount > 0 && (
            <div className="mb-4 flex items-center justify-between gap-4 text-sm">
              <span className="text-emerald-700">
                Promo discount
              </span>

              <span className="font-semibold text-emerald-700">
                −
                {formatMoney(
                  discountAmount,
                  currency
                )}
              </span>
            </div>
          )}

          {/* FINAL TOTAL */}

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[16px] font-semibold text-slate-950">
                Estimated total
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Before applicable taxes and
                fees
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[29px] font-semibold tracking-tight text-slate-950">
                {formatMoney(
                  estimatedTotal,
                  currency
                )}
              </p>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                {currency}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            CONFIRMATIONS
        ================================================= */}

        <div className="border-t border-slate-200 px-6 py-6">
          {/* TRAVELER CONFIRMATION */}

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={
                travelerInformationConfirmed
              }
              onChange={(event) => {
                setTravelerInformationConfirmed(
                  event.target.checked
                );

                setSubmitError("");
              }}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600"
            />

            <span className="text-sm leading-6 text-slate-600">
              I confirm that the traveler
              names, dates of birth and travel
              document information are correct.
            </span>
          </label>

          {/* TERMS */}

          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(
                  event.target.checked
                );

                setSubmitError("");
              }}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600"
            />

            <span className="text-sm leading-6 text-slate-600">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="font-medium text-blue-600 hover:underline"
              >
                booking terms
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="font-medium text-blue-600 hover:underline"
              >
                privacy policy
              </a>
              .
            </span>
          </label>

          {/* ERROR */}

          {submitError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {submitError}
            </div>
          )}

          {/* CONTINUE */}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Processing...
              </>
            ) : (
              <>
                Continue to payment

                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* WHAT IS MISSING */}

          {!protectionSelected && (
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Choose a travel protection
              option to continue.
            </p>
          )}

          {protectionSelected &&
            (!travelerInformationConfirmed ||
              !termsAccepted) && (
              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Confirm the required booking
                information to continue.
              </p>
            )}

          {/* SECURE */}

          <div className="mt-5 flex items-start justify-center gap-2 border-t border-slate-100 pt-5">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-center text-xs leading-5 text-slate-500">
              Secure checkout. Payment
              information is entered on the
              next step.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}