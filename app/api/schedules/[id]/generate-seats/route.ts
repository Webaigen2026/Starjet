import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("========================================");
    console.log("GENERATE SEATS");
    console.log("Schedule ID:", id);
    console.log("========================================");

    // --------------------------------------------------
    // 1. Find schedule + aircraft
    // --------------------------------------------------
    const schedule = await prisma.flightSchedule.findUnique({
      where: {
        id,
      },
      include: {
        aircraft: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Flight schedule not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 2. Do not generate seats for completed flights
    // --------------------------------------------------
    if (
      schedule.status === "DEPARTED" ||
      schedule.status === "ARRIVED" ||
      schedule.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot generate seats for a flight with status ${schedule.status}.`,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 3. Check existing seats
    // --------------------------------------------------
    const existingSeats = await prisma.seat.count({
      where: {
        scheduleId: id,
      },
    });

    if (existingSeats > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Seats have already been generated.",
          existingSeats,
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 4. Build seat inventory
    // --------------------------------------------------
    const seats: Prisma.SeatCreateManyInput[] = [];

    let row = 1;

    // --------------------------------------------------
    // FIRST CLASS
    // 4 seats per row
    // --------------------------------------------------
    for (let i = 0; i < schedule.aircraft.firstClassSeats; i++) {
      const letter = String.fromCharCode(65 + (i % 4));

      seats.push({
        scheduleId: id,
        seatNumber: `${row}${letter}`,
        seatClass: "FIRST",
        status: "AVAILABLE",
        price: Number(schedule.baseFare) + 500,
      });

      if ((i + 1) % 4 === 0) {
        row++;
      }
    }

    // If class ended with an incomplete row,
    // move the next cabin to a fresh row.
    if (schedule.aircraft.firstClassSeats % 4 !== 0) {
      row++;
    }

    // --------------------------------------------------
    // BUSINESS CLASS
    // 4 seats per row
    // --------------------------------------------------
    for (let i = 0; i < schedule.aircraft.businessSeats; i++) {
      const letter = String.fromCharCode(65 + (i % 4));

      seats.push({
        scheduleId: id,
        seatNumber: `${row}${letter}`,
        seatClass: "BUSINESS",
        status: "AVAILABLE",
        price: Number(schedule.baseFare) + 250,
      });

      if ((i + 1) % 4 === 0) {
        row++;
      }
    }

    if (schedule.aircraft.businessSeats % 4 !== 0) {
      row++;
    }

    // --------------------------------------------------
    // PREMIUM
    //
    // Your current Prisma SeatClass does not appear to
    // contain PREMIUM, so we keep your existing behavior
    // and store premium seats as ECONOMY.
    // --------------------------------------------------
    for (let i = 0; i < schedule.aircraft.premiumSeats; i++) {
      const letter = String.fromCharCode(65 + (i % 6));

      seats.push({
        scheduleId: id,
        seatNumber: `${row}${letter}`,
        seatClass: "ECONOMY",
        status: "AVAILABLE",
        price: Number(schedule.baseFare) + 75,
      });

      if ((i + 1) % 6 === 0) {
        row++;
      }
    }

    if (schedule.aircraft.premiumSeats % 6 !== 0) {
      row++;
    }

    // --------------------------------------------------
    // ECONOMY
    // 6 seats per row
    // --------------------------------------------------
    for (let i = 0; i < schedule.aircraft.economySeats; i++) {
      const letter = String.fromCharCode(65 + (i % 6));

      seats.push({
        scheduleId: id,
        seatNumber: `${row}${letter}`,
        seatClass: "ECONOMY",
        status: "AVAILABLE",
        price: Number(schedule.baseFare),
      });

      if ((i + 1) % 6 === 0) {
        row++;
      }
    }

    // --------------------------------------------------
    // 5. Validate aircraft configuration
    // --------------------------------------------------
    const configuredSeatCount =
      schedule.aircraft.firstClassSeats +
      schedule.aircraft.businessSeats +
      schedule.aircraft.premiumSeats +
      schedule.aircraft.economySeats;

    if (configuredSeatCount !== schedule.aircraft.capacity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aircraft seat configuration does not match aircraft capacity.",
          data: {
            aircraftId: schedule.aircraft.id,
            aircraft: schedule.aircraft.model,
            capacity: schedule.aircraft.capacity,
            configuredSeats: configuredSeatCount,
            firstClassSeats: schedule.aircraft.firstClassSeats,
            businessSeats: schedule.aircraft.businessSeats,
            premiumSeats: schedule.aircraft.premiumSeats,
            economySeats: schedule.aircraft.economySeats,
          },
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 6. Generate seats AND synchronize availableSeats
    //    in one transaction
    // --------------------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.seat.createMany({
        data: seats,
      });

      const updatedSchedule = await tx.flightSchedule.update({
        where: {
          id,
        },
        data: {
          availableSeats: seats.length,
        },
      });

      return {
        created,
        updatedSchedule,
      };
    });

    console.log("Seats created:", result.created.count);
    console.log(
      "availableSeats synchronized:",
      result.updatedSchedule.availableSeats
    );

    // --------------------------------------------------
    // 7. Return result
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      message: "Seats generated and inventory synchronized successfully.",
      data: {
        scheduleId: id,

        aircraft: {
          id: schedule.aircraft.id,
          manufacturer: schedule.aircraft.manufacturer,
          model: schedule.aircraft.model,
          registration: schedule.aircraft.registrationNumber,
          capacity: schedule.aircraft.capacity,
        },

        inventory: {
          totalSeats: result.created.count,
          availableSeats: result.updatedSchedule.availableSeats,
          firstClass: schedule.aircraft.firstClassSeats,
          business: schedule.aircraft.businessSeats,
          premium: schedule.aircraft.premiumSeats,
          economy: schedule.aircraft.economySeats,
        },
      },
    });
  } catch (error) {
    console.error("========================================");
    console.error("GENERATE SEATS ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate seats.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}