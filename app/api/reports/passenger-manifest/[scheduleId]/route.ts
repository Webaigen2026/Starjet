import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireOperationsStaff } from "../../../../lib/authorization";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
    }

    const { scheduleId } = await params;

    //--------------------------------------------------------
    // Find Flight Schedule
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
    // Build Passenger Manifest
    //--------------------------------------------------------

    const manifest = [];

    let bookedSeats = 0;

    for (const booking of schedule.bookings) {
      for (const passenger of booking.passengers) {
        if (passenger.seat) {
          bookedSeats++;
        }

        manifest.push({
          bookingId: booking.id,

          bookingCode: booking.bookingCode,

          bookingStatus: booking.status,

          paymentStatus: booking.paymentStatus,

          passengerId: passenger.id,

          firstName: passenger.firstName,

          lastName: passenger.lastName,

          fullName: `${passenger.firstName} ${passenger.lastName}`,

          gender: passenger.gender,

          nationality: passenger.nationality,

          passportNumber: passenger.passportNumber,

          passportCountry: passenger.passportCountry,

          dateOfBirth: passenger.dateOfBirth,

          seat: passenger.seat
            ? {
                seatId: passenger.seat.id,
                seatNumber: passenger.seat.seatNumber,
                seatClass: passenger.seat.seatClass,
                seatStatus: passenger.seat.status,
              }
            : null,
        });
      }
    }

    //--------------------------------------------------------
    // Response
    //--------------------------------------------------------

    return NextResponse.json(
      {
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

            status: schedule.status,

            origin: {
              airport: schedule.route.originAirport.name,
              city: schedule.route.originAirport.city,
              country: schedule.route.originAirport.country,
              code: schedule.route.originAirport.iataCode,
            },

            destination: {
              airport: schedule.route.destinationAirport.name,
              city: schedule.route.destinationAirport.city,
              country: schedule.route.destinationAirport.country,
              code: schedule.route.destinationAirport.iataCode,
            },
          },

          summary: {
            totalBookings: schedule.bookings.length,

            totalPassengers: manifest.length,

            availableSeats: schedule.availableSeats,

            bookedSeats,

            occupancyPercentage:
              bookedSeats === 0
                ? 0
                : Number(
                    (
                      (bookedSeats /
                        (bookedSeats + schedule.availableSeats)) *
                      100
                    ).toFixed(2)
                  ),
          },

          passengers: manifest,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("======================================");
    console.error("PASSENGER MANIFEST ERROR");
    console.error(error);
    console.error("======================================");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate passenger manifest.",
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