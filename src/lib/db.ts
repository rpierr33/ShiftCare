import { PrismaClient } from "@prisma/client";

// Global reference to prevent multiple PrismaClient instances during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse existing client in development, create new one if needed
// Production always creates a fresh client (no global caching needed with connection pooling)
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log warnings/errors in dev; errors-only in production to reduce noise
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Datasource URL override — append connection pooling params for Vercel serverless
    // Neon requires pgbouncer for serverless environments to prevent connection exhaustion
    datasourceUrl: process.env.DATABASE_URL,
  });

// Cache the client globally in non-production environments to survive hot reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
