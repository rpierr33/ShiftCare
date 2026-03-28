"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";

/**
 * Get shift receipts for the current worker. Worker-only.
 * Returns completed shifts with employer info, time entries, payment details.
 * Handles Decimal fields (grossAmount, platformFeeAmount, workerPayoutAmount)
 * by converting with parseFloat(String(...)).
 */
export async function getShiftReceipts() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  const shifts = await db.shift.findMany({
    where: {
      assignedWorkerId: user.id,
      status: "COMPLETED",
    },
    include: {
      provider: {
        select: {
          name: true,
          providerProfile: {
            select: { companyName: true, city: true, state: true },
          },
        },
      },
      timeEntries: {
        where: { workerId: user.id },
        select: {
          clockInTime: true,
          clockOutTime: true,
          actualHours: true,
        },
      },
      shiftPayment: {
        select: {
          shiftAmount: true,
          platformFee: true,
          workerPayout: true,
          payoutStatus: true,
          completedAt: true,
        },
      },
    },
    orderBy: { completionConfirmedAt: "desc" },
  });

  return shifts.map((s) => ({
    id: s.id,
    role: s.role,
    location: s.location,
    startTime: s.startTime,
    endTime: s.endTime,
    completedAt: s.completionConfirmedAt,
    employer:
      s.provider?.providerProfile?.companyName ||
      s.provider?.name ||
      "Employer",
    employerCity: s.provider?.providerProfile?.city,
    employerState: s.provider?.providerProfile?.state,
    scheduledHours:
      (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60),
    actualHours: s.timeEntries?.[0]?.actualHours || null,
    clockIn: s.timeEntries?.[0]?.clockInTime || null,
    clockOut: s.timeEntries?.[0]?.clockOutTime || null,
    grossPay:
      s.shiftPayment?.shiftAmount ||
      parseFloat(String(s.grossAmount || 0)),
    platformFee:
      s.shiftPayment?.platformFee ||
      parseFloat(String(s.platformFeeAmount || 0)),
    netPay:
      s.shiftPayment?.workerPayout ||
      parseFloat(String(s.workerPayoutAmount || 0)),
    payRate: s.payRate,
    payoutStatus: s.shiftPayment?.payoutStatus || "PENDING",
  }));
}

/** Generate a CSV string from all shift receipts for download. Worker-only. */
export async function getReceiptCSV() {
  const receipts = await getShiftReceipts();
  const header =
    "Date,Employer,Role,Location,Scheduled Hours,Actual Hours,Pay Rate,Gross Pay,Platform Fee,Net Pay,Payout Status";
  const rows = receipts.map((r) => {
    const date = r.completedAt
      ? new Date(r.completedAt).toLocaleDateString()
      : new Date(r.endTime).toLocaleDateString();
    const employer = `"${r.employer.replace(/"/g, '""')}"`;
    const location = `"${r.location.replace(/"/g, '""')}"`;
    return `${date},${employer},${r.role},${location},${r.scheduledHours.toFixed(1)},${r.actualHours?.toFixed(1) || "N/A"},${r.payRate.toFixed(2)},${r.grossPay.toFixed(2)},${r.platformFee.toFixed(2)},${r.netPay.toFixed(2)},${r.payoutStatus}`;
  });
  return [header, ...rows].join("\n");
}
