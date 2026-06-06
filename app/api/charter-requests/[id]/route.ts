import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await request.json();

    const charterRequest = await prisma.charterRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Charter request updated successfully",
      data: charterRequest,
    });
  } catch (error) {
    console.error("Charter request update failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update charter request" },
      { status: 500 }
    );
  }
}