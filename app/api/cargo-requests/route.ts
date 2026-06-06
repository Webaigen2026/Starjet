import { NextResponse } from "next/server";
import { CargoType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const cargoRequests = await prisma.cargoRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: cargoRequests,
    });
  } catch (error) {
    console.error("Cargo request fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch cargo requests",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.fullName || !body.email || !body.phone || !body.fromCity || !body.toCity || !body.description) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const cargoRequest = await prisma.cargoRequest.create({
      data: {
        requestCode: `CG-${Date.now()}`,

        fullName: body.fullName,
        email: body.email,
        phone: body.phone,

        fromCity: body.fromCity,
        fromAddress: body.fromAddress || null,

        toCity: body.toCity,
        toAddress: body.toAddress || null,

        cargoType: body.cargoType || CargoType.OTHER,
        weight: body.weight ? Number(body.weight) : null,
        dimensions: body.dimensions || null,
        description: body.description,

        estimatedValue: body.estimatedValue
          ? Number(body.estimatedValue)
          : null,

        preferredDate: body.preferredDate
          ? new Date(body.preferredDate)
          : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cargo request created successfully",
        data: cargoRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cargo request creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create cargo request",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.cargoRequest.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All cargo requests deleted successfully",
    });
  } catch (error) {
    console.error("Cargo request delete failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete cargo requests",
      },
      { status: 500 }
    );
  }
}