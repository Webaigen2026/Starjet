-- Abort if existing data would violate one PAID Payment per booking.
-- Do not delete or rewrite Payment rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Payment"
    WHERE status = 'PAID'::"PaymentStatus"
    GROUP BY "bookingId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create Payment paid uniqueness: duplicate PAID payments exist for one booking';
  END IF;
END $$;

-- At most one PAID capture per booking.
-- Multiple FAILED/PENDING/REFUNDED attempts for the same booking remain allowed.
CREATE UNIQUE INDEX "Payment_one_paid_per_booking"
ON "Payment" ("bookingId")
WHERE status = 'PAID'::"PaymentStatus";
