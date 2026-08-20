import type { Prisma } from "@prisma/client";

type InventoryClient = Prisma.TransactionClient;

export const INVENTORY_RELEASED_BOOKING_STATUSES = [
  "CANCELLED",
  "REFUNDED",
  "FAILED",
] as const;

const NON_BOOKABLE_SCHEDULE_STATUSES = [
  "CANCELLED",
  "DEPARTED",
  "ARRIVED",
] as const;

export class InsufficientInventoryError extends Error {
  availableSeats: number | null;

  constructor(availableSeats: number | null) {
    super("INSUFFICIENT_INVENTORY");
    this.name = "InsufficientInventoryError";
    this.availableSeats = availableSeats;
  }
}

export function clampAvailableSeats(
  seats: number,
  capacity: number | null | undefined
): number {
  if (!Number.isFinite(seats)) {
    return 0;
  }

  const next = Math.max(0, Math.trunc(seats));

  if (
    typeof capacity !== "number" ||
    !Number.isFinite(capacity) ||
    capacity < 0
  ) {
    return next;
  }

  return Math.min(next, Math.trunc(capacity));
}

export async function getHeldPassengerCount(
  db: InventoryClient,
  scheduleId: string
): Promise<number> {
  const held = await db.booking.aggregate({
    where: {
      scheduleId,
      status: {
        notIn: [...INVENTORY_RELEASED_BOOKING_STATUSES],
      },
    },
    _sum: {
      passengersCount: true,
    },
  });

  return held._sum.passengersCount ?? 0;
}

export async function reserveScheduleSeats(
  db: InventoryClient,
  scheduleId: string,
  requestedSeats: number
): Promise<void> {
  if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
    throw new Error("INVALID_SEAT_REQUEST");
  }

  const reservation = await db.flightSchedule.updateMany({
    where: {
      id: scheduleId,
      availableSeats: {
        gte: requestedSeats,
      },
      status: {
        notIn: [...NON_BOOKABLE_SCHEDULE_STATUSES],
      },
    },
    data: {
      availableSeats: {
        decrement: requestedSeats,
      },
    },
  });

  if (reservation.count !== 1) {
    const schedule = await db.flightSchedule.findUnique({
      where: {
        id: scheduleId,
      },
      select: {
        availableSeats: true,
      },
    });

    throw new InsufficientInventoryError(schedule?.availableSeats ?? null);
  }
}

export async function releaseScheduleSeats(
  db: InventoryClient,
  scheduleId: string,
  seatsToRelease: number
): Promise<number> {
  const schedule = await db.flightSchedule.findUnique({
    where: {
      id: scheduleId,
    },
    include: {
      aircraft: true,
    },
  });

  if (!schedule) {
    throw new Error("SCHEDULE_NOT_FOUND");
  }

  if (!Number.isInteger(seatsToRelease) || seatsToRelease < 1) {
    return schedule.availableSeats;
  }

  const incremented = await db.flightSchedule.update({
    where: {
      id: scheduleId,
    },
    data: {
      availableSeats: {
        increment: seatsToRelease,
      },
    },
    include: {
      aircraft: true,
    },
  });

  const clamped = clampAvailableSeats(
    incremented.availableSeats,
    incremented.aircraft.capacity
  );

  if (clamped === incremented.availableSeats) {
    return incremented.availableSeats;
  }

  const updated = await db.flightSchedule.update({
    where: {
      id: scheduleId,
    },
    data: {
      availableSeats: clamped,
    },
  });

  return updated.availableSeats;
}

export async function syncAvailableSeatsToHeldBookings(
  db: InventoryClient,
  scheduleId: string
): Promise<number> {
  const schedule = await db.flightSchedule.findUnique({
    where: {
      id: scheduleId,
    },
    include: {
      aircraft: true,
    },
  });

  if (!schedule) {
    throw new Error("SCHEDULE_NOT_FOUND");
  }

  const heldPassengers = await getHeldPassengerCount(db, scheduleId);
  const next = clampAvailableSeats(
    schedule.aircraft.capacity - heldPassengers,
    schedule.aircraft.capacity
  );

  const updated = await db.flightSchedule.update({
    where: {
      id: scheduleId,
    },
    data: {
      availableSeats: next,
    },
  });

  return updated.availableSeats;
}
