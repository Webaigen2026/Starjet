-- Persist Stripe PaymentIntent identity on each Payment attempt.
-- Multiple NULL values remain allowed for historical/unpaid rows.

ALTER TABLE "Payment" ADD COLUMN "stripePaymentIntentId" TEXT;

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key"
ON "Payment"("stripePaymentIntentId");
