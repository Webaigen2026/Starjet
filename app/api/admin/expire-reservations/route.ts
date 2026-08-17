import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/authorization";
import {
  CLEANUP_EXPIRATION_BATCH_LIMIT,
  expireExpiredUnpaidReservations,
} from "../../../lib/reservationLifecycle";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    let limit = CLEANUP_EXPIRATION_BATCH_LIMIT;

    try {
      const body = await request.json();

      if (typeof body?.limit === "number" && Number.isInteger(body.limit)) {
        limit = body.limit;
      }
    } catch {
      // empty or non-JSON body is fine
    }

    const expiredCount = await expireExpiredUnpaidReservations(
      prisma,
      limit
    );

    return NextResponse.json({
      success: true,
      message: "Expired unpaid reservations processed.",
      data: {
        expiredCount,
        batchLimit: Math.min(Math.max(limit, 1), 100),
      },
    });
  } catch (error) {
    console.error("EXPIRE RESERVATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to expire unpaid reservations.",
      },
      {
        status: 500,
      }
    );
  }
}
