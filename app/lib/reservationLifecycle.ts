import type { Prisma, PrismaClient } from "@prisma/client";
import { releaseScheduleSeats } from "./scheduleInventory";

type InventoryClient = Prisma.TransactionClient;

export const RESERVATION_HOLD_MINUTES = 15;
export const RESERVATION_HOLD_MS =
  RESERVATION_HOLD_MINUTES * 60 * 1000;

export const UNPAID_HOLDING_STATUS = "DRAFT" as const;
export const EXPIRED_RESERVATION_STATUS = "FAILED" as const;

export const SEARCH_EXPIRATION_BATCH_LIMIT = 25;
export const CLEANUP_EXPIRATION_BATCH_LIMIT = 50;

export const NON_CANCELLABLE_BOOKING_STATUSES = [
  "CANCELLED",
  "BOARDED",
  "COMPLETED",
  "FAILED",
] as const;

export function calculateReservationExpiresAt(
  from: Date = new Date()
): Date {
  return new Date(from.getTime() + RESERVATION_HOLD_MS);
}

export function requestTouchesLifecycleStatus(body: {
  status?: unknown;
  paymentStatus?: unknown;
}): boolean {
  return body.status !== undefined || body.paymentStatus !== undefined;
}

export function isUnpaidDraftExpired(
  booking: {
    status: string;
    paymentStatus: string;
    reservationExpiresAt: Date | string | null;
    payments?: Array<{ status: string }>;
  },
  now: Date = new Date()
): boolean {
  if (booking.status !== UNPAID_HOLDING_STATUS) {
    return false;
  }

  if (booking.paymentStatus === "PAID") {
    return false;
  }

  if (booking.payments?.some((payment) => payment.status === "PAID")) {
    return false;
  }

  if (!booking.reservationExpiresAt) {
    return false;
  }

  const expiresAt = new Date(booking.reservationExpiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() <= now.getTime();
}

async function clearAssignedSeats(
  db: InventoryClient,
  bookingId: string
) {
  await db.seat.updateMany({
    where: {
      bookingId,
    },
    data: {
      bookingId: null,
      passengerId: null,
      status: "AVAILABLE",
    },
  });
}

export async function claimAndReleaseInventory(
  db: InventoryClient,
  params: {
    bookingId: string;
    scheduleId: string;
    passengersCount: number;
    fromWhere: Prisma.BookingWhereInput;
    toStatus: "CANCELLED" | "FAILED";
    extraData?: Prisma.BookingUpdateManyMutationInput;
  }
): Promise<"won" | "lost"> {
  const claimed = await db.booking.updateMany({
    where: params.fromWhere,
    data: {
      ...params.extraData,
      status: params.toStatus,
    },
  });

  if (claimed.count !== 1) {
    return "lost";
  }

  await clearAssignedSeats(db, params.bookingId);
  await releaseScheduleSeats(
    db,
    params.scheduleId,
    params.passengersCount
  );

  return "won";
}

export function unpaidDraftExpirationWhere(
  now: Date = new Date()
): Prisma.BookingWhereInput {
  return {
    status: UNPAID_HOLDING_STATUS,
    paymentStatus: {
      not: "PAID",
    },
    reservationExpiresAt: {
      lte: now,
    },
    payments: {
      none: {
        status: "PAID",
      },
    },
  };
}

export async function expireUnpaidReservation(
  db: PrismaClient,
  bookingId: string,
  now: Date = new Date()
): Promise<"expired" | "unchanged"> {
  const booking = await db.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      passengersCount: true,
      scheduleId: true,
      reservationExpiresAt: true,
      payments: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!booking || !isUnpaidDraftExpired(booking, now)) {
    return "unchanged";
  }

  const result = await db.$transaction(async (tx) => {
    return claimAndReleaseInventory(tx, {
      bookingId: booking.id,
      scheduleId: booking.scheduleId,
      passengersCount: booking.passengersCount,
      fromWhere: {
        id: booking.id,
        ...unpaidDraftExpirationWhere(now),
      },
      toStatus: EXPIRED_RESERVATION_STATUS,
    });
  });

  return result === "won" ? "expired" : "unchanged";
}

export async function expireExpiredDraftsOnSchedules(
  db: PrismaClient,
  scheduleIds: string[],
  limit: number = SEARCH_EXPIRATION_BATCH_LIMIT,
  now: Date = new Date()
): Promise<number> {
  const uniqueIds = [...new Set(scheduleIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return 0;
  }

  const batchSize = Math.min(Math.max(limit, 1), 100);

  const expired = await db.booking.findMany({
    where: {
      scheduleId: {
        in: uniqueIds,
      },
      ...unpaidDraftExpirationWhere(now),
    },
    select: {
      id: true,
    },
    orderBy: {
      reservationExpiresAt: "asc",
    },
    take: batchSize,
  });

  let expiredCount = 0;

  for (const booking of expired) {
    const result = await expireUnpaidReservation(db, booking.id, now);

    if (result === "expired") {
      expiredCount += 1;
    }
  }

  return expiredCount;
}

export async function expireExpiredUnpaidReservations(
  db: PrismaClient,
  limit: number = CLEANUP_EXPIRATION_BATCH_LIMIT,
  now: Date = new Date()
): Promise<number> {
  const batchSize = Math.min(Math.max(limit, 1), 100);

  const expired = await db.booking.findMany({
    where: unpaidDraftExpirationWhere(now),
    select: {
      id: true,
    },
    orderBy: {
      reservationExpiresAt: "asc",
    },
    take: batchSize,
  });

  let expiredCount = 0;

  for (const booking of expired) {
    const result = await expireUnpaidReservation(db, booking.id, now);

    if (result === "expired") {
      expiredCount += 1;
    }
  }

  return expiredCount;
}
