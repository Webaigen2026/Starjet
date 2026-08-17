import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clampAvailableSeats,
  INVENTORY_RELEASED_BOOKING_STATUSES,
} from "./scheduleInventory";

describe("clampAvailableSeats", () => {
  it("never returns a negative inventory count", () => {
    assert.equal(clampAvailableSeats(-3, 180), 0);
  });

  it("does not exceed aircraft capacity", () => {
    assert.equal(clampAvailableSeats(200, 180), 180);
  });

  it("keeps a valid remaining count", () => {
    assert.equal(clampAvailableSeats(17, 180), 17);
  });

  it("truncates fractional values", () => {
    assert.equal(clampAvailableSeats(4.9, 180), 4);
  });
});

describe("inventory holding statuses", () => {
  it("releases only cancelled/refunded/failed bookings", () => {
    assert.deepEqual(INVENTORY_RELEASED_BOOKING_STATUSES, [
      "CANCELLED",
      "REFUNDED",
      "FAILED",
    ]);
  });
});
