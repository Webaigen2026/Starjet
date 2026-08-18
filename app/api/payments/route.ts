import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "This endpoint is no longer supported. Use POST /api/bookings/[id]/checkout-session.",
    },
    {
      status: 410,
    }
  );
}
