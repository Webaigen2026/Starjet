import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params;

    //--------------------------------------------------------
    // Flight Schedule
    //--------------------------------------------------------

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
          where: {
            status: {
              in: [
                "CONFIRMED",
                "CHECKED_IN",
                "TICKETED",
                "BOARDED",
                "COMPLETED",
              ],
            },
          },
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

    //--------------------------------------------------------
    // Seat Statistics
    //--------------------------------------------------------

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

    //--------------------------------------------------------
    // Passenger Statistics
    //--------------------------------------------------------

    const totalBookings = schedule.bookings.length;

    let totalPassengers = 0;
    let checkedInPassengers = 0;
    let boardedPassengers = 0;

    for (const booking of schedule.bookings) {
      totalPassengers += booking.passengers.length;

      if (
        booking.status === "CHECKED_IN" ||
        booking.status === "BOARDED" ||
        booking.status === "COMPLETED"
      ) {
        checkedInPassengers += booking.passengers.length;
      }

      if (
        booking.status === "BOARDED" ||
        booking.status === "COMPLETED"
      ) {
        boardedPassengers += booking.passengers.length;
      }
    }

    //--------------------------------------------------------
    // Passenger List
    //--------------------------------------------------------

    const passengerList = schedule.bookings.flatMap((booking) =>
      booking.passengers.map((passenger) => ({
        bookingCode: booking.bookingCode,

        bookingStatus: booking.status,

        passengerId: passenger.id,

        fullName: `${passenger.firstName} ${passenger.lastName}`,

        nationality: passenger.nationality,

        passportNumber: passenger.passportNumber,

        seatNumber: passenger.seat?.seatNumber ?? null,

        seatClass: passenger.seat?.seatClass ?? null,

        seatStatus: passenger.seat?.status ?? null,
      }))
    );

    //--------------------------------------------------------
    // Response
    //--------------------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        flight: {
          scheduleId: schedule.id,

          airline: schedule.route.airline.name,
          airlineCode: schedule.route.airline.iataCode,

          flightNumber: schedule.route.flightNumber,

          aircraft: schedule.aircraft.model,
          registration: schedule.aircraft.registrationNumber,

          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,

          status: schedule.status,

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
        },

        summary: {
          totalBookings,
          totalPassengers,

          totalSeats,
          availableSeats,
          reservedSeats,
          bookedSeats,

          checkedInPassengers,
          boardedPassengers,

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

        passengers: passengerList,

        report: {
          generatedAt: new Date(),
          reportType: "FLIGHT_MANIFEST",
        },
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("FLIGHT MANIFEST ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate flight manifest.",
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