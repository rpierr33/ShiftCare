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
} from "@prisma/client";

// ─── Plan Limits ─────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: {
    shiftsPerMonth: 3,
    workerUnlocksPerMonth: 2,
    canContactWorkers: false,
    canPrioritizeListings: false,
  },
  STARTER: {
    shiftsPerMonth: 25,
    workerUnlocksPerMonth: 15,
    canContactWorkers: true,
    canPrioritizeListings: false,
  },
  PROFESSIONAL: {
    shiftsPerMonth: Infinity,
    workerUnlocksPerMonth: Infinity,
    canContactWorkers: true,
    canPrioritizeListings: true,
  },
} as const;

export const PLAN_PRICES = {
  FREE: 0,
  STARTER: 49,
  PROFESSIONAL: 149,
} as const;

// ─── Session Types ───────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "PROVIDER" | "WORKER";
  onboardingCompleted: boolean;
}

// ─── API Response Types ──────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
