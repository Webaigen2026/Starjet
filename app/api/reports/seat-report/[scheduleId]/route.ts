import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    //-------------------------------------------------------
    // Flight Schedule
    //-------------------------------------------------------

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

        seats: {
          include: {
            passenger: true,
            booking: true,
          },

          orderBy: [
            {
              seatClass: "asc",
            },
            {
              seatNumber: "asc",
            },
          ],
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

    //-------------------------------------------------------
    // Seat Statistics
    //-------------------------------------------------------

    const totalSeats = schedule.seats.length;

    const availableSeats = schedule.seats.filter(
      (seat) => seat.status === "AVAILABLE"
    ).length;

    const reservedSeats = schedule.seats.filter(
      (seat) => seat.status === "RESERVED"
    ).length;

    const bookedSeats = schedule.seats.filter(
      (seat) => seat.status === "BOOKED"
    ).length;

    //-------------------------------------------------------
    // Seat Report
    //-------------------------------------------------------

    const seats = schedule.seats.map((seat) => ({
      seatId: seat.id,

      seatNumber: seat.seatNumber,

      seatClass: seat.seatClass,

      status: seat.status,

      price: seat.price,

      passenger: seat.passenger
        ? {
            id: seat.passenger.id,
            fullName:
              `${seat.passenger.firstName} ${seat.passenger.lastName}`,
            nationality: seat.passenger.nationality,
            passport: seat.passenger.passportNumber,
          }
        : null,

      booking: seat.booking
        ? {
            bookingCode: seat.booking.bookingCode,
            bookingStatus: seat.booking.status,
            paymentStatus: seat.booking.paymentStatus,
          }
        : null,
    }));

    //-------------------------------------------------------
    // Response
    //-------------------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        flight: {
          scheduleId: schedule.id,

          airline: schedule.route.airline.name,

          airlineCode: schedule.route.airline.iataCode,

          flightNumber: schedule.route.flightNumber,

          aircraft: schedule.aircraft.model,

          registration:
            schedule.aircraft.registrationNumber,

          departureTime: schedule.departureTime,

          arrivalTime: schedule.arrivalTime,

          origin: {
            airport: schedule.route.originAirport.name,
            city: schedule.route.originAirport.city,
            code: schedule.route.originAirport.iataCode,
          },

          destination: {
            airport: schedule.route.destinationAirport.name,
            city: schedule.route.destinationAirport.city,
            code: schedule.route.destinationAirport.iataCode,
          },

          status: schedule.status,
        },

        summary: {
          totalSeats,
          availableSeats,
          reservedSeats,
          bookedSeats,

          occupancyPercentage:
            totalSeats === 0
              ? 0
              : Number(
                  (
                    ((reservedSeats + bookedSeats) /
                      totalSeats) *
                    100
                  ).toFixed(2)
                ),
        },

        seats,

        report: {
          generatedAt: new Date(),
          reportType: "SEAT_REPORT",
        },
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("SEAT REPORT ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate seat report.",
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