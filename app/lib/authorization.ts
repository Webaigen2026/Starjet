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