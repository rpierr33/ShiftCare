import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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

        // User exists but signed up via OAuth (no password)
        if (!user.passwordHash) return null;

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
    async signIn({ user, account }) {
      // For OAuth providers (Google), create or link the user in our DB
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Link the Google account if not already linked
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token as string | undefined,
                access_token: account.access_token as string | undefined,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token as string | undefined,
              },
            });
          }

          // Update emailVerified if not already set
          if (!existingUser.emailVerified) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }

          // Populate user object with DB fields for JWT callback
          user.id = existingUser.id;
          (user as Record<string, unknown>).role = existingUser.role;
          (user as Record<string, unknown>).onboardingCompleted = existingUser.onboardingCompleted;
        } else {
          // Create new user without role or password — they'll pick role in onboarding
          const newUser = await db.user.create({
            data: {
              email,
              name: user.name || "User",
              emailVerified: new Date(),
              onboardingCompleted: false,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token as string | undefined,
                  access_token: account.access_token as string | undefined,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token as string | undefined,
                },
              },
            },
          });

          user.id = newUser.id;
          (user as Record<string, unknown>).role = null;
          (user as Record<string, unknown>).onboardingCompleted = false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role ?? null;
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted ?? false;
      }
      // Allow session updates (e.g., after onboarding or role selection)
      if (trigger === "update" && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as SessionUser;
        user.id = token.id as string;
        user.role = (token.role as "PROVIDER" | "WORKER") ?? null;
        user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const pathname = nextUrl.pathname;

      // Public routes — must match middleware.ts publicPaths
      const publicPaths = [
        "/", "/login", "/signup", "/pricing", "/for-workers", "/for-families",
        "/resources", "/demo", "/forgot-password", "/reset-password",
        "/terms", "/privacy", "/how-it-works",
      ];
      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/cron");

      if (isPublic) return true;

      // Only require auth for known protected routes
      const protectedPrefixes = ["/worker", "/agency", "/admin", "/provider", "/onboarding"];
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

      if (!isLoggedIn && isProtected) {
        return Response.redirect(new URL(`/login?redirect=${pathname}&reason=auth`, nextUrl));
      }

      // Unknown routes: let through (Next.js will show 404)
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
  role: "PROVIDER" | "WORKER" | null;
  onboardingCompleted: boolean;
}
