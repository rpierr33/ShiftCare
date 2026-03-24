import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatShiftTime(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

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
  return formatDate(date);
}

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

export function getShiftStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

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
