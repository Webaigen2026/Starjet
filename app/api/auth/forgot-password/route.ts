import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { generateToken, getTokenExpiry } from "../../../lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email exists, a reset link has been generated.",
      });
    }

    const token = generateToken();

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt: getTokenExpiry(30),
      },
    });

    console.log(
      `Reset password: http://localhost:3001/reset-password?token=${token}`
    );

    return NextResponse.json({
      success: true,
      message: "If this email exists, a reset link has been generated.",
    });
  } catch (error) {
    console.error("Forgot password failed:", error);

    return NextResponse.json(
      { success: false, message: "Forgot password failed" },
      { status: 500 }
    );
  }
}