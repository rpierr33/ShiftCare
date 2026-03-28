import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authConfig: NextAuthConfig = {
  providers: [
    // Google OAuth provider for social login
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Email/password credentials provider
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Validates email/password against the database
      async authorize(credentials) {
        // Reject if either field is missing
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Block inactive accounts and non-existent users
        if (!user || !user.isActive) return null;

        // OAuth-only users have no passwordHash — reject credential login
        if (!user.passwordHash) return null;

        // Compare submitted password against stored bcrypt hash
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        // Return user object that flows into the JWT callback
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
    // Runs on every sign-in attempt — handles OAuth account linking/creation
    async signIn({ user, account }) {
      // For OAuth providers (Google), create or link the user in our DB
      if (account?.provider === "google") {
        const email = user.email;
        // Google must provide an email — reject otherwise
        if (!email) return false;

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Check if this Google account is already linked to the user
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          // Link the Google account if not already linked to any user
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

          // Mark email as verified since Google verifies it
          if (!existingUser.emailVerified) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }

          // Populate user object with DB fields so JWT callback has access
          user.id = existingUser.id;
          (user as Record<string, unknown>).role = existingUser.role;
          (user as Record<string, unknown>).onboardingCompleted = existingUser.onboardingCompleted;
        } else {
          // Create new user without role — they'll pick role in onboarding
          const newUser = await db.user.create({
            data: {
              email,
              name: user.name || "User",
              emailVerified: new Date(),
              onboardingCompleted: false,
              // Create the linked OAuth account in the same operation
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

          // Set user fields for JWT callback
          user.id = newUser.id;
          (user as Record<string, unknown>).role = null;
          (user as Record<string, unknown>).onboardingCompleted = false;
        }
      }
      return true;
    },
    // Encodes user data into the JWT token on sign-in and session updates
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate token from user object
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role ?? null;
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted ?? false;
      }
      // Allow client-side session updates (e.g., after onboarding completion or role selection)
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
    // Decodes JWT token data into the session object for client access
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as SessionUser;
        user.id = token.id as string;
        user.role = (token.role as "PROVIDER" | "WORKER") ?? null;
        user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    // Controls route access — runs on every request via middleware
    // Public routes must match those in middleware.ts
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const pathname = nextUrl.pathname;

      // Public routes — must stay in sync with middleware.ts publicPaths
      const publicPaths = [
        "/", "/login", "/signup", "/pricing", "/for-workers", "/for-families",
        "/resources", "/demo", "/forgot-password", "/reset-password",
        "/terms", "/privacy", "/contact", "/how-it-works", "/about",
      ];
      // Allow public pages, auth API, webhooks, and cron endpoints
      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/cron");

      if (isPublic) return true;

      // Only require auth for known protected route prefixes
      const protectedPrefixes = ["/worker", "/agency", "/admin", "/provider", "/onboarding"];
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

      // Redirect unauthenticated users to login with redirect param for post-login return
      if (!isLoggedIn && isProtected) {
        return Response.redirect(new URL(`/login?redirect=${pathname}&reason=auth`, nextUrl));
      }

      // Unknown routes (not public, not protected) — let Next.js handle (shows 404)
      return true;
    },
  },
  pages: {
    // Use custom login page instead of NextAuth default
    signIn: "/login",
  },
  session: {
    // Use JWT strategy (stateless, no DB session table needed)
    strategy: "jwt",
  },
};

// Local type for the session user shape used in authorized callback
interface SessionUser {
  id: string;
  role: "PROVIDER" | "WORKER" | null;
  onboardingCompleted: boolean;
}
