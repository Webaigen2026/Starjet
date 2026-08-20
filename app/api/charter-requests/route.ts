import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import {
  requireAdmin,
  requireAuthenticatedUser,
  requireOperationsStaff,
} from "../../lib/authorization";

export async function GET() {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const charterRequests = await prisma.charterRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: charterRequests,
    });
  } catch (error) {
    console.error("Charter request fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch charter requests",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    if (
      !body.fullName ||
      !body.email ||
      !body.phone ||
      !body.departureCity ||
      !body.destinationCity ||
      !body.departureDate ||
      !body.passengersCount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const charterRequest = await prisma.charterRequest.create({
      data: {
        requestCode: `CH-${Date.now()}`,

        userId: auth.user.id,

        fullName: body.fullName,
        email: body.email,
        phone: body.phone,

        departureCity: body.departureCity,
        destinationCity: body.destinationCity,

        departureDate: new Date(body.departureDate),
        returnDate: body.returnDate ? new Date(body.returnDate) : null,

        passengersCount: Number(body.passengersCount),
        aircraftType: body.aircraftType || null,
        budgetRange: body.budgetRange || null,
        message: body.message || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Charter request created successfully",
        data: charterRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Charter request creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create charter request",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    await prisma.charterRequest.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All charter requests deleted successfully",
    });
  } catch (error) {
    console.error("Charter request delete failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete charter requests",
      },
      { status: 500 }
    );
  }
}