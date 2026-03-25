"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";

// Platform fee rate — 10% default, $2 minimum
const PLATFORM_FEE_RATE = 0.10;
const MIN_PLATFORM_FEE = 2.00;

function calculateFees(shiftAmount: number) {
  const platformFee = Math.max(shiftAmount * PLATFORM_FEE_RATE, MIN_PLATFORM_FEE);
  const workerPayout = shiftAmount - platformFee;
  return { platformFee: Math.round(platformFee * 100) / 100, workerPayout: Math.round(workerPayout * 100) / 100 };
}

// ─── Add Payment Method (stub for Stripe) ────────────────────────

export async function addPaymentMethod(input: {
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();

  // In production: create Stripe PaymentMethod, get pm_xxx ID
  // For MVP: store the metadata directly
  const method = await db.paymentMethod.create({
    data: {
      userId: user.id,
      type: input.type,
      last4: input.last4,
      brand: input.brand,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      bankName: input.bankName,
      isDefault: true,
      isVerified: true, // In production: verify via Stripe
    },
  });

  // Set all other methods as non-default
  await db.paymentMethod.updateMany({
    where: { userId: user.id, id: { not: method.id } },
    data: { isDefault: false },
  });

  return { success: true, data: { id: method.id } };
}

// ─── Get User's Payment Methods ──────────────────────────────────

export async function getPaymentMethods() {
  const user = await getSessionUser();
  return db.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get or Create Wallet ────────────────────────────────────────

export async function getWallet() {
  const user = await getSessionUser();
  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId: user.id, balance: 0, reserved: 0 },
    });
  }
  return wallet;
}

// ─── Fund a Shift (Provider) ─────────────────────────────────────

export async function fundShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can fund shifts." };
  }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { shiftPayment: true },
  });

  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  if (!shift.assignedWorkerId) {
    return { success: false, error: "No worker assigned to this shift." };
  }

  // Calculate amounts
  const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
  const shiftAmount = Math.round(hours * shift.payRate * 100) / 100;
  const { platformFee, workerPayout } = calculateFees(shiftAmount);

  // Check if already funded
  if (shift.shiftPayment?.fundingStatus === "COMPLETED") {
    return { success: false, error: "Shift is already funded." };
  }

  // Check payment method exists
  const paymentMethod = await db.paymentMethod.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!paymentMethod) {
    return { success: false, error: "No payment method on file. Add a payment method first." };
  }

  try {
    await db.$transaction(async (tx) => {
      // In production: charge via Stripe
      // const charge = await stripe.paymentIntents.create({ amount: shiftAmount * 100, ... })

      // Create or update shift payment
      await tx.shiftPayment.upsert({
        where: { shiftId },
        create: {
          shiftId,
          providerId: user.id,
          workerId: shift.assignedWorkerId!,
          shiftAmount,
          platformFee,
          workerPayout,
          fundingStatus: "COMPLETED",
          fundedAt: new Date(),
        },
        update: {
          fundingStatus: "COMPLETED",
          fundedAt: new Date(),
          shiftAmount,
          platformFee,
          workerPayout,
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          type: "SHIFT_FUNDING",
          status: "COMPLETED",
          amount: shiftAmount,
          platformFee,
          netAmount: workerPayout,
          shiftId,
          providerId: user.id,
          workerId: shift.assignedWorkerId,
          paymentMethodId: paymentMethod.id,
          description: `Funding for ${shift.role} shift`,
          processedAt: new Date(),
        },
      });

      // Get or create wallet, reserve the funds
      let wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: user.id } });
      }
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Payment failed.";
    return { success: false, error: msg };
  }
}

// ─── Release Payout to Worker (after shift completion) ───────────

export async function releasePayoutToWorker(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can release payouts." };
  }

  const shiftPayment = await db.shiftPayment.findUnique({
    where: { shiftId },
    include: { shift: true },
  });

  if (!shiftPayment || shiftPayment.providerId !== user.id) {
    return { success: false, error: "Shift payment not found." };
  }
  if (shiftPayment.fundingStatus !== "COMPLETED") {
    return { success: false, error: "Shift must be funded before releasing payout." };
  }
  if (shiftPayment.payoutStatus === "PAID") {
    return { success: false, error: "Payout already released." };
  }

  await db.$transaction(async (tx) => {
    // Update shift payment
    await tx.shiftPayment.update({
      where: { id: shiftPayment.id },
      data: {
        payoutStatus: "AVAILABLE",
        completedAt: new Date(),
      },
    });

    // Record payout transaction
    await tx.transaction.create({
      data: {
        type: "WORKER_PAYOUT",
        status: "COMPLETED",
        amount: shiftPayment.workerPayout,
        platformFee: 0,
        netAmount: shiftPayment.workerPayout,
        shiftId,
        workerId: shiftPayment.workerId,
        providerId: shiftPayment.providerId,
        description: `Payout for ${shiftPayment.shift.role} shift`,
        processedAt: new Date(),
      },
    });

    // Record platform fee transaction
    await tx.transaction.create({
      data: {
        type: "PLATFORM_FEE",
        status: "COMPLETED",
        amount: shiftPayment.platformFee,
        platformFee: shiftPayment.platformFee,
        netAmount: 0,
        shiftId,
        providerId: shiftPayment.providerId,
        description: `Platform fee (10%)`,
        processedAt: new Date(),
      },
    });
  });

  return { success: true };
}

