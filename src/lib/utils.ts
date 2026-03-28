import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind CSS classes with conflict resolution (e.g., "p-2 p-4" -> "p-4")
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a number as US currency (e.g., 1234.5 -> "$1,234.50")
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Formats a date as "Jan 1, 2026" style
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

// Formats a date's time component as "3:00 PM" style
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

// Formats a shift's time range as "3:00 PM – 11:00 PM"
export function formatShiftTime(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

// Returns a human-readable relative time string (e.g., "In 3h", "Tomorrow", "In 5 days")
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours === 0) return "Now";
  if (diffHours > 0 && diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  // Beyond a week, fall back to formatted date
  return formatDate(date);
}

// Maps worker role enum values to human-readable display labels
export function getWorkerRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    RN: "Registered Nurse",
    LPN: "Licensed Practical Nurse",
    CNA: "Certified Nursing Assistant",
    HHA: "Home Health Aide",
    MEDICAL_ASSISTANT: "Medical Assistant",
    COMPANION: "Companion/Sitter",
    OTHER: "Other",
  };
  return labels[role] || role;
}

// Maps shift status enum to Tailwind color classes for status badges
export function getShiftStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    DISPUTED: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Maps assignment status enum to Tailwind color classes for status badges
export function getAssignmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REQUESTED: "bg-yellow-100 text-yellow-800",
    HELD: "bg-orange-100 text-orange-800",
    ACCEPTED: "bg-green-100 text-green-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
