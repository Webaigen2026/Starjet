import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { expireExpiredDraftsOnSchedules } from "../../../lib/reservationLifecycle";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // =====================================================
    // READ SEARCH PARAMETERS
    // =====================================================

    const originCode = searchParams
      .get("originCode")
      ?.trim()
      .toUpperCase();

    const destinationCode = searchParams
      .get("destinationCode")
      ?.trim()
      .toUpperCase();

    const departureDate =
      searchParams.get("departureDate");

    const passengersCount = Number(
      searchParams.get("passengersCount") || "1"
    );

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !originCode ||
      !destinationCode ||
      !departureDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Origin, destination, and departure date are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(passengersCount) ||
      passengersCount < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passenger count must be at least 1.",
        },
        {
          status: 400,
        }
      );
    }

    if (originCode === destinationCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Origin and destination cannot be the same.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // DATE RANGE
    // Search the selected calendar day in UTC
    // =====================================================

    const startDate = new Date(
      `${departureDate}T00:00:00.000Z`
    );

    const endDate = new Date(
      `${departureDate}T23:59:59.999Z`
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid departure date.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // SEARCH REAL FLIGHT SCHEDULES
    // =====================================================

    const candidateSchedules =
      await prisma.flightSchedule.findMany({
        where: {
          departureTime: {
            gte: startDate,
            lte: endDate,
          },

          status: "SCHEDULED",

          route: {
            isActive: true,

            originAirport: {
              iataCode: originCode,
            },

            destinationAirport: {
              iataCode: destinationCode,
            },

            airline: {
              isActive: true,
            },
          },

          aircraft: {
            status: "ACTIVE",
          },
        },
        select: {
          id: true,
        },
        take: 100,
      });

    await expireExpiredDraftsOnSchedules(
      prisma,
      candidateSchedules.map((schedule) => schedule.id)
    );

    const schedules =
      await prisma.flightSchedule.findMany({
        where: {
          departureTime: {
            gte: startDate,
            lte: endDate,
          },

          availableSeats: {
            gte: passengersCount,
          },

          status: "SCHEDULED",

          route: {
            isActive: true,

            originAirport: {
              iataCode: originCode,
            },

            destinationAirport: {
              iataCode: destinationCode,
            },

            airline: {
              isActive: true,
            },
          },

          aircraft: {
            status: "ACTIVE",
          },
        },

        include: {
          route: {
            include: {
              airline: true,
              originAirport: true,
              destinationAirport: true,
            },
          },

          aircraft: true,
        },

        orderBy: {
          departureTime: "asc",
        },
      });

    // =====================================================
    // TRANSFORM DATABASE DATA FOR FRONTEND
    // =====================================================

    const flights = schedules.map(
      (schedule) => {
        const departure =
          schedule.departureTime;

        const arrival =
          schedule.arrivalTime;

        // -------------------------------------------------
        // DURATION
        // -------------------------------------------------

        let duration: string | null = null;

        if (departure && arrival) {
          const durationMs =
            arrival.getTime() -
            departure.getTime();

          if (durationMs > 0) {
            const totalMinutes =
              Math.floor(
                durationMs / 60000
              );

            const hours = Math.floor(
              totalMinutes / 60
            );

            const minutes =
              totalMinutes % 60;

            if (
              hours > 0 &&
              minutes > 0
            ) {
              duration = `${hours}h ${minutes}m`;
            } else if (hours > 0) {
              duration = `${hours}h`;
            } else {
              duration = `${minutes}m`;
            }
          }
        }

        // -------------------------------------------------
        // AIRCRAFT NAME
        //
        // Your DB currently has:
        // manufacturer = "Boeing"
        // model = "Boeing 737-800"
        //
        // We don't want:
        // "Boeing Boeing 737-800"
        // -------------------------------------------------

        const manufacturer =
          schedule.aircraft.manufacturer?.trim() ||
          "";

        const model =
          schedule.aircraft.model?.trim() ||
          "";

        let aircraftName = model;

        if (
          manufacturer &&
          model &&
          !model
            .toLowerCase()
            .startsWith(
              manufacturer.toLowerCase()
            )
        ) {
          aircraftName =
            `${manufacturer} ${model}`;
        }

        if (!aircraftName) {
          aircraftName =
            manufacturer ||
            "StarJet Aircraft";
        }

        // -------------------------------------------------
        // RETURN FRONTEND FLIGHT OBJECT
        // -------------------------------------------------

        return {
          // FlightSchedule ID.
          // This is what booking creation uses.
          id: schedule.id,

          scheduleId: schedule.id,

          flightCode:
            schedule.route.flightNumber,

          flightNumber:
            schedule.route.flightNumber,

          airlineName:
            schedule.route.airline.name,

          airlineCode:
            schedule.route.airline.iataCode,

          aircraftName,

          aircraftId:
            schedule.aircraft.id,

          aircraftRegistration:
            schedule.aircraft
              .registrationNumber,

          originCode:
            schedule.route.originAirport
              .iataCode,

          originCity:
            schedule.route.originAirport.city,

          originAirport:
            schedule.route.originAirport.name,

          destinationCode:
            schedule.route
              .destinationAirport.iataCode,

          destinationCity:
            schedule.route
              .destinationAirport.city,

          destinationAirport:
            schedule.route
              .destinationAirport.name,

          departureDate:
            schedule.departureTime
              .toISOString()
              .split("T")[0],

          /*
           * Keep these as ISO values.
           * The frontend should format them
           * as 9:00 AM / 12:30 PM.
           */
          departureTime:
            schedule.departureTime.toISOString(),

          arrivalTime:
            schedule.arrivalTime
              ? schedule.arrivalTime.toISOString()
              : null,

          duration,

          /*
           * Keep inventory in the API because
           * the backend needs it for determining
           * whether the requested passenger
           * count is bookable.
           *
           * You do NOT have to display this
           * number on the customer-facing UI.
           */
          seatsAvailable:
            schedule.availableSeats,

          price:
            schedule.baseFare.toString(),

          currency: "USD",

          status: schedule.status,

          departureTerminal:
            schedule.departureTerminal,

          departureGate:
            schedule.departureGate,

          arrivalTerminal:
            schedule.arrivalTerminal,

          arrivalGate:
            schedule.arrivalGate,
        };
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        search: {
          originCode,
          destinationCode,
          departureDate,
          passengersCount,
        },

        count: flights.length,

        data: flights,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "FLIGHT SEARCH ERROR"
    );

    console.error(error);

    console.error(
      "================================"
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to search available flights.",

        error:
          process.env.NODE_ENV ===
          "development"
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