// ─── Worker: Request Withdrawal ──────────────────────────────────

export async function requestWithdrawal(amount: number): Promise<ActionResult> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can withdraw." };
  }

  if (amount <= 0) {
    return { success: false, error: "Amount must be positive." };
  }

  // Calculate available balance
  const available = await getWorkerAvailableBalance();
  if (amount > available) {
    return { success: false, error: `Insufficient balance. Available: $${available.toFixed(2)}` };
  }

  // Check payment method
  const paymentMethod = await db.paymentMethod.findFirst({
    where: { userId: user.id, type: "bank_account" },
  });
  if (!paymentMethod) {
    return { success: false, error: "Add a bank account to withdraw funds." };
  }

  // In production: initiate Stripe payout
  const payout = await db.payout.create({
    data: {
      workerId: user.id,
      amount,
      status: "PROCESSING",
      paymentMethodId: paymentMethod.id,
    },
  });

  // Mark related shift payments as paid
  // For MVP: mark the oldest AVAILABLE shift payments until amount is covered
  const availablePayments = await db.shiftPayment.findMany({
    where: { workerId: user.id, payoutStatus: "AVAILABLE" },
    orderBy: { completedAt: "asc" },
  });

  let remaining = amount;
  for (const sp of availablePayments) {
    if (remaining <= 0) break;
    await db.shiftPayment.update({
      where: { id: sp.id },
      data: { payoutStatus: "PAID", paidOutAt: new Date() },
    });
    remaining -= sp.workerPayout;
  }

  // Record as completed (in production: would be PROCESSING until Stripe confirms)
  await db.payout.update({
    where: { id: payout.id },
    data: { status: "PAID", processedAt: new Date() },
  });

  return { success: true };
}

// ─── Get Worker Available Balance ────────────────────────────────

export async function getWorkerAvailableBalance(): Promise<number> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return 0;

  const result = await db.shiftPayment.aggregate({
    where: { workerId: user.id, payoutStatus: "AVAILABLE" },
    _sum: { workerPayout: true },
  });
  return result._sum.workerPayout ?? 0;
}

// ─── Get Worker Earnings Summary ─────────────────────────────────

export async function getWorkerEarnings() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return null;

  const [pending, available, paid, payouts] = await Promise.all([
    db.shiftPayment.aggregate({
      where: { workerId: user.id, payoutStatus: "PENDING" },
      _sum: { workerPayout: true },
      _count: true,
    }),
    db.shiftPayment.aggregate({
      where: { workerId: user.id, payoutStatus: "AVAILABLE" },
      _sum: { workerPayout: true },
      _count: true,
    }),
    db.shiftPayment.aggregate({
      where: { workerId: user.id, payoutStatus: "PAID" },
      _sum: { workerPayout: true },
      _count: true,
    }),
    db.payout.findMany({
      where: { workerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    pending: { amount: pending._sum.workerPayout ?? 0, count: pending._count },
    available: { amount: available._sum.workerPayout ?? 0, count: available._count },
    paid: { amount: paid._sum.workerPayout ?? 0, count: paid._count },
    totalEarned: (pending._sum.workerPayout ?? 0) + (available._sum.workerPayout ?? 0) + (paid._sum.workerPayout ?? 0),
    payouts,
  };
}

// ─── Get Provider Transaction History ────────────────────────────

export async function getProviderTransactions() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.transaction.findMany({
    where: { providerId: user.id },
    include: {
      shift: { select: { title: true, role: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── Get Provider Shift Payment Statuses ─────────────────────────

export async function getProviderShiftPayments() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.shiftPayment.findMany({
    where: { providerId: user.id },
    include: {
      shift: {
        select: { title: true, role: true, location: true, startTime: true, endTime: true, status: true },
      },
      worker: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get Unfunded Assigned Shifts ────────────────────────────────

export async function getUnfundedShifts() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.shift.findMany({
    where: {
      providerId: user.id,
      status: "ASSIGNED",
      shiftPayment: null,
    },
    include: {
      assignedWorker: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });
}
