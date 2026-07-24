import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = (session.user as any).role;

    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const cargoRequest = await prisma.cargoRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cargo request updated successfully",
      data: cargoRequest,
    });
  } catch (error) {
    console.error("Cargo request update failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update cargo request" },
      { status: 500 }
    );
  }
}