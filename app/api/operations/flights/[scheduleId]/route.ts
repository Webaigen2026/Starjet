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

    console.log("========================================");
    console.log("FLIGHT OPERATIONS DETAILS");
    console.log("Schedule ID:", scheduleId);
    console.log("========================================");

    // --------------------------------------------------------
    // Find Flight Schedule
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

        bookings: {
          include: {
            passengers: {
              include: {
                seat: true,
              },
            },
            seats: true,
          },
        },

        seats: true,
      },
    });

    // --------------------------------------------------------
    // Schedule Not Found
    // --------------------------------------------------------

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
    // Active Bookings
    // --------------------------------------------------------

    const activeBookings = schedule.bookings.filter(
      (booking) =>
        booking.status !== "CANCELLED" &&
        booking.status !== "REFUNDED" &&
        booking.status !== "FAILED"
    );

    // --------------------------------------------------------
    // Booking Statistics
    // --------------------------------------------------------

    const draftBookings = activeBookings.filter(
      (booking) => booking.status === "DRAFT"
    );

    const confirmedBookings = activeBookings.filter(
      (booking) => booking.status === "CONFIRMED"
    );

    const checkedInBookings = activeBookings.filter(
      (booking) => booking.status === "CHECKED_IN"
    );

    const boardedBookings = activeBookings.filter(
      (booking) => booking.status === "BOARDED"
    );

    const completedBookings = activeBookings.filter(
      (booking) => booking.status === "COMPLETED"
    );

    // --------------------------------------------------------
    // Passenger Statistics
    // --------------------------------------------------------

    const totalPassengers = activeBookings.reduce(
      (total, booking) => total + booking.passengers.length,
      0
    );

    const checkedInPassengers = checkedInBookings.reduce(
      (total, booking) => total + booking.passengers.length,
      0
    );

    const boardedPassengers = boardedBookings.reduce(
      (total, booking) => total + booking.passengers.length,
      0
    );

    const completedPassengers = completedBookings.reduce(
      (total, booking) => total + booking.passengers.length,
      0
    );

    // --------------------------------------------------------
    // Seat Statistics
    // --------------------------------------------------------

    const availableSeats = schedule.seats.filter(
      (seat) => seat.status === "AVAILABLE"
    ).length;

    const reservedSeats = schedule.seats.filter(
      (seat) => seat.status === "RESERVED"
    ).length;

    const bookedSeats = schedule.seats.filter(
      (seat) => seat.status === "BOOKED"
    ).length;

    const totalSeats = schedule.seats.length;

    const occupiedSeats = reservedSeats + bookedSeats;

    const occupancyPercentage =
      totalSeats === 0
        ? 0
        : Number(
            ((occupiedSeats / totalSeats) * 100).toFixed(2)
          );

    // --------------------------------------------------------
    // Passenger List
    // --------------------------------------------------------

    const passengers = activeBookings.flatMap((booking) =>
      booking.passengers.map((passenger) => ({
        passengerId: passenger.id,

        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        bookingStatus: booking.status,

        firstName: passenger.firstName,
        lastName: passenger.lastName,
        fullName:
          `${passenger.firstName} ${passenger.lastName}`.trim(),

        gender: passenger.gender,
        nationality: passenger.nationality,

        seat: passenger.seat
          ? {
              id: passenger.seat.id,
              seatNumber: passenger.seat.seatNumber,
              seatClass: passenger.seat.seatClass,
              status: passenger.seat.status,
            }
          : null,
      }))
    );

    // --------------------------------------------------------
    // Determine Available Operations
    // --------------------------------------------------------

    const availableOperations = {
      canStartBoarding:
        schedule.status === "SCHEDULED" &&
        checkedInBookings.length > 0,

      canDepart:
        schedule.status === "BOARDING" &&
        boardedBookings.length > 0 &&
        checkedInBookings.length === 0,

      canArrive:
        schedule.status === "DEPARTED",

      canCancel:
        schedule.status === "SCHEDULED" ||
        schedule.status === "DELAYED",

      canDelay:
        schedule.status === "SCHEDULED",

      canReschedule:
        schedule.status === "SCHEDULED" ||
        schedule.status === "DELAYED",

      canChangeAircraft:
        schedule.status === "SCHEDULED" ||
        schedule.status === "DELAYED",

      canChangeGate:
        schedule.status === "SCHEDULED" ||
        schedule.status === "DELAYED" ||
        schedule.status === "BOARDING",
    };

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          flight: {
            scheduleId: schedule.id,

            airline: schedule.route.airline.name,
            airlineCode: schedule.route.airline.iataCode,
            flightNumber: schedule.route.flightNumber,

            status: schedule.status,

            departureTime: schedule.departureTime,
            arrivalTime: schedule.arrivalTime,

            baseFare: schedule.baseFare,
          },

          route: {
            origin: {
              airport: schedule.route.originAirport.name,
              airportCode:
                schedule.route.originAirport.iataCode,
              city: schedule.route.originAirport.city,
              country: schedule.route.originAirport.country,

              terminal: schedule.departureTerminal,
              gate: schedule.departureGate,
            },

            destination: {
              airport:
                schedule.route.destinationAirport.name,
              airportCode:
                schedule.route.destinationAirport.iataCode,
              city:
                schedule.route.destinationAirport.city,
              country:
                schedule.route.destinationAirport.country,

              terminal: schedule.arrivalTerminal,
              gate: schedule.arrivalGate,
            },
          },

          aircraft: {
            id: schedule.aircraft.id,
            manufacturer: schedule.aircraft.manufacturer,
            model: schedule.aircraft.model,
            registration:
              schedule.aircraft.registrationNumber,
            capacity: schedule.aircraft.capacity,
            status: schedule.aircraft.status,
          },

          bookings: {
            total: activeBookings.length,

            draft: draftBookings.length,

            confirmed: confirmedBookings.length,

            checkedIn: checkedInBookings.length,

            boarded: boardedBookings.length,

            completed: completedBookings.length,
          },

          passengers: {
            total: totalPassengers,

            checkedIn: checkedInPassengers,

            boarded: boardedPassengers,

            completed: completedPassengers,
          },

          seats: {
            total: totalSeats,

            available: availableSeats,

            reserved: reservedSeats,

            booked: bookedSeats,

            occupied: occupiedSeats,

            occupancyPercentage,
          },

          passengerList: passengers,

          availableOperations,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("========================================");
    console.error("FLIGHT OPERATIONS DETAILS ERROR");
    console.error(error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load flight operations details.",

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