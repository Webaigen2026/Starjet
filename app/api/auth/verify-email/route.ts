import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: {
        token: body.token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: "Invalid verification token" },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Verification token expired" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        email: verificationToken.email,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    await prisma.emailVerificationToken.delete({
      where: {
        token: body.token,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification failed:", error);

    return NextResponse.json(
      { success: false, message: "Email verification failed" },
      { status: 500 }
    );
  }
}