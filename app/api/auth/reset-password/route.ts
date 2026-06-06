import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token: body.token,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reset token",
        },
        {
          status: 400,
        }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset token expired",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    await prisma.user.update({
        where: {
          email: resetToken.email,
        },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

    await prisma.passwordResetToken.delete({
      where: {
        id: resetToken.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Password reset failed",
      },
      {
        status: 500,
      }
    );
  }
}