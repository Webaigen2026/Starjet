import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalBookings,
      totalCargoRequests,
      totalCharterRequests,
      pendingBookings,
      pendingCargoRequests,
      pendingCharterRequests,
      confirmedBookings,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.booking.count(),

      prisma.cargoRequest.count(),

      prisma.charterRequest.count(),

      prisma.booking.count({
        where: { status: "DRAFT" },
      }),

      prisma.cargoRequest.count({
        where: { status: "NEW" },
      }),

      prisma.charterRequest.count({
        where: { status: "NEW" },
      }),

      prisma.booking.count({
        where: { status: "CONFIRMED" },
      }),

      prisma.booking.aggregate({
        where: {
          status: "CONFIRMED",
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalCargoRequests,
        totalCharterRequests,
        pendingBookings,
        pendingCargoRequests,
        pendingCharterRequests,
        confirmedBookings,
        totalRevenue: revenueResult._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats fetch failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}