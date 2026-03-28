import type { WorkerRole } from "@prisma/client";

// Maps each worker role to its required credential types
// Used during onboarding and credential verification to determine what documents a worker must submit
const REQUIRED_CREDENTIALS: Record<string, string[]> = {
  RN: ["LICENSE", "BACKGROUND_CHECK", "CPR"],           // Registered Nurse: state license + BG check + CPR
  LPN: ["LICENSE", "BACKGROUND_CHECK", "CPR"],          // Licensed Practical Nurse: same as RN
  CNA: ["CERTIFICATION", "BACKGROUND_CHECK", "CPR"],    // Certified Nursing Assistant: certification + BG + CPR
  HHA: ["CERTIFICATION", "BACKGROUND_CHECK"],           // Home Health Aide: certification + BG check
  MEDICAL_ASSISTANT: ["CERTIFICATION", "BACKGROUND_CHECK"], // Medical Assistant: certification + BG check
  COMPANION: ["BACKGROUND_CHECK"],                      // Companion/Sitter: BG check only
  OTHER: ["BACKGROUND_CHECK"],                          // Other roles: BG check minimum
};

// Returns the list of required credential types for a given worker role
// Falls back to requiring just a background check for unknown or null roles
export function getRequiredCredentials(role: WorkerRole | null | undefined): string[] {
  if (!role) return ["BACKGROUND_CHECK"];
  return REQUIRED_CREDENTIALS[role] || ["BACKGROUND_CHECK"];
}
