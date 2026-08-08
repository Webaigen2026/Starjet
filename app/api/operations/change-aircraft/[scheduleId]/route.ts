import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    const body = await request.json();

    const {
      aircraftId,
      reason,
    }: {
      aircraftId?: string;
      reason?: string;
    } = body;

    console.log("========================================");
    console.log("CHANGE AIRCRAFT");
    console.log("Schedule ID:", scheduleId);
    console.log("New Aircraft ID:", aircraftId);
    console.log("Reason:", reason);
    console.log("========================================");

    // --------------------------------------------------------
    // Validate Request
    // --------------------------------------------------------

    if (!aircraftId) {
      return NextResponse.json(
        {
          success: false,
          message: "aircraftId is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Find Current Schedule
    // --------------------------------------------------------

    const schedule = await prisma.flightSchedule.findUnique({
      where: {
        id: scheduleId,
      },

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

        bookings: {
          include: {
            passengers: {
              include: {
                seat: true,
              },
            },
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
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // Flight Status Validation
    // --------------------------------------------------------

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
            "Aircraft cannot be changed after boarding has started or the flight has ended.",
          data: {
            currentStatus: schedule.status,
          },
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Same Aircraft Validation
    // --------------------------------------------------------

    if (schedule.aircraftId === aircraftId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected aircraft is already assigned to this flight.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Find New Aircraft
    // --------------------------------------------------------

    const newAircraft = await prisma.aircraft.findUnique({
      where: {
        id: aircraftId,
      },
    });

    if (!newAircraft) {
      return NextResponse.json(
        {
          success: false,
          message: "Aircraft not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // Aircraft Must Be Active
    // --------------------------------------------------------

    if (newAircraft.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only ACTIVE aircraft can be assigned to a flight.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Airline Validation
    // --------------------------------------------------------

    if (newAircraft.airlineId !== schedule.route.airlineId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected aircraft does not belong to this flight's airline.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // Current Seat Information
    // --------------------------------------------------------

    const currentSeatCount = schedule.seats.length;

    const occupiedSeats = schedule.seats.filter(
      (seat) =>
        seat.status === "RESERVED" ||
        seat.status === "BOOKED" ||
        seat.bookingId !== null ||
        seat.passengerId !== null
    );

    const freeSeats = schedule.seats.filter(
      (seat) =>
        seat.status === "AVAILABLE" &&
        seat.bookingId === null &&
        seat.passengerId === null
    );

    // --------------------------------------------------------
    // Capacity Validation
    // --------------------------------------------------------

    if (newAircraft.capacity < occupiedSeats.length) {
      return NextResponse.json(
        {
          success: false,

          message:
            "The selected aircraft does not have enough capacity for the currently assigned passengers.",

          data: {
            newAircraftCapacity: newAircraft.capacity,
            occupiedSeats: occupiedSeats.length,
          },
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // Calculate Seat Adjustment
    // --------------------------------------------------------

    const excessSeats =
      currentSeatCount > newAircraft.capacity
        ? currentSeatCount - newAircraft.capacity
        : 0;

    const missingSeats =
      currentSeatCount < newAircraft.capacity
        ? newAircraft.capacity - currentSeatCount
        : 0;

    // --------------------------------------------------------
    // Make Sure Excess Seats Can Be Safely Removed
    // --------------------------------------------------------

    if (excessSeats > freeSeats.length) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Aircraft cannot be changed safely because there are not enough unassigned seats to reduce the seat inventory.",

          data: {
            currentSeatCount,
            newAircraftCapacity: newAircraft.capacity,
            seatsToRemove: excessSeats,
            removableSeats: freeSeats.length,
          },
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // Select Free Seats To Remove
    // --------------------------------------------------------

    const seatsToRemove =
      excessSeats > 0
        ? [...freeSeats]
            .sort((a, b) =>
              b.seatNumber.localeCompare(
                a.seatNumber,
                undefined,
                {
                  numeric: true,
                  sensitivity: "base",
                }
              )
            )
            .slice(0, excessSeats)
        : [];

    const seatIdsToRemove = seatsToRemove.map(
      (seat) => seat.id
    );

    // --------------------------------------------------------
    // Transaction
    // --------------------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      // Remove safe unused seats when capacity decreases.
      if (seatIdsToRemove.length > 0) {
        await tx.seat.deleteMany({
          where: {
            id: {
              in: seatIdsToRemove,
            },

            scheduleId,

            status: "AVAILABLE",

            bookingId: null,

            passengerId: null,
          },
        });
      }

      // ------------------------------------------------------
      // Change Aircraft
      // ------------------------------------------------------

      await tx.flightSchedule.update({
        where: {
          id: scheduleId,
        },

        data: {
          aircraftId: newAircraft.id,
        },
      });

      // ------------------------------------------------------
      // Recalculate Current Seat Inventory
      // ------------------------------------------------------

      const seatCount = await tx.seat.count({
        where: {
          scheduleId,
        },
      });

      const availableSeatCount = await tx.seat.count({
        where: {
          scheduleId,
          status: "AVAILABLE",
        },
      });

      // ------------------------------------------------------
      // Update Available Seats
      // ------------------------------------------------------

      await tx.flightSchedule.update({
        where: {
          id: scheduleId,
        },

        data: {
          availableSeats: availableSeatCount,
        },
      });

      return {
        seatCount,
        availableSeatCount,
      };
    });

    // --------------------------------------------------------
    // Get Updated Schedule
    // --------------------------------------------------------

    const updatedSchedule =
      await prisma.flightSchedule.findUnique({
        where: {
          id: scheduleId,
        },

        include: {
          aircraft: true,

          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },
        },
      });

    if (!updatedSchedule) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aircraft was changed but the updated schedule could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Aircraft changed successfully.",

        data: {
          reason: reason ?? null,

          scheduleId,

          airline: updatedSchedule.route.airline.name,

          airlineCode:
            updatedSchedule.route.airline.iataCode,

          flightNumber:
            updatedSchedule.route.flightNumber,

          previousAircraft: {
            id: schedule.aircraft.id,

            model: schedule.aircraft.model,

            registration:
              schedule.aircraft.registrationNumber,

            capacity: schedule.aircraft.capacity,
          },

          newAircraft: {
            id: updatedSchedule.aircraft.id,

            model: updatedSchedule.aircraft.model,

            registration:
              updatedSchedule.aircraft.registrationNumber,

            capacity: updatedSchedule.aircraft.capacity,
          },

          seatInventory: {
            before: currentSeatCount,

            after: result.seatCount,

            removed: excessSeats,

            missing: missingSeats,

            available: result.availableSeatCount,

            synchronized:
              result.seatCount ===
              updatedSchedule.aircraft.capacity,
          },

          status: updatedSchedule.status,

          warning:
            missingSeats > 0
              ? `${missingSeats} additional seats must be generated for the new aircraft.`
              : null,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("CHANGE AIRCRAFT ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,

        message: "Unable to change aircraft.",

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