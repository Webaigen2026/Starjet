-- Abort if existing data would violate the new uniqueness rules.
-- Do not delete or rewrite Payment rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE status = 'PENDING'::"PaymentStatus"
      AND provider = 'STRIPE'
    GROUP BY "bookingId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create Payment pending uniqueness: duplicate PENDING STRIPE payments exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE "providerRef" IS NOT NULL
    GROUP BY "providerRef"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create Payment.providerRef uniqueness: duplicate non-null providerRef values exist';
  END IF;
END $$;

-- Unique Checkout Session identity for webhook idempotency.
-- Multiple NULL providerRef values remain allowed during initialization.
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- At most one active PENDING Stripe attempt per booking.
-- Multiple FAILED/PAID/REFUNDED attempts for the same booking remain allowed.
CREATE UNIQUE INDEX "Payment_one_pending_stripe_attempt"
ON "Payment" ("bookingId")
WHERE status = 'PENDING'::"PaymentStatus"
  AND provider = 'STRIPE';
