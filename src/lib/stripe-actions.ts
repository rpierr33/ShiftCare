"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { calculateShiftPayments } from "@/lib/fees";

// ─── Create Stripe Customer (Agency/Provider) ────────────────────
// Creates a Stripe customer for the provider if one doesn't exist already

export async function createStripeCustomer(agencyId: string) {
  const user = await db.user.findUnique({
    where: { id: agencyId },
    include: { providerProfile: true },
  });

  if (!user || !user.providerProfile) {
    throw new Error("Provider profile not found.");
  }

  // Return existing customer ID if already created (idempotent)
  if (user.providerProfile.stripeCustomerId) {
    return user.providerProfile.stripeCustomerId;
  }

  // Create Stripe customer with agency metadata for tracking
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.providerProfile.companyName || user.name,
    metadata: {
      agencyId: user.id,
      providerProfileId: user.providerProfile.id,
    },
  });

  // Persist the Stripe customer ID in our database
  await db.providerProfile.update({
    where: { userId: agencyId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Create Setup Intent (Collect Payment Method) ────────────────
// Creates a Stripe SetupIntent to securely collect a payment method for future charges

export async function createSetupIntent(agencyId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile) {
    throw new Error("Provider profile not found.");
  }

  // Ensure Stripe customer exists before creating setup intent
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    customerId = await createStripeCustomer(agencyId);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: {
      agencyId,
      providerProfileId: profile.id,
    },
  });

  return { clientSecret: setupIntent.client_secret };
}

// ─── Save Payment Method ─────────────────────────────────────────
// Attaches a payment method to the Stripe customer and sets it as default

export async function savePaymentMethod(agencyId: string, paymentMethodId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile) {
    throw new Error("Provider profile not found.");
  }

  if (!profile.stripeCustomerId) {
    throw new Error("Stripe customer not created. Complete onboarding first.");
  }

  // Attach the payment method to the Stripe customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: profile.stripeCustomerId,
  });

  // Set as default payment method for future invoices/charges
  await stripe.customers.update(profile.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // Persist the default payment method ID in our database
  await db.providerProfile.update({
    where: { userId: agencyId },
    data: { defaultPaymentMethodId: paymentMethodId },
  });
}

// ─── Create Worker Connect Account ───────────────────────────────
// Creates a Stripe Express Connect account for the worker to receive payouts

