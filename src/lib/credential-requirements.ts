import type { WorkerRole } from "@prisma/client";

// Required credentials by worker role
const REQUIRED_CREDENTIALS: Record<string, string[]> = {
  RN: ["LICENSE", "BACKGROUND_CHECK", "CPR"],
  LPN: ["LICENSE", "BACKGROUND_CHECK", "CPR"],
  CNA: ["CERTIFICATION", "BACKGROUND_CHECK", "CPR"],
  HHA: ["CERTIFICATION", "BACKGROUND_CHECK"],
  MEDICAL_ASSISTANT: ["CERTIFICATION", "BACKGROUND_CHECK"],
  COMPANION: ["BACKGROUND_CHECK"],
  OTHER: ["BACKGROUND_CHECK"],
};

export function getRequiredCredentials(role: WorkerRole | null | undefined): string[] {
  if (!role) return ["BACKGROUND_CHECK"];
  return REQUIRED_CREDENTIALS[role] || ["BACKGROUND_CHECK"];
}
