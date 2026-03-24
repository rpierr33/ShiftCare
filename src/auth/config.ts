import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.onboardingCompleted = (user as { onboardingCompleted: boolean }).onboardingCompleted;
      }
      // Allow session updates (e.g., after onboarding)
      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as SessionUser;
        user.id = token.id as string;
        user.role = token.role as "PROVIDER" | "WORKER";
        user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const pathname = nextUrl.pathname;

      // Public routes
      const publicPaths = ["/", "/login", "/signup", "/pricing"];
      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith("/api/auth")
      );

      if (isPublic) return true;
      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

interface SessionUser {
  id: string;
  role: "PROVIDER" | "WORKER";
  onboardingCompleted: boolean;
}