export async function createWorkerConnectAccount(workerId: string) {
  const user = await db.user.findUnique({
    where: { id: workerId },
    include: { workerProfile: true },
  });

  if (!user || !user.workerProfile) {
    throw new Error("Worker profile not found.");
  }

  // If account already exists, generate a new onboarding link (for re-entry)
  if (user.workerProfile.stripeAccountId) {
    const accountLink = await stripe.accountLinks.create({
      account: user.workerProfile.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=complete`,
      type: "account_onboarding",
    });
    return accountLink.url;
  }

  // Create new Express account with card_payments and transfers capabilities
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      workerId: user.id,
      workerProfileId: user.workerProfile.id,
    },
  });

  // Save account ID with PENDING status — will be updated via webhook when onboarding completes
  await db.workerProfile.update({
    where: { userId: workerId },
    data: {
      stripeAccountId: account.id,
      stripeAccountStatus: "PENDING",
    },
  });

  // Generate onboarding link for the worker to complete Stripe's identity verification
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=complete`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

// ─── Capture Shift Payment ───────────────────────────────────────
// Charges the employer and sets up a transfer to the worker's Connect account
// Called when a worker accepts a shift — payment is held until completion

export async function captureShiftPayment(shiftId: string) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      provider: {
        include: { providerProfile: true },
      },
      assignedWorker: {
        include: { workerProfile: true },
      },
    },
  });

  if (!shift) throw new Error("Shift not found.");
  if (!shift.assignedWorker?.workerProfile) throw new Error("No assigned worker.");

  // Validate employer has payment setup
  const agencyProfile = shift.provider.providerProfile;
  if (!agencyProfile?.stripeCustomerId) {
    throw new Error("Employer has no Stripe customer. Payment method required.");
  }
  if (!agencyProfile.defaultPaymentMethodId) {
    throw new Error("Employer has no payment method on file.");
  }

  // Validate worker has payout setup
  const workerProfile = shift.assignedWorker.workerProfile;
  if (!workerProfile.stripeAccountId) {
    throw new Error("Worker has not set up their Stripe account for payouts.");
  }

  // Calculate shift duration in hours from timestamps
  const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
  // BUG FIX: Prisma Decimal columns return strings/objects — must parseFloat before math
  const payRate = parseFloat(String(shift.payRate));

  // Check if employer has an active paid subscription to determine fee structure
  // Subscribers pay gross only; non-subscribers pay gross + 15% surcharge
  const subscription = await db.subscription.findFirst({
    where: {
      providerProfileId: agencyProfile.id,
      status: "ACTIVE",
      plan: { in: ["STARTER", "PROFESSIONAL"] },
    },
  });
  const isSubscribed = !!subscription;

  // Calculate all payment amounts using the fee calculator
  const { totalCharge, platformFee, workerPayout } = calculateShiftPayments(payRate, hours, isSubscribed);

  // Convert to cents for Stripe (Stripe uses smallest currency unit)
  const totalChargeCents = Math.round(totalCharge * 100);
  const platformFeeCents = Math.round(platformFee * 100);

  // Create PaymentIntent — charges employer, transfers to worker minus platform fee
  // application_fee_amount = ShiftCare's total cut (worker fee + employer surcharge)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalChargeCents,
    currency: "usd",
    customer: agencyProfile.stripeCustomerId,
    payment_method: agencyProfile.defaultPaymentMethodId,
    confirm: true,
    off_session: true,        // Charge without user present (saved card)
    capture_method: "automatic",
    transfer_data: {
      destination: workerProfile.stripeAccountId,
    },
    application_fee_amount: platformFeeCents,
    metadata: {
      shiftId: shift.id,
      agencyId: shift.providerId,
      workerId: shift.assignedWorkerId!,
      isSubscribed: String(isSubscribed),
    },
  });

  // Persist payment details on the shift record
  await db.shift.update({
    where: { id: shiftId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      grossAmount: totalCharge,
      platformFeeAmount: platformFee,
      workerPayoutAmount: workerPayout,
      paymentStatus: "HELD",
    },
  });

  return paymentIntent.id;
}

// ─── Confirm Shift Completion ────────────────────────────────────
// Releases held payment to the worker after shift completion is confirmed
// Recalculates payout based on actual hours worked (from TimeEntry clock in/out)

