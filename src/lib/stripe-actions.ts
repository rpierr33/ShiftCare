"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { calculateShiftPayments } from "@/lib/fees";

// ─── Create Stripe Customer (Agency/Provider) ────────────────────

export async function createStripeCustomer(agencyId: string) {
  const user = await db.user.findUnique({
    where: { id: agencyId },
    include: { providerProfile: true },
  });

  if (!user || !user.providerProfile) {
    throw new Error("Provider profile not found.");
  }

  if (user.providerProfile.stripeCustomerId) {
    return user.providerProfile.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.providerProfile.companyName || user.name,
    metadata: {
      agencyId: user.id,
      providerProfileId: user.providerProfile.id,
    },
  });

  await db.providerProfile.update({
    where: { userId: agencyId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Create Setup Intent (Collect Payment Method) ────────────────

export async function createSetupIntent(agencyId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile) {
    throw new Error("Provider profile not found.");
  }

  // Ensure Stripe customer exists
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

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: profile.stripeCustomerId,
  });

  // Set as default payment method
  await stripe.customers.update(profile.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // Save to database
  await db.providerProfile.update({
    where: { userId: agencyId },
    data: { defaultPaymentMethodId: paymentMethodId },
  });
}

// ─── Create Worker Connect Account ───────────────────────────────

export async function createWorkerConnectAccount(workerId: string) {
  const user = await db.user.findUnique({
    where: { id: workerId },
    include: { workerProfile: true },
  });

  if (!user || !user.workerProfile) {
    throw new Error("Worker profile not found.");
  }

  if (user.workerProfile.stripeAccountId) {
    // Account already exists — generate a new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: user.workerProfile.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=complete`,
      type: "account_onboarding",
    });
    return accountLink.url;
  }

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

  await db.workerProfile.update({
    where: { userId: workerId },
    data: {
      stripeAccountId: account.id,
      stripeAccountStatus: "PENDING",
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/worker/profile?stripe=complete`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

// ─── Capture Shift Payment ───────────────────────────────────────

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

  const agencyProfile = shift.provider.providerProfile;
  if (!agencyProfile?.stripeCustomerId) {
    throw new Error("Employer has no Stripe customer. Payment method required.");
  }
  if (!agencyProfile.defaultPaymentMethodId) {
    throw new Error("Employer has no payment method on file.");
  }

  const workerProfile = shift.assignedWorker.workerProfile;
  if (!workerProfile.stripeAccountId) {
    throw new Error("Worker has not set up their Stripe account for payouts.");
  }

  // Calculate hours and payment amounts
  // Subscribers pay gross only. Non-subscribers pay gross + 15% surcharge.
  const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
  const payRate = parseFloat(String(shift.payRate));

  // Check if employer has an active paid subscription
  const subscription = await db.subscription.findFirst({
    where: {
      providerProfileId: agencyProfile.id,
      status: "ACTIVE",
      plan: { in: ["STARTER", "PROFESSIONAL"] },
    },
  });
  const isSubscribed = !!subscription;

  const { totalCharge, platformFee, workerPayout } = calculateShiftPayments(payRate, hours, isSubscribed);

  const totalChargeCents = Math.round(totalCharge * 100);
  const platformFeeCents = Math.round(platformFee * 100);

  // Create PaymentIntent — charge employer the totalCharge
  // application_fee_amount = ShiftCare's total cut (deducted before worker transfer)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalChargeCents,
    currency: "usd",
    customer: agencyProfile.stripeCustomerId,
    payment_method: agencyProfile.defaultPaymentMethodId,
    confirm: true,
    off_session: true,
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

  // Update shift with payment details
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
  if (shift.paymentStatus !== "HELD") {
    throw new Error("Payment is not in HELD status. Cannot confirm completion.");
  }
  if (shift.status !== "ASSIGNED" && shift.status !== "IN_PROGRESS") {
    throw new Error("Shift must be ASSIGNED or IN_PROGRESS to complete.");
  }

  const workerProfile = shift.assignedWorker?.workerProfile;
  if (!workerProfile?.stripeAccountId) {
    throw new Error("Worker Stripe account not found.");
  }

  // Calculate actual hours from TimeEntry if available
  const timeEntry = shift.timeEntries?.find((te) => te.workerId === shift.assignedWorkerId);
  const scheduledHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);

  let actualHours = scheduledHours;
  if (timeEntry?.clockOutTime && timeEntry.clockInTime) {
    const rawActual = (new Date(timeEntry.clockOutTime).getTime() - new Date(timeEntry.clockInTime).getTime()) / (1000 * 60 * 60);
    actualHours = Math.min(rawActual, scheduledHours); // Cap at scheduled
  } else if (timeEntry?.clockInTime && !timeEntry.clockOutTime) {
    // Worker clocked in but never clocked out — use shift endTime as fallback
    const fallbackClockOut = shift.endTime;
    const rawActual = (fallbackClockOut.getTime() - new Date(timeEntry.clockInTime).getTime()) / (1000 * 60 * 60);
    actualHours = Math.min(rawActual, scheduledHours);

    // Auto-fill the clock-out
    await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOutTime: fallbackClockOut,
        actualHours: Math.round(rawActual * 100) / 100,
      },
    });
  }

  // Recalculate payout based on actual hours
  const payRate = shift.payRate;
  const originalPayout = parseFloat(String(shift.workerPayoutAmount ?? 0));
  const actualPayout = actualHours * payRate * 0.9; // 10% platform fee
  const workerPayoutAmount = Math.min(originalPayout, Math.round(actualPayout * 100) / 100);
  const workerPayoutCents = Math.round(workerPayoutAmount * 100);

  const transfer = await stripe.transfers.create({
    amount: workerPayoutCents,
    currency: "usd",
    destination: workerProfile.stripeAccountId,
    metadata: {
      shiftId: shift.id,
      workerId: shift.assignedWorkerId!,
    },
  });

  // Update shift and worker stats in a transaction
  await db.$transaction(async (tx) => {
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

    await tx.assignment.updateMany({
      where: { shiftId, status: "ACCEPTED" },
      data: { status: "CONFIRMED" },
    });

    // Increment worker stats
    const currentEarnings = parseFloat(String(workerProfile.totalEarnings));
    await tx.workerProfile.update({
      where: { id: workerProfile.id },
      data: {
        totalEarnings: currentEarnings + workerPayoutAmount,
        shiftsCompleted: { increment: 1 },
      },
    });

    // Set payout status based on pay cadence
    // Same Day Pay: immediately AVAILABLE after confirmation
    // Standard: stays PENDING for 4 hours (cron releases it)
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

  // If payment was held, issue a refund
  if (shift.paymentStatus === "HELD" && shift.stripePaymentIntentId) {
    await stripe.refunds.create({
      payment_intent: shift.stripePaymentIntentId,
    });
    newPaymentStatus = "REFUNDED";
  }

  await db.$transaction(async (tx) => {
    await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "CANCELLED",
        paymentStatus: newPaymentStatus,
        version: { increment: 1 },
      },
    });

    await tx.assignment.updateMany({
      where: {
        shiftId,
        status: { in: ["REQUESTED", "HELD", "ACCEPTED", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    });
  });

  // If worker cancelled within 4 hours of shift start, apply reliability penalty
  if (cancelledBy === "WORKER" && shift.assignedWorkerId) {
    const hoursUntilStart = (shift.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart <= 4) {
      await applyReliabilityPenalty(shift.assignedWorkerId);
    }
  }
}

// ─── Dispute Shift ───────────────────────────────────────────────

export async function disputeShift(shiftId: string, disputeReason: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error("Shift not found.");

  // Payment remains HELD — not released, not refunded until admin resolves
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

export async function createSubscriptionCheckout(agencyId: string, planName: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile) throw new Error("Provider profile not found.");

  // Ensure Stripe customer exists
  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    customerId = await createStripeCustomer(agencyId);
  }

  // Map plan name to Stripe price ID
  const priceMap: Record<string, string | undefined> = {
    STARTER: process.env.STRIPE_STARTER_PRICE_ID,
    PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
  };

  const priceId = priceMap[planName.toUpperCase()];
  if (!priceId) {
    throw new Error(`Invalid plan: ${planName}. Must be STARTER or PROFESSIONAL.`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

export async function createBillingPortalSession(agencyId: string) {
  const profile = await db.providerProfile.findUnique({
    where: { userId: agencyId },
  });

  if (!profile?.stripeCustomerId) {
    throw new Error("No Stripe customer found. Subscribe to a plan first.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${appUrl}/provider/dashboard`,
  });

  return session.url;
}

// ─── Apply Reliability Penalty ───────────────────────────────────

export async function applyReliabilityPenalty(workerId: string) {
  const workerProfile = await db.workerProfile.findUnique({
    where: { userId: workerId },
  });

  if (!workerProfile) return;

  // Count total accepted assignments (completed + cancelled by worker)
  const totalAccepted = await db.assignment.count({
    where: {
      workerProfileId: workerProfile.id,
      status: { in: ["ACCEPTED", "CONFIRMED", "CANCELLED"] },
    },
  });

  const completed = workerProfile.shiftsCompleted;

  // Reliability = (completed / total accepted) * 100
  // If no history, default to 100
  const reliabilityScore = totalAccepted > 0
    ? Math.round((completed / totalAccepted) * 10000) / 100
    : 100;

  await db.workerProfile.update({
    where: { userId: workerId },
    data: { reliabilityScore },
  });
}
