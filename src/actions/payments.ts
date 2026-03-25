"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";

// ─── Create payment for a completed shift ────────────────────────

export async function createPayment(
  shiftId: string,
  scheduledDate: string,
  notes?: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can create payments." };
  }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { payment: true },
  });

  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (shift.status !== "COMPLETED") {
    return { success: false, error: "Only completed shifts can be paid." };
  }
  if (!shift.assignedWorkerId) {
    return { success: false, error: "No worker assigned to this shift." };
  }
  if (shift.payment) {
    return { success: false, error: "Payment already exists for this shift." };
  }

  const hoursWorked = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
  const totalAmount = hoursWorked * shift.payRate;

  const payment = await db.payment.create({
    data: {
      shiftId: shift.id,
      providerId: user.id,
      workerId: shift.assignedWorkerId,
      hoursWorked,
      hourlyRate: shift.payRate,
      totalAmount,
      status: "SCHEDULED",
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
    },
  });

  return { success: true, data: { id: payment.id } };
}

// ─── Mark payment as paid ────────────────────────────────────────

export async function markPaymentPaid(paymentId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can manage payments." };
  }

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.providerId !== user.id) {
    return { success: false, error: "Payment not found." };
  }
  if (payment.status === "PAID") {
    return { success: false, error: "Payment already marked as paid." };
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  return { success: true };
}

// ─── Get payments for provider ───────────────────────────────────

export async function getProviderPayments() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.payment.findMany({
    where: { providerId: user.id },
    include: {
      shift: { select: { title: true, role: true, location: true, startTime: true, endTime: true } },
      worker: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get completed shifts without payment ────────────────────────

export async function getUnpaidCompletedShifts() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.shift.findMany({
    where: {
      providerId: user.id,
      status: "COMPLETED",
      payment: null,
    },
    include: {
      assignedWorker: { select: { name: true } },
    },
    orderBy: { endTime: "desc" },
  });
}

// ─── Get worker's payments ───────────────────────────────────────

export async function getWorkerPayments() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return [];

  return db.payment.findMany({
    where: { workerId: user.id },
    include: {
      shift: { select: { title: true, role: true, location: true, startTime: true, endTime: true } },
      provider: {
        select: {
          name: true,
          providerProfile: { select: { companyName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