export async function confirmShiftCompletion(shiftId: string, confirmedByUserId: string) {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      assignedWorker: {
        include: { workerProfile: true },
      },
      timeEntries: true,
    },
  });

  if (!shift) throw new Error("Shift not found.");
  // Only HELD payments can be released — prevents double-release
  if (shift.paymentStatus !== "HELD") {
    throw new Error("Payment is not in HELD status. Cannot confirm completion.");
  }
  // Only active shifts can be completed
  if (shift.status !== "ASSIGNED" && shift.status !== "IN_PROGRESS") {
    throw new Error("Shift must be ASSIGNED or IN_PROGRESS to complete.");
  }

  const workerProfile = shift.assignedWorker?.workerProfile;
  if (!workerProfile?.stripeAccountId) {
    throw new Error("Worker Stripe account not found.");
  }

  // Find the TimeEntry for the assigned worker to get actual hours
  const timeEntry = shift.timeEntries?.find((te) => te.workerId === shift.assignedWorkerId);
  const scheduledHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);

  let actualHours = scheduledHours;
  if (timeEntry?.clockOutTime && timeEntry.clockInTime) {
    // Worker clocked in and out — use actual time worked, capped at scheduled
    const rawActual = (new Date(timeEntry.clockOutTime).getTime() - new Date(timeEntry.clockInTime).getTime()) / (1000 * 60 * 60);
    actualHours = Math.min(rawActual, scheduledHours);
  } else if (timeEntry?.clockInTime && !timeEntry.clockOutTime) {
    // Worker clocked in but never clocked out — use shift endTime as fallback
    const fallbackClockOut = shift.endTime;
    const rawActual = (fallbackClockOut.getTime() - new Date(timeEntry.clockInTime).getTime()) / (1000 * 60 * 60);
    actualHours = Math.min(rawActual, scheduledHours);

    // Auto-fill the missing clock-out time
    await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOutTime: fallbackClockOut,
        actualHours: Math.round(rawActual * 100) / 100,
      },
    });
  }

  // BUG FIX: parseFloat on Prisma Decimal fields before doing arithmetic
  // shift.payRate and shift.workerPayoutAmount are Prisma Decimal types (return strings)
  const payRate = parseFloat(String(shift.payRate));
  const originalPayout = parseFloat(String(shift.workerPayoutAmount ?? 0));
  // Recalculate based on actual hours with 10% platform fee
  const actualPayout = actualHours * payRate * 0.9;
  // Cap at original payout — worker should never receive more than the held amount
  const workerPayoutAmount = Math.min(originalPayout, Math.round(actualPayout * 100) / 100);
  const workerPayoutCents = Math.round(workerPayoutAmount * 100);

  // Create Stripe transfer to worker's Connect account
  const transfer = await stripe.transfers.create({
    amount: workerPayoutCents,
    currency: "usd",
    destination: workerProfile.stripeAccountId,
    metadata: {
      shiftId: shift.id,
      workerId: shift.assignedWorkerId!,
    },
  });

  // Update shift, assignment, worker stats, and payout status atomically
  await db.$transaction(async (tx) => {
    // Mark shift as completed with payment released
    await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "COMPLETED",
        paymentStatus: "RELEASED",
        stripeTransferId: transfer.id,
        completionConfirmedAt: new Date(),
        completionConfirmedBy: confirmedByUserId,
        version: { increment: 1 },
      },
    });

    // Move assignment from ACCEPTED to CONFIRMED (final state)
    await tx.assignment.updateMany({
      where: { shiftId, status: "ACCEPTED" },
      data: { status: "CONFIRMED" },
    });

    // Increment worker's lifetime earnings and completed shift count
    // BUG FIX: parseFloat on Decimal field before addition
    const currentEarnings = parseFloat(String(workerProfile.totalEarnings));
    await tx.workerProfile.update({
      where: { id: workerProfile.id },
      data: {
        totalEarnings: currentEarnings + workerPayoutAmount,
        shiftsCompleted: { increment: 1 },
      },
    });

    // Set payout timing based on pay cadence preference
    // Same Day Pay: immediately AVAILABLE after confirmation
    // Standard: stays PENDING for 4 hours (cron job releases it)
    const isSameDay = shift.payCadence === "SAME_DAY";
    await tx.shiftPayment.updateMany({
      where: { shiftId },
      data: {
        payoutStatus: isSameDay ? "AVAILABLE" : "PENDING",
        completedAt: new Date(),
      },
    });
  });

  return transfer.id;
}

// ─── Cancel Shift with Refund ────────────────────────────────────
// Cancels a shift, refunds any held payment, and applies reliability penalty if worker cancelled late

