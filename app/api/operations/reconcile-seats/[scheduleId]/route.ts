import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { requireOperationsStaff } from "../../../../lib/authorization";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { scheduleId } = await params;

    const schedule = await prisma.flightSchedule.findUnique({
      where: {
        id: scheduleId,
      },
      include: {
        aircraft: true,
        seats: {
          orderBy: {
            createdAt: "asc",
          },
        },
        route: {
          include: {
            airline: true,
            originAirport: true,
            destinationAirport: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Flight schedule not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------
    // Flight must still be operationally editable
    // ----------------------------------------------------

    if (
      schedule.status === "BOARDING" ||
      schedule.status === "DEPARTED" ||
      schedule.status === "ARRIVED" ||
      schedule.status === "CANCELLED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seat inventory cannot be reconciled after boarding has started or the flight has ended.",
          data: {
            scheduleStatus: schedule.status,
          },
        },
        { status: 409 }
      );
    }

    const aircraft = schedule.aircraft;

    const configuredCapacity =
      aircraft.firstClassSeats +
      aircraft.businessSeats +
      aircraft.premiumSeats +
      aircraft.economySeats;

    // ----------------------------------------------------
    // Aircraft configuration validation
    // ----------------------------------------------------

    if (configuredCapacity !== aircraft.capacity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aircraft seat configuration does not match aircraft capacity.",
          data: {
            aircraftId: aircraft.id,
            capacity: aircraft.capacity,
            configuredSeats: configuredCapacity,
            firstClassSeats: aircraft.firstClassSeats,
            businessSeats: aircraft.businessSeats,
            premiumSeats: aircraft.premiumSeats,
            economySeats: aircraft.economySeats,
          },
        },
        { status: 409 }
      );
    }

    const beforeCount = schedule.seats.length;

    // ----------------------------------------------------
    // Too many seats
    // ----------------------------------------------------

    if (beforeCount > aircraft.capacity) {
      const numberToRemove =
        beforeCount - aircraft.capacity;

      const removableSeats = schedule.seats
        .filter(
          (seat) =>
            seat.status === "AVAILABLE" &&
            seat.bookingId === null &&
            seat.passengerId === null
        )
        .sort((a, b) =>
          b.seatNumber.localeCompare(
            a.seatNumber,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            }
          )
        );

      if (removableSeats.length < numberToRemove) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Aircraft capacity is smaller than the current assigned seat inventory. Reconciliation cannot safely remove passenger seats.",
            data: {
              aircraftCapacity: aircraft.capacity,
              currentSeats: beforeCount,
              seatsToRemove: numberToRemove,
              removableSeats: removableSeats.length,
              assignedSeats:
                beforeCount - removableSeats.length,
            },
          },
          { status: 409 }
        );
      }

      const idsToRemove = removableSeats
        .slice(0, numberToRemove)
        .map((seat) => seat.id);

      await prisma.$transaction(async (tx) => {
        await tx.seat.deleteMany({
          where: {
            id: {
              in: idsToRemove,
            },
            scheduleId,
            status: "AVAILABLE",
            bookingId: null,
            passengerId: null,
          },
        });

        const available = await tx.seat.count({
          where: {
            scheduleId,
            status: "AVAILABLE",
            bookingId: null,
            passengerId: null,
          },
        });

        await tx.flightSchedule.update({
          where: {
            id: scheduleId,
          },
          data: {
            availableSeats: available,
          },
        });
      });
    }

    // ----------------------------------------------------
    // Too few seats
    // ----------------------------------------------------

    if (beforeCount < aircraft.capacity) {
      /*
       * IMPORTANT:
       *
       * Instead of blindly appending random seat numbers,
       * construct the complete expected layout for the
       * aircraft and create only seats that don't already
       * exist.
       */

      const expectedSeats: Prisma.SeatCreateManyInput[] = [];

      let row = 1;

      // FIRST CLASS
      for (let i = 0; i < aircraft.firstClassSeats; i++) {
        const letter = String.fromCharCode(
          65 + (i % 4)
        );

        expectedSeats.push({
          scheduleId,
          seatNumber: `${row}${letter}`,
          seatClass: "FIRST",
          status: "AVAILABLE",
          price: Number(schedule.baseFare) + 500,
        });

        if ((i + 1) % 4 === 0) {
          row++;
        }
      }

      // BUSINESS
      for (let i = 0; i < aircraft.businessSeats; i++) {
        const letter = String.fromCharCode(
          65 + (i % 4)
        );

        expectedSeats.push({
          scheduleId,
          seatNumber: `${row}${letter}`,
          seatClass: "BUSINESS",
          status: "AVAILABLE",
          price: Number(schedule.baseFare) + 250,
        });

        if ((i + 1) % 4 === 0) {
          row++;
        }
      }

      // PREMIUM
      //
      // Your current Prisma seatClass setup stores
      // premium seats as ECONOMY.
      //
      for (let i = 0; i < aircraft.premiumSeats; i++) {
        const letter = String.fromCharCode(
          65 + (i % 6)
        );

        expectedSeats.push({
          scheduleId,
          seatNumber: `${row}${letter}`,
          seatClass: "ECONOMY",
          status: "AVAILABLE",
          price: Number(schedule.baseFare) + 75,
        });

        if ((i + 1) % 6 === 0) {
          row++;
        }
      }

      // ECONOMY
      for (let i = 0; i < aircraft.economySeats; i++) {
        const letter = String.fromCharCode(
          65 + (i % 6)
        );

        expectedSeats.push({
          scheduleId,
          seatNumber: `${row}${letter}`,
          seatClass: "ECONOMY",
          status: "AVAILABLE",
          price: Number(schedule.baseFare),
        });

        if ((i + 1) % 6 === 0) {
          row++;
        }
      }

      const existingSeatNumbers = new Set(
        schedule.seats.map((seat) => seat.seatNumber)
      );

      const missingSeats = expectedSeats.filter(
        (seat) =>
          !existingSeatNumbers.has(seat.seatNumber)
      );

      await prisma.$transaction(async (tx) => {
        if (missingSeats.length > 0) {
          await tx.seat.createMany({
            data: missingSeats,
            skipDuplicates: true,
          });
        }

        const available = await tx.seat.count({
          where: {
            scheduleId,
            status: "AVAILABLE",
            bookingId: null,
            passengerId: null,
          },
        });

        await tx.flightSchedule.update({
          where: {
            id: scheduleId,
          },
          data: {
            availableSeats: available,
          },
        });
      });
    }

    // ----------------------------------------------------
    // Final authoritative counts
    // ----------------------------------------------------

    const finalSeats = await prisma.seat.findMany({
      where: {
        scheduleId,
      },
      select: {
        id: true,
        seatNumber: true,
        seatClass: true,
        status: true,
        bookingId: true,
        passengerId: true,
      },
    });

    const finalAvailable = finalSeats.filter(
      (seat) =>
        seat.status === "AVAILABLE" &&
        seat.bookingId === null &&
        seat.passengerId === null
    ).length;

    const finalAssigned = finalSeats.filter(
      (seat) =>
        seat.bookingId !== null ||
        seat.passengerId !== null ||
        seat.status === "BOOKED" ||
        seat.status === "RESERVED"
    ).length;

    // Make absolutely sure schedule counter agrees
    // with actual inventory.
    await prisma.flightSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        availableSeats: finalAvailable,
      },
    });

    // ----------------------------------------------------
    // Final integrity check
    // ----------------------------------------------------

    if (finalSeats.length !== aircraft.capacity) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Seat reconciliation finished but inventory still does not match aircraft capacity.",
          data: {
            scheduleId,
            aircraftCapacity: aircraft.capacity,
            actualSeatCount: finalSeats.length,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seat inventory reconciled successfully.",

      data: {
        scheduleId,

        flight: {
          airline: schedule.route.airline.name,
          airlineCode:
            schedule.route.airline.iataCode,
          flightNumber:
            schedule.route.flightNumber,
          status: schedule.status,
        },

        route: {
          origin: {
            airport:
              schedule.route.originAirport.name,
            code:
              schedule.route.originAirport.iataCode,
          },

          destination: {
            airport:
              schedule.route.destinationAirport.name,
            code:
              schedule.route.destinationAirport.iataCode,
          },
        },

        aircraft: {
          id: aircraft.id,
          manufacturer: aircraft.manufacturer,
          model: aircraft.model,
          registration:
            aircraft.registrationNumber,
          capacity: aircraft.capacity,
        },

        seats: {
          before: beforeCount,
          after: finalSeats.length,
          available: finalAvailable,
          assigned: finalAssigned,
          synchronized:
            finalSeats.length === aircraft.capacity,
        },
      },
    });
  } catch (error) {
    console.error("RECONCILE SEATS ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reconcile flight seats.",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}