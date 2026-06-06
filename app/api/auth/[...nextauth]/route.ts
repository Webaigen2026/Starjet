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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
      
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
      
        if (!user || !user.password) {
          return null;
        }
      
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED");
        }
      
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
      
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
      
        if (!isPasswordValid) {
          const newFailedAttempts = user.failedLoginAttempts + 1;
      
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              failedLoginAttempts: newFailedAttempts,
              lockedUntil:
                newFailedAttempts >= 5
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : null,
            },
          });
      
          throw new Error("INVALID_CREDENTIALS");
        }
      
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };