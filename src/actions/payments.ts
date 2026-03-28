"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";

import { calculateShiftPayments } from "@/lib/fees";

/**
 * Calculate platform fee and worker payout for a shift.
 * Derives hourly rate from total amount and hours, then uses the canonical fee calculator.
 * BUG FIX: Now passes actual hours instead of defaulting to 1.
 */
function calculateFees(shiftAmount: number, hours: number) {
  // Derive hourly rate from total amount and hours for the canonical fee calc
  const hourlyRate = hours > 0 ? shiftAmount / hours : shiftAmount;
  const result = calculateShiftPayments(hourlyRate, hours, true); // assume subscribed for legacy path
  return { platformFee: result.workerFee, workerPayout: result.workerPayout };
}

// ---- Add Payment Method (stub for Stripe) ----

/**
 * Add a payment method for the current user.
 * In production: creates a Stripe PaymentMethod. For MVP: stores metadata directly.
 * Sets the new method as default and unsets all others.
 */
export async function addPaymentMethod(input: {
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getSessionUser();

    // Create payment method record (in production: Stripe PaymentMethod pm_xxx)
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

    // Set all other methods as non-default for this user
    await db.paymentMethod.updateMany({
      where: { userId: user.id, id: { not: method.id } },
      data: { isDefault: false },
    });

    return { success: true, data: { id: method.id } };
  } catch (error) {
    console.error("Failed to add payment method:", error);
    return { success: false, error: "Failed to add payment method." };
  }
}

// ---- Get User's Payment Methods ----

/**
 * Retrieve all payment methods for the current user, newest first.
 */
export async function getPaymentMethods() {
  const user = await getSessionUser();
  return db.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

// ---- Get or Create Wallet ----

/**
 * Get the wallet for the current user, creating one if it doesn't exist.
 */
export async function getWallet() {
  const user = await getSessionUser();
  // Try to find existing wallet
  let wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  // Create a new zero-balance wallet if none exists
  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId: user.id, balance: 0, reserved: 0 },
    });
  }
  return wallet;
}

// ---- Fund a Shift (Provider) ----

/**
 * Fund an assigned shift. Provider-only.
 * Verifies ownership, calculates fees, creates payment and transaction records.
 * In production: charges via Stripe PaymentIntent.
 */
export async function fundShift(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  // Only providers can fund shifts
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can fund shifts." };
  }

  // Load the shift with its payment record
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: { shiftPayment: true },
  });

  // Verify shift exists and belongs to this provider
  if (!shift || shift.providerId !== user.id) {
    return { success: false, error: "Shift not found." };
  }
  // Shift must have an assigned worker to fund
  if (!shift.assignedWorkerId) {
    return { success: false, error: "No worker assigned to this shift." };
  }

  // Calculate shift duration in hours and total dollar amount
  const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
  const shiftAmount = Math.round(hours * shift.payRate * 100) / 100;
  // BUG FIX: Pass actual hours to calculateFees instead of relying on default
  const { platformFee, workerPayout } = calculateFees(shiftAmount, hours);

  // Prevent double-funding
  if (shift.shiftPayment?.fundingStatus === "COMPLETED") {
    return { success: false, error: "Shift is already funded." };
  }

  // Require a default payment method on file
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

      // Create or update the shift payment record
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

      // Record the funding transaction for audit trail
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

      // Get or create wallet for the provider (for future balance tracking)
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

// ---- Release Payout to Worker (after shift completion) ----

/**
 * Release the payout to the worker after shift completion. Provider-only.
 * Updates payment status and creates transaction records for payout and platform fee.
 */
export async function releasePayoutToWorker(shiftId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  // Only providers can release payouts
  if (user.role !== "PROVIDER") {
    return { success: false, error: "Only providers can release payouts." };
  }

  // Load shift payment with associated shift data
  const shiftPayment = await db.shiftPayment.findUnique({
    where: { shiftId },
    include: { shift: true },
  });

  // Verify payment exists and belongs to this provider
  if (!shiftPayment || shiftPayment.providerId !== user.id) {
    return { success: false, error: "Shift payment not found." };
  }
  // Must be funded before releasing
  if (shiftPayment.fundingStatus !== "COMPLETED") {
    return { success: false, error: "Shift must be funded before releasing payout." };
  }
  // Prevent double-payout
  if (shiftPayment.payoutStatus === "PAID") {
    return { success: false, error: "Payout already released." };
  }

  await db.$transaction(async (tx) => {
    // Mark payment as available for worker withdrawal
    await tx.shiftPayment.update({
      where: { id: shiftPayment.id },
      data: {
        payoutStatus: "AVAILABLE",
        completedAt: new Date(),
      },
    });

    // Record worker payout transaction
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

    // Record platform fee transaction separately for accounting
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

// ---- Worker: Request Withdrawal ----

/**
 * Worker requests a withdrawal of available earnings. Worker-only.
 * Validates balance, requires bank account, marks shift payments as paid.
 * BUG FIX: Wrapped in transaction to prevent partial state on failure.
 */
export async function requestWithdrawal(amount: number): Promise<ActionResult> {
  const user = await getSessionUser();
  // Only workers can withdraw
  if (user.role !== "WORKER") {
    return { success: false, error: "Only workers can withdraw." };
  }

  // Amount must be positive
  if (amount <= 0) {
    return { success: false, error: "Amount must be positive." };
  }

  // Check available balance against requested amount
  const available = await getWorkerAvailableBalance();
  if (amount > available) {
    return { success: false, error: `Insufficient balance. Available: $${available.toFixed(2)}` };
  }

  // Require a bank account for withdrawals
  const paymentMethod = await db.paymentMethod.findFirst({
    where: { userId: user.id, type: "bank_account" },
  });
  if (!paymentMethod) {
    return { success: false, error: "Add a bank account to withdraw funds." };
  }

  try {
    // BUG FIX: Wrap entire withdrawal in a transaction to prevent partial state
    await db.$transaction(async (tx) => {
      // In production: initiate Stripe payout
      const payout = await tx.payout.create({
        data: {
          workerId: user.id,
          amount,
          status: "PROCESSING",
          paymentMethodId: paymentMethod.id,
        },
      });

      // Mark the oldest AVAILABLE shift payments as paid until amount is covered
      const availablePayments = await tx.shiftPayment.findMany({
        where: { workerId: user.id, payoutStatus: "AVAILABLE" },
        orderBy: { completedAt: "asc" },
      });

      let remaining = amount;
      for (const sp of availablePayments) {
        if (remaining <= 0) break;
        await tx.shiftPayment.update({
          where: { id: sp.id },
          data: { payoutStatus: "PAID", paidOutAt: new Date() },
        });
        remaining -= sp.workerPayout;
      }

      // Mark payout as completed (in production: PROCESSING until Stripe confirms)
      await tx.payout.update({
        where: { id: payout.id },
        data: { status: "PAID", processedAt: new Date() },
      });
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Withdrawal failed.";
    return { success: false, error: msg };
  }
}

// ---- Get Worker Available Balance ----

/**
 * Sum all AVAILABLE (not yet paid out) shift payments for the current worker.
 * Returns 0 for non-workers.
 */
export async function getWorkerAvailableBalance(): Promise<number> {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return 0;

  // Aggregate workerPayout for all AVAILABLE shift payments
  const result = await db.shiftPayment.aggregate({
    where: { workerId: user.id, payoutStatus: "AVAILABLE" },
    _sum: { workerPayout: true },
  });
  // _sum.workerPayout is null when no records match
  return result._sum.workerPayout ?? 0;
}

// ---- Get Worker Earnings Summary ----

/**
 * Build a comprehensive earnings summary for the current worker.
 * Includes pending, available, and paid amounts plus recent payout history.
 */
export async function getWorkerEarnings() {
  const user = await getSessionUser();
  if (user.role !== "WORKER") return null;

  // Fetch all three payout status aggregates plus recent payouts in parallel
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

  // Build summary with null-safe aggregate sums
  return {
    pending: { amount: pending._sum.workerPayout ?? 0, count: pending._count },
    available: { amount: available._sum.workerPayout ?? 0, count: available._count },
    paid: { amount: paid._sum.workerPayout ?? 0, count: paid._count },
    totalEarned: (pending._sum.workerPayout ?? 0) + (available._sum.workerPayout ?? 0) + (paid._sum.workerPayout ?? 0),
    payouts,
  };
}

// ---- Get Provider Transaction History ----

/**
 * Retrieve the 50 most recent transactions for the current provider.
 * Includes linked shift details for context.
 */
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

// ---- Get Provider Shift Payment Statuses ----

/**
 * Get all shift payments for the current provider with shift and worker details.
 */
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

// ---- Get Unfunded Assigned Shifts ----

/**
 * Get all assigned shifts that haven't been funded yet for the current provider.
 * Used to prompt providers to fund shifts before they start.
 */
export async function getUnfundedShifts() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") return [];

  return db.shift.findMany({
    where: {
      providerId: user.id,
      status: "ASSIGNED",
      shiftPayment: null, // No payment record means unfunded
    },
    include: {
      assignedWorker: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });
}
