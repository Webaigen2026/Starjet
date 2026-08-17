import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireOperationsStaff } from "@/app/lib/authorization";

//
// GET ALL SCHEDULES
//
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const routeId = searchParams.get("routeId") ?? "";

    const schedules = await prisma.flightSchedule.findMany({
      where: routeId
        ? {
            routeId,
          }
        : {},

      include: {
        aircraft: true,
        route: {
          include: {
            airline: true,
            originAirport: true,
            destinationAirport: true,
          },
        },
        seats: true,
      },

      orderBy: {
        departureTime: "asc",
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to fetch schedules.",
      },
      {
        status: 500,
      }
    );
  }
}

//
// CREATE SCHEDULE
//
export async function POST(request: NextRequest) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    if (
      !body.routeId ||
      !body.aircraftId ||
      !body.departureTime ||
      !body.arrivalTime ||
      body.baseFare == null
    ) {
      return NextResponse.json(
        {
          message: "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }

    const route = await prisma.flightRoute.findUnique({
      where: {
        id: body.routeId,
      },
    });

    if (!route) {
      return NextResponse.json(
        {
          message: "Route not found.",
        },
        {
          status: 404,
        }
      );
    }

    const aircraft = await prisma.aircraft.findUnique({
      where: {
        id: body.aircraftId,
      },
    });

    if (!aircraft) {
      return NextResponse.json(
        {
          message: "Aircraft not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !Number.isInteger(aircraft.capacity) ||
      aircraft.capacity < 1
    ) {
      return NextResponse.json(
        {
          message:
            "This aircraft does not have a valid capacity, so schedule inventory cannot be initialized.",
        },
        {
          status: 400,
        }
      );
    }

    //
    // Create Schedule
    //
    // availableSeats is server-controlled inventory.
    // Request-body availableSeats is ignored.
    //
    const schedule = await prisma.flightSchedule.create({
      data: {
        routeId: body.routeId,
        aircraftId: body.aircraftId,
        departureTime: new Date(body.departureTime),
        arrivalTime: new Date(body.arrivalTime),
        availableSeats: aircraft.capacity,
        baseFare: Number(body.baseFare),
        status: body.status ?? "SCHEDULED",
      },
    });

    //
    // Generate Seats
    //
    const seats: any[] = [];

    let business = 1;
    let premium = 1;
    let first = 1;
    let economy = 1;

    for (let i = 0; i < aircraft.businessSeats; i++) {
      seats.push({
        scheduleId: schedule.id,
        seatNumber: `B${business++}`,
        seatClass: "BUSINESS",
        status: "AVAILABLE",
        price: Number(body.baseFare) * 2,
      });
    }

    for (let i = 0; i < aircraft.premiumSeats; i++) {
      seats.push({
        scheduleId: schedule.id,
        seatNumber: `P${premium++}`,
        seatClass: "PREMIUM",
        status: "AVAILABLE",
        price: Number(body.baseFare) * 1.5,
      });
    }

    for (let i = 0; i < aircraft.firstClassSeats; i++) {
      seats.push({
        scheduleId: schedule.id,
        seatNumber: `F${first++}`,
        seatClass: "FIRST",
        status: "AVAILABLE",
        price: Number(body.baseFare) * 3,
      });
    }

    for (let i = 0; i < aircraft.economySeats; i++) {
      seats.push({
        scheduleId: schedule.id,
        seatNumber: `E${economy++}`,
        seatClass: "ECONOMY",
        status: "AVAILABLE",
        price: Number(body.baseFare),
      });
    }

    if (seats.length > 0) {
      await prisma.seat.createMany({
        data: seats,
      });
    }

    const createdSchedule = await prisma.flightSchedule.findUnique({
      where: {
        id: schedule.id,
      },
      include: {
        aircraft: true,
        seats: true,
        route: {
          include: {
            airline: true,
            originAirport: true,
            destinationAirport: true,
          },
        },
      },
    });

    return NextResponse.json(createdSchedule, {
      status: 201,
    });
  } catch (error) {
    console.error("POST Schedule Error:", error);

    return NextResponse.json(
      {
        message: "Unable to create schedule.",
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}