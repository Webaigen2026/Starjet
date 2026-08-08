import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "../../../lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        // ==================================================
        // 1. Validate credentials
        // ==================================================

        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = credentials.email
          .trim()
          .toLowerCase();

        // ==================================================
        // 2. Find user
        // ==================================================

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user || !user.password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        // ==================================================
        // 3. Check account lock
        // ==================================================

        if (
          user.lockedUntil &&
          user.lockedUntil > new Date()
        ) {
          throw new Error("ACCOUNT_LOCKED");
        }

        // ==================================================
        // 4. Require verified email
        // ==================================================

        if (!user.emailVerified) {
          throw new Error(
            "EMAIL_NOT_VERIFIED"
          );
        }

        // ==================================================
        // 5. Check password
        // ==================================================

        const isPasswordValid =
          await bcrypt.compare(
            credentials.password,
            user.password
          );

        // ==================================================
        // 6. Failed login
        // ==================================================

        if (!isPasswordValid) {
          const newFailedAttempts =
            user.failedLoginAttempts + 1;

          const shouldLock =
            newFailedAttempts >= 5;

          await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              failedLoginAttempts:
                newFailedAttempts,

              lockedUntil: shouldLock
                ? new Date(
                    Date.now() +
                      15 * 60 * 1000
                  )
                : null,
            },
          });

          if (shouldLock) {
            throw new Error(
              "ACCOUNT_LOCKED"
            );
          }

          throw new Error(
            "INVALID_CREDENTIALS"
          );
        }

        // ==================================================
        // 7. Successful login
        // Reset failed login state
        // ==================================================

        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        // ==================================================
        // 8. Return user to NextAuth
        // ==================================================

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],

  // ========================================================
  // CUSTOM LOGIN PAGE
  // ========================================================

  pages: {
    signIn: "/login",
  },

  // ========================================================
  // JWT SESSION
  // ========================================================

  session: {
    strategy: "jwt",
  },

  // ========================================================
  // CALLBACKS
  // ========================================================

  callbacks: {
    // ------------------------------------------------------
    // Add user ID and role into JWT
    // ------------------------------------------------------

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }

      return token;
    },

    // ------------------------------------------------------
    // Add user ID and role into session
    // ------------------------------------------------------

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id =
          token.id;

        (session.user as any).role =
          token.role;
      }

      return session;
    },
  },

  // ========================================================
  // SECRET
  // ========================================================

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};