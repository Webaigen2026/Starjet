import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  authorizeBookingAccess,
  requireAuthenticatedUser,
} from "../../../lib/authorization";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   GET BOOKING
========================================================= */

export async function GET(
  _request: Request,
  { params }: RouteProps
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    const booking =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        include: {
          passengers: {
            orderBy: {
              createdAt: "asc",
            },
          },

          schedule: {
            include: {
              aircraft: true,

              route: {
                include: {
                  originAirport: true,
                  destinationAirport: true,
                  airline: true,
                },
              },
            },
          },

          payments: true,
          seats: true,
        },
      });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found",
        },
        {
          status: 404,
        }
      );
    }

    const access = authorizeBookingAccess(auth.user, booking);

    if (!access.authorized) {
      return access.response;
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(
      "Booking fetch failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load booking",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH BOOKING
========================================================= */

export async function PATCH(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth = await requireAuthenticatedUser();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;

    const body = await request.json();

    /* =====================================================
       CHECK BOOKING
    ===================================================== */

    const existingBooking =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        include: {
          passengers: true,
        },
      });

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found",
        },
        {
          status: 404,
        }
      );
    }

    const access = authorizeBookingAccess(auth.user, existingBooking);

    if (!access.authorized) {
      return access.response;
    }

    const isStaff =
      auth.user.role === "ADMIN" || auth.user.role === "STAFF";

    /* =====================================================
       BUILD BOOKING UPDATE

       This preserves your PREVIOUS admin logic:
       status
       paymentStatus

       and adds traveler/contact editing.
    ===================================================== */

    const bookingUpdateData: {
      status?: typeof existingBooking.status;

      paymentStatus?: typeof existingBooking.paymentStatus;

      customerName?: string;

      customerEmail?: string;

      customerPhone?: string | null;
    } = {};

    /* -----------------------------------------------------
       EXISTING ADMIN STATUS LOGIC
    ----------------------------------------------------- */

    if (isStaff && body.status !== undefined) {
      bookingUpdateData.status =
        body.status;
    }

    if (
      isStaff &&
      body.paymentStatus !==
      undefined
    ) {
      bookingUpdateData.paymentStatus =
        body.paymentStatus;
    }

    /* -----------------------------------------------------
       CONTACT EDIT LOGIC
    ----------------------------------------------------- */

    if (
      typeof body.customerName ===
      "string"
    ) {
      const customerName =
        body.customerName.trim();

      if (!customerName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Contact name is required.",
          },
          {
            status: 400,
          }
        );
      }

      bookingUpdateData.customerName =
        customerName;
    }

    if (
      typeof body.customerEmail ===
      "string"
    ) {
      const customerEmail =
        body.customerEmail
          .trim()
          .toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          customerEmail
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enter a valid email address.",
          },
          {
            status: 400,
          }
        );
      }

      bookingUpdateData.customerEmail =
        customerEmail;
    }

    if (
      body.customerPhone !==
      undefined
    ) {
      bookingUpdateData.customerPhone =
        typeof body.customerPhone ===
        "string"
          ? body.customerPhone.trim() ||
            null
          : null;
    }

    /* =====================================================
       UPDATE INSIDE TRANSACTION
    ===================================================== */

    const updatedBooking =
      await prisma.$transaction(
        async (tx) => {
          /* -----------------------------------------------
             UPDATE BOOKING
          ----------------------------------------------- */

          await tx.booking.update({
            where: {
              id,
            },

            data: bookingUpdateData,
          });

          /* -----------------------------------------------
             UPDATE PASSENGERS

             We UPDATE existing passenger records.

             We do NOT delete/recreate them because doing
             that could break Seat.passengerId relations.
          ----------------------------------------------- */

          if (
            Array.isArray(
              body.passengers
            )
          ) {
            if (
              body.passengers.length !==
              existingBooking.passengers
                .length
            ) {
              throw new Error(
                "Traveler count cannot be changed while editing this booking."
              );
            }

            for (
              let index = 0;
              index <
              body.passengers.length;
              index++
            ) {
              const passenger =
                body.passengers[index];

              const passengerId =
                passenger.id;

              if (!passengerId) {
                throw new Error(
                  `Traveler ${
                    index + 1
                  } is missing its passenger ID.`
                );
              }

              const existingPassenger =
                existingBooking.passengers.find(
                  (item) =>
                    item.id ===
                    passengerId
                );

              if (!existingPassenger) {
                throw new Error(
                  `Traveler ${
                    index + 1
                  } does not belong to this booking.`
                );
              }

              const firstName =
                String(
                  passenger.firstName ||
                    ""
                ).trim();

              const lastName =
                String(
                  passenger.lastName ||
                    ""
                ).trim();

              const nationality =
                String(
                  passenger.nationality ||
                    ""
                ).trim();

              const passportCountry =
                String(
                  passenger.passportCountry ||
                    ""
                ).trim();

              const passportNumber =
                String(
                  passenger.passportNumber ||
                    ""
                )
                  .trim()
                  .toUpperCase();

              if (!firstName) {
                throw new Error(
                  `First name is required for traveler ${
                    index + 1
                  }.`
                );
              }

              if (!lastName) {
                throw new Error(
                  `Last name is required for traveler ${
                    index + 1
                  }.`
                );
              }

              if (
                !passenger.dateOfBirth
              ) {
                throw new Error(
                  `Date of birth is required for traveler ${
                    index + 1
                  }.`
                );
              }

              const dateOfBirth =
                new Date(
                  passenger.dateOfBirth
                );

              if (
                Number.isNaN(
                  dateOfBirth.getTime()
                )
              ) {
                throw new Error(
                  `Invalid date of birth for traveler ${
                    index + 1
                  }.`
                );
              }

              const now =
                new Date();

              if (
                dateOfBirth >
                now
              ) {
                throw new Error(
                  `Date of birth cannot be in the future for traveler ${
                    index + 1
                  }.`
                );
              }

              if (!passenger.gender) {
                throw new Error(
                  `Gender is required for traveler ${
                    index + 1
                  }.`
                );
              }

              if (!nationality) {
                throw new Error(
                  `Nationality is required for traveler ${
                    index + 1
                  }.`
                );
              }

              if (
                !/^[A-Z0-9]{5,20}$/.test(
                  passportNumber
                )
              ) {
                throw new Error(
                  `Invalid passport number for traveler ${
                    index + 1
                  }. Use letters and numbers only.`
                );
              }

              if (!passportCountry) {
                throw new Error(
                  `Passport country is required for traveler ${
                    index + 1
                  }.`
                );
              }

              if (
                !passenger.passportExpiry
              ) {
                throw new Error(
                  `Passport expiry date is required for traveler ${
                    index + 1
                  }.`
                );
              }

              const passportExpiry =
                new Date(
                  passenger.passportExpiry
                );

              if (
                Number.isNaN(
                  passportExpiry.getTime()
                )
              ) {
                throw new Error(
                  `Invalid passport expiry date for traveler ${
                    index + 1
                  }.`
                );
              }

              /*
                Compare using UTC midnight so the
                passport doesn't accidentally appear
                expired because of server timezone.
              */

              const today =
                new Date();

              const todayUtc =
                new Date(
                  Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth(),
                    today.getUTCDate()
                  )
                );

              if (
                passportExpiry <=
                todayUtc
              ) {
                throw new Error(
                  `Passport for traveler ${
                    index + 1
                  } must not be expired.`
                );
              }

              await tx.passenger.update({
                where: {
                  id: passengerId,
                },

                data: {
                  firstName,

                  middleName:
                    typeof passenger.middleName ===
                    "string"
                      ? passenger.middleName.trim() ||
                        null
                      : null,

                  lastName,

                  dateOfBirth,

                  gender:
                    String(
                      passenger.gender
                    ),

                  nationality,

                  passportNumber,

                  passportCountry,

                  passportExpiry,
                },
              });
            }
          }

          /* -----------------------------------------------
             RETURN UPDATED BOOKING
          ----------------------------------------------- */

          return tx.booking.findUnique({
            where: {
              id,
            },

            include: {
              passengers: {
                orderBy: {
                  createdAt: "asc",
                },
              },

              schedule: {
                include: {
                  aircraft: true,

                  route: {
                    include: {
                      originAirport: true,

                      destinationAirport:
                        true,

                      airline: true,
                    },
                  },
                },
              },

              payments: true,
              seats: true,
            },
          });
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error(
      "Booking update failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update booking",
      },
      {
        status: 500,
      }
    );
  }
}