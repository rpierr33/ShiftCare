// Re-export Prisma enum types for use across the app without importing from @prisma/client directly
export {
  UserRole,
  WorkerRole,
  ShiftStatus,
  AssignmentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  CredentialType,
  CredentialStatus,
  DayOfWeek,
  PaymentStatus,
  StripeAccountStatus,
  ComplianceStatus,
  AgencyType,
} from "@prisma/client";

// ─── Plan Limits ─────────────────────────────────────────────────
// Defines usage limits per subscription tier for server-side enforcement

export const PLAN_LIMITS = {
  FREE: {
    shiftsPerMonth: 3,             // Free providers can post 3 shifts/month
    workerUnlocksPerMonth: 2,      // Free providers can view 2 worker details/month
    canContactWorkers: false,      // Must upgrade to contact workers directly
    canPrioritizeListings: false,  // Must upgrade for priority shift listing
  },
  STARTER: {
    shiftsPerMonth: 25,
    workerUnlocksPerMonth: 15,
    canContactWorkers: true,
    canPrioritizeListings: false,
  },
  PROFESSIONAL: {
    shiftsPerMonth: Infinity,      // Unlimited shift posting
    workerUnlocksPerMonth: Infinity,
    canContactWorkers: true,
    canPrioritizeListings: true,   // Professional-only: shifts appear at top of marketplace
  },
} as const;

// Monthly subscription prices in USD
export const PLAN_PRICES = {
  FREE: 0,
  STARTER: 49,
  PROFESSIONAL: 149,
} as const;

// ─── Session Types ───────────────────────────────────────────────
// Shape of the user object available in server components via auth()
// Must stay in sync with auth/config.ts session callback

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PROVIDER" | "WORKER" | null;  // null = role not yet selected (pre-onboarding)
  onboardingCompleted: boolean;
}

// ─── API Response Types ──────────────────────────────────────────
// Standard wrapper for server action responses

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
