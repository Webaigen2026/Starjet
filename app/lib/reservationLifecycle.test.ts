import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clampAvailableSeats } from "./scheduleInventory";
import {
  calculateReservationExpiresAt,
  claimAndReleaseInventory,
  isUnpaidDraftExpired,
  requestTouchesLifecycleStatus,
  RESERVATION_HOLD_MINUTES,
  RESERVATION_HOLD_MS,
  unpaidDraftExpirationWhere,
} from "./reservationLifecycle";

describe("reservation expiration timing", () => {
  it("sets reservationExpiresAt exactly 15 minutes after creation", () => {
    const from = new Date("2026-08-17T21:00:00.000Z");
    const expiresAt = calculateReservationExpiresAt(from);

    assert.equal(RESERVATION_HOLD_MINUTES, 15);
    assert.equal(
      expiresAt.getTime() - from.getTime(),
      RESERVATION_HOLD_MS
    );
    assert.equal(expiresAt.toISOString(), "2026-08-17T21:15:00.000Z");
  });

  it("does not accept a client-chosen expiration in the helper", () => {
    const from = new Date("2026-08-17T21:00:00.000Z");
    const clientValue = new Date("2099-01-01T00:00:00.000Z");

    assert.notEqual(
      calculateReservationExpiresAt(from).getTime(),
      clientValue.getTime()
    );
  });
});

describe("isUnpaidDraftExpired", () => {
  const expiredAt = new Date("2026-08-17T21:00:00.000Z");
  const now = new Date("2026-08-17T21:16:00.000Z");

  it("does not expire a non-expired DRAFT", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "DRAFT",
          paymentStatus: "PENDING",
          reservationExpiresAt: new Date("2026-08-17T21:20:00.000Z"),
        },
        now
      ),
      false
    );
  });

  it("expires an unpaid DRAFT after reservationExpiresAt", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "DRAFT",
          paymentStatus: "PENDING",
          reservationExpiresAt: expiredAt,
        },
        now
      ),
      true
    );
  });

  it("does not expire a PAID booking", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "DRAFT",
          paymentStatus: "PAID",
          reservationExpiresAt: expiredAt,
        },
        now
      ),
      false
    );
  });

  it("does not expire when a PAID Payment row exists even if paymentStatus is stale", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "DRAFT",
          paymentStatus: "PENDING",
          reservationExpiresAt: expiredAt,
          payments: [{ status: "PAID" }],
        },
        now
      ),
      false
    );
  });

  it("does not expire a CONFIRMED booking", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          reservationExpiresAt: expiredAt,
        },
        now
      ),
      false
    );
  });

  it("expires a guest DRAFT without using email or userId", () => {
    assert.equal(
      isUnpaidDraftExpired(
        {
          status: "DRAFT",
          paymentStatus: "PENDING",
          reservationExpiresAt: expiredAt,
        },
        now
      ),
      true
    );
  });
});

describe("expiration query and staff lifecycle guard", () => {
  it("query only targets unpaid expired DRAFT bookings without PAID payments", () => {
    const now = new Date("2026-08-17T21:16:00.000Z");
    const where = unpaidDraftExpirationWhere(now);

    assert.equal(where.status, "DRAFT");
    assert.deepEqual(where.paymentStatus, { not: "PAID" });
    assert.deepEqual(where.reservationExpiresAt, { lte: now });
    assert.deepEqual(where.payments, {
      none: {
        status: "PAID",
      },
    });
  });

  it("generic staff PATCH is treated as a lifecycle bypass when status fields are present", () => {
    assert.equal(
      requestTouchesLifecycleStatus({
        status: "CANCELLED",
      }),
      true
    );
    assert.equal(
      requestTouchesLifecycleStatus({
        paymentStatus: "PAID",
      }),
      true
    );
    assert.equal(
      requestTouchesLifecycleStatus({
        customerName: "Ada",
      }),
      false
    );
  });

  it("never lets restored inventory exceed aircraft capacity", () => {
    assert.equal(clampAvailableSeats(181, 180), 180);
  });
});

describe("claimAndReleaseInventory", () => {
  function createInventoryTx(updateCount: number) {
    let incrementBy = 0;
    let seatsCleared = 0;

    const tx = {
      incrementBy: () => incrementBy,
      seatsCleared: () => seatsCleared,
      booking: {
        updateMany: async () => ({ count: updateCount }),
      },
      seat: {
        updateMany: async () => {
          seatsCleared += 1;
          return { count: 2 };
        },
      },
      flightSchedule: {
        findUnique: async () => ({
          id: "schedule-1",
          availableSeats: 10,
          aircraft: { capacity: 180 },
        }),
        update: async ({
          data,
        }: {
          data: { availableSeats?: { increment?: number } | number };
        }) => {
          if (
            data.availableSeats &&
            typeof data.availableSeats === "object" &&
            data.availableSeats.increment
          ) {
            incrementBy += data.availableSeats.increment;
          }

          return {
            availableSeats: 10 + incrementBy,
            aircraft: { capacity: 180 },
          };
        },
      },
    };

    return tx;
  }

  it("releases exactly passengersCount and clears seats when the transition wins", async () => {
    const tx = createInventoryTx(1);

    const result = await claimAndReleaseInventory(tx as never, {
      bookingId: "booking-1",
      scheduleId: "schedule-1",
      passengersCount: 3,
      fromWhere: { id: "booking-1" },
      toStatus: "FAILED",
    });

    assert.equal(result, "won");
    assert.equal(tx.incrementBy(), 3);
    assert.equal(tx.seatsCleared(), 1);
  });

  it("does not release twice when the status transition already lost", async () => {
    const tx = createInventoryTx(0);

    const result = await claimAndReleaseInventory(tx as never, {
      bookingId: "booking-1",
      scheduleId: "schedule-1",
      passengersCount: 3,
      fromWhere: { id: "booking-1" },
      toStatus: "CANCELLED",
    });

    assert.equal(result, "lost");
    assert.equal(tx.incrementBy(), 0);
    assert.equal(tx.seatsCleared(), 0);
  });
});
