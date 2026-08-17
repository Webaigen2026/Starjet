import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireOperationsStaff } from "../../../lib/authorization";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const auth = await requireOperationsStaff();

    if (!auth.authorized) {
      return auth.response;
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