export async function cancelShiftWithRefund(shiftId: string, cancelledBy: "WORKER" | "AGENCY") {
  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      assignedWorker: {
        include: { workerProfile: true },
      },
    },
  });

  if (!shift) throw new Error("Shift not found.");

  let newPaymentStatus: "REFUNDED" | "UNPAID" = "UNPAID";

  // If payment was held (charge already captured), issue a full refund via Stripe
  if (shift.paymentStatus === "HELD" && shift.stripePaymentIntentId) {
    await stripe.refunds.create({
      payment_intent: shift.stripePaymentIntentId,
    });
    newPaymentStatus = "REFUNDED";
  }

  // Cancel shift and all active assignments in a single transaction
  await db.$transaction(async (tx) => {
    await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "CANCELLED",
        paymentStatus: newPaymentStatus,
        version: { increment: 1 },
      },
    });

    // Cancel all non-terminal assignments (any that haven't already been rejected/cancelled)
    await tx.assignment.updateMany({
      where: {
        shiftId,
        status: { in: ["REQUESTED", "HELD", "ACCEPTED", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    });
  });

  // If worker cancelled within 4 hours of shift start, apply a reliability penalty
  // This discourages last-minute cancellations that leave providers without coverage
  if (cancelledBy === "WORKER" && shift.assignedWorkerId) {
    const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart <= 4) {
      await applyReliabilityPenalty(shift.assignedWorkerId);
    }
  }
}

// ─── Dispute Shift ───────────────────────────────────────────────
// Marks a shift as disputed — payment remains HELD pending admin resolution

export async function disputeShift(shiftId: string, disputeReason: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error("Shift not found.");

  // Payment stays HELD — not released or refunded until admin resolves the dispute
  await db.shift.update({
    where: { id: shiftId },
    data: {
      status: "DISPUTED",
      disputeReason,
      version: { increment: 1 },
    },
  });
}

// ─── Create Subscription Checkout ────────────────────────────────
// Creates a Stripe Checkout Session for the provider to subscribe to a paid plan

export async function createSubscriptionCheckout(agencyId: string, planName: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile) throw new Error("Provider profile not found.");

  // Ensure Stripe customer exists before creating checkout session
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    customerId = await createStripeCustomer(agencyId);
  }

  // Map internal plan names to Stripe Price IDs from environment variables
  const priceMap: Record<string, string | undefined> = {
    STARTER: process.env.STRIPE_STARTER_PRICE_ID,
    PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
  };

  const priceId = priceMap[planName.toUpperCase()];
  if (!priceId) {
    throw new Error(`Invalid plan: ${planName}. Must be STARTER or PROFESSIONAL.`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Create Stripe Checkout Session for subscription billing
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // Redirect URLs after checkout completion or cancellation
    success_url: `${appUrl}/provider/dashboard?subscription=success`,
    cancel_url: `${appUrl}/provider/dashboard?subscription=cancelled`,
    metadata: {
      agencyId,
      providerProfileId: profile.id,
      plan: planName.toUpperCase(),
    },
  });

  return session.url;
}

// ─── Create Billing Portal Session ───────────────────────────────
// Creates a Stripe Billing Portal session for the provider to manage their subscription

export async function createBillingPortalSession(agencyId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile?.stripeCustomerId) {
    throw new Error("No Stripe customer found. Subscribe to a plan first.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Stripe Billing Portal lets users update payment methods, cancel, etc.
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${appUrl}/provider/dashboard`,
  });

  return session.url;
}

// ─── Apply Reliability Penalty ───────────────────────────────────
// Recalculates a worker's reliability score after a late cancellation
// Score = (completed / total accepted) * 100

export async function applyReliabilityPenalty(workerId: string) {
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: workerId },
  });

  if (!workerProfile) return;

  // Count total assignments that reached accepted state (includes completed and cancelled-by-worker)
  const totalAccepted = await db.assignment.count({
    where: {
      workerProfileId: workerProfile.id,
      status: { in: ["ACCEPTED", "CONFIRMED", "CANCELLED"] },
    },
  });

  const completed = workerProfile.shiftsCompleted;

  // Reliability = (completed / total accepted) * 100
  // Default to 100 for workers with no history
  const reliabilityScore = totalAccepted > 0
    ? Math.round((completed / totalAccepted) * 10000) / 100
    : 100;

  await db.workerProfile.update({
    where: { userId: workerId },
    data: { reliabilityScore },
  });
}
