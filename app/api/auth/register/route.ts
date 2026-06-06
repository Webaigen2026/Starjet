import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { generateToken, getTokenExpiry } from "../../../lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          password: hashedPassword,
          role: "CUSTOMER",
        },
      });
      
      const token = generateToken();
      
      await prisma.emailVerificationToken.create({
        data: {
          email: user.email,
          token,
          expiresAt: getTokenExpiry(30),
        },
      });
      
      console.log(
        `Verify email: ${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
      );

    return NextResponse.json(
      {
        success: true,
        message: "Customer account created successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}