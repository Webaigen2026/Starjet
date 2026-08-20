import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../api/auth/[...nextauth]/route";

type AllowedRole = "ADMIN" | "STAFF" | "CUSTOMER";

export async function requireRole(
  allowedRoles: AllowedRole[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: AllowedRole;
  };

  if (!user.role || !allowedRoles.includes(user.role)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to perform this operation.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    authorized: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireOperationsStaff() {
  return requireRole(["ADMIN", "STAFF"]);
}

export async function requireAuthenticatedUser() {
  return requireRole(["ADMIN", "STAFF", "CUSTOMER"]);
}

export async function getOptionalAuthUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: AllowedRole;
  };

  if (!user.id || typeof user.id !== "string") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function isStaffRole(
  role: AllowedRole | undefined
): role is "ADMIN" | "STAFF" {
  return role === "ADMIN" || role === "STAFF";
}

export function bookingNotFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Booking not found.",
    },
    {
      status: 404,
    }
  );
}

export function authorizeBookingAccess(
  user: {
    id?: string;
    role?: AllowedRole;
  },
  booking: {
    userId: string | null;
  }
) {
  if (isStaffRole(user.role)) {
    return {
      authorized: true as const,
      via: "staff" as const,
    };
  }

  if (!booking.userId || !user.id || booking.userId !== user.id) {
    return {
      authorized: false as const,
      response: bookingNotFoundResponse(),
      via: "denied" as const,
    };
  }

  return {
    authorized: true as const,
    via: "owner" as const,
  };
}

export async function requireBookingOwnerOrStaff(booking: {
  userId: string | null;
}) {
  const auth = await requireAuthenticatedUser();

  if (!auth.authorized) {
    return auth;
  }

  const access = authorizeBookingAccess(auth.user, booking);

  if (!access.authorized) {
    return {
      authorized: false as const,
      response: access.response,
      via: access.via,
    };
  }

  return {
    authorized: true as const,
    user: auth.user,
    via: access.via,
  };
}