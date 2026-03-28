"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

export type MonthlyEarning = {
  month: string;
  earned: number;
  shifts: number;
  hours: number;
};

/**
 * Get completed shifts for the current worker grouped by month (last 6 months).
 * Handles Decimal fields (workerPayoutAmount) via parseFloat conversion.
 * Falls back to estimated payout (payRate * hours * 0.9) when no payment record exists.
 */
export async function getMonthlyEarnings(): Promise<MonthlyEarning[]> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  // Calculate date 6 months ago
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Fetch all completed shifts assigned to this worker in the last 6 months
  const shifts = await db.shift.findMany({
    where: {
      assignedWorkerId: user.id,
      status: "COMPLETED",
      startTime: { gte: sixMonthsAgo },
    },
    select: {
      startTime: true,
      endTime: true,
      payRate: true,
      workerPayoutAmount: true,
      shiftPayment: {
        select: { workerPayout: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Group by month
  const monthMap = new Map<string, { earned: number; shifts: number; hours: number }>();

  // Pre-fill the last 6 months so we always have all months in the chart
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthMap.set(key, { earned: 0, shifts: 0, hours: 0 });
  }

  for (const shift of shifts) {
    const key = new Date(shift.startTime).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const hours =
      (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) /
      (1000 * 60 * 60);

    // Use shiftPayment.workerPayout if available, else workerPayoutAmount, else estimate
    const earned = shift.shiftPayment?.workerPayout
      ? shift.shiftPayment.workerPayout
      : shift.workerPayoutAmount
      ? parseFloat(String(shift.workerPayoutAmount))
      : shift.payRate * hours * 0.9; // 10% fee estimate

    const entry = monthMap.get(key);
    if (entry) {
      entry.earned += earned;
      entry.shifts += 1;
      entry.hours += hours;
    } else {
      monthMap.set(key, { earned, shifts: 1, hours });
    }
  }

  return Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    earned: Math.round(data.earned * 100) / 100,
    shifts: data.shifts,
    hours: Math.round(data.hours * 100) / 100,
  }));
}

/**
 * Generate a CSV export of all completed shifts for the current worker.
 * Includes date, employer, role, location, hours, gross pay, fee, and net pay.
 * Handles Decimal fields (workerPayoutAmount) via parseFloat conversion.
 */
export async function getEarningsCSV(): Promise<string> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return "";

  const shifts = await db.shift.findMany({
    where: {
      assignedWorkerId: user.id,
      status: "COMPLETED",
    },
    select: {
      startTime: true,
      endTime: true,
      role: true,
      location: true,
      payRate: true,
      workerPayoutAmount: true,
      provider: {
        select: { name: true },
      },
      shiftPayment: {
        select: { workerPayout: true, platformFee: true, shiftAmount: true },
      },
    },
    orderBy: { startTime: "desc" },
  });

  const header = "Date,Employer,Role,Location,Hours,Gross Pay,Platform Fee,Net Pay";
  const rows = shifts.map((s) => {
    const hours =
      (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
      (1000 * 60 * 60);
    const roundedHours = Math.round(hours * 100) / 100;

    const gross = s.shiftPayment?.shiftAmount
      ? s.shiftPayment.shiftAmount
      : s.payRate * hours;
    const fee = s.shiftPayment?.platformFee ?? gross * 0.1;
    const net = s.shiftPayment?.workerPayout
      ? s.shiftPayment.workerPayout
      : s.workerPayoutAmount
      ? parseFloat(String(s.workerPayoutAmount))
      : gross - fee;

    const date = new Date(s.startTime).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    // Escape commas in location/employer
    const employer = `"${(s.provider?.name ?? "Unknown").replace(/"/g, '""')}"`;
    const location = `"${s.location.replace(/"/g, '""')}"`;

    return `${date},${employer},${s.role},${location},${roundedHours},${gross.toFixed(2)},${fee.toFixed(2)},${net.toFixed(2)}`;
  });

  return [header, ...rows].join("\n");
}
