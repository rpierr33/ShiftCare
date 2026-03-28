import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * Handles incoming Stripe webhook events.
 * Verifies the signature, then dispatches to the appropriate handler.
 * Always returns 200 after signature verification to prevent Stripe retries
 * (errors are logged for investigation).
 */
export async function POST(req: NextRequest) {
  // Read the raw body for signature verification (must be text, not parsed JSON)
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // Reject requests without a Stripe signature header
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  // Verify the webhook signature using the Stripe webhook secret
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    // Signature verification failed — likely a forged or corrupted request
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error(`Stripe webhook error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Dispatch to the appropriate handler based on event type
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Activate subscription after successful checkout
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "invoice.payment_failed": {
        // Mark subscription as past due
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      case "customer.subscription.deleted": {
        // Downgrade to free plan
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      case "account.updated": {
        // Worker Stripe Connect onboarding completed
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      }

      case "payment_intent.payment_failed": {
        // Revert shift assignment on payment failure
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt without processing
        break;
    }
  } catch (err) {
    // Log handler errors but still return 200 to prevent Stripe from retrying
    // (retrying would likely fail again with the same error)
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error(`Stripe webhook handler error for ${event.type}: ${message}`);
  }

  // Always return 200 after successful signature verification
  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── checkout.session.completed ──────────────────────────────────
// Activate agency subscription after successful Stripe Checkout

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Extract required metadata set during checkout session creation
  const agencyId = session.metadata?.agencyId;
  const providerProfileId = session.metadata?.providerProfileId;
  const plan = session.metadata?.plan as "STARTER" | "PROFESSIONAL" | undefined;

  // Bail if metadata is incomplete (should not happen in normal flow)
  if (!agencyId || !providerProfileId || !plan) {
    console.error("checkout.session.completed: Missing metadata", session.metadata);
    return;
  }

  // Update the provider profile with the new subscription plan
  await db.providerProfile.update({
    where: { id: providerProfileId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: "ACTIVE",
    },
  });

  // Extract the Stripe subscription ID (can be string or object)
  const stripeSubscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;

  // Upsert the subscription record — create if new, update if re-subscribing
  await db.subscription.upsert({
    where: { providerProfileId },
    create: {
      providerProfileId,
      plan,
      status: "ACTIVE",
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripeSubscriptionId,
    },
    update: {
      plan,
      status: "ACTIVE",
      stripeSubscriptionId,
    },
  });

  // Notify the agency user about successful activation
  await db.notification.create({
    data: {
      userId: agencyId,
      type: "SUBSCRIPTION_ACTIVATED",
      title: "Subscription Activated",
      body: `Your ${plan} plan is now active. Enjoy your expanded features!`,
    },
  });
}

// ─── invoice.payment_failed ──────────────────────────────────────
// Set subscription to PAST_DUE and notify the provider

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Extract the Stripe customer ID (can be string or object)
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id ?? null;

  if (!customerId) return;

  // Look up the provider profile by their Stripe customer ID
  const profile = await db.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!profile) return;

  // Mark the provider's subscription as past due
  await db.providerProfile.update({
    where: { id: profile.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });

  // Also update the subscription record(s)
  await db.subscription.updateMany({
    where: { providerProfileId: profile.id },
    data: { status: "PAST_DUE" },
  });

  // Notify the provider about the failed payment
  await db.notification.create({
    data: {
      userId: profile.userId,
      type: "PAYMENT_FAILED",
      title: "Payment Failed",
      body: "Your subscription payment failed. Please update your payment method to avoid service interruption.",
    },
  });
}

// ─── customer.subscription.deleted ───────────────────────────────
// Downgrade the provider to the Free plan

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Extract the Stripe customer ID
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;

  if (!customerId) return;

  // Look up the provider profile by Stripe customer ID
  const profile = await db.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!profile) return;

  // Downgrade to FREE plan and mark as cancelled
  await db.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionPlan: "FREE",
      subscriptionStatus: "CANCELLED",
    },
  });

  // Update the subscription record(s)
  await db.subscription.updateMany({
    where: { providerProfileId: profile.id },
    data: {
      plan: "FREE",
      status: "CANCELLED",
    },
  });

  // Notify the provider about the cancellation
  await db.notification.create({
    data: {
      userId: profile.userId,
      type: "SUBSCRIPTION_CANCELLED",
      title: "Subscription Cancelled",
      body: "Your subscription has been cancelled. You are now on the Free plan.",
    },
  });
}

// ─── account.updated ─────────────────────────────────────────────
// Worker Stripe Connect onboarding completed — mark account as active

async function handleAccountUpdated(account: Stripe.Account) {
  // Only process when the account is fully onboarded (charges + payouts enabled)
  if (!account.charges_enabled || !account.payouts_enabled) {
    return;
  }

  // Find the worker profile linked to this Stripe Connect account
  const workerProfile = await db.workerProfile.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (!workerProfile) return;

  // Skip if already marked as active (idempotency)
  if (workerProfile.stripeAccountStatus === "ACTIVE") return;

  // Activate the worker's Stripe account status
  await db.workerProfile.update({
    where: { id: workerProfile.id },
    data: { stripeAccountStatus: "ACTIVE" },
  });

  // Notify the worker that they can now receive payouts
  await db.notification.create({
    data: {
      userId: workerProfile.userId,
      type: "STRIPE_ACCOUNT_ACTIVE",
      title: "Payout Account Ready",
      body: "Your Stripe account is now active. You can receive payments for completed shifts.",
    },
  });
}

// ─── payment_intent.payment_failed ───────────────────────────────
// Revert shift to OPEN and notify agency when a payment fails

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Extract shift and agency IDs from payment intent metadata
  const shiftId = paymentIntent.metadata?.shiftId;
  const agencyId = paymentIntent.metadata?.agencyId;

  if (!shiftId) return;

  // Use a transaction to atomically revert the shift and cancel the assignment
  await db.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) return;

    // Only revert if the shift is still ASSIGNED with this specific payment intent
    // (prevents reverting if the shift was already reassigned or completed)
    if (shift.status === "ASSIGNED" && shift.stripePaymentIntentId === paymentIntent.id) {
      // Reset the shift to OPEN state
      await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: "OPEN",
          assignedWorkerId: null,
          assignedAt: null,
          stripePaymentIntentId: null,
          grossAmount: null,
          platformFeeAmount: null,
          workerPayoutAmount: null,
          paymentStatus: "UNPAID",
          version: { increment: 1 },
        },
      });

      // Cancel the active assignment for this shift
      await tx.assignment.updateMany({
        where: { shiftId, status: "ACCEPTED" },
        data: { status: "CANCELLED" },
      });
    }
  });

  // Notify the agency about the payment failure (outside transaction)
  if (agencyId) {
    await db.notification.create({
      data: {
        userId: agencyId,
        type: "PAYMENT_FAILED",
        title: "Shift Payment Failed",
        body: "Payment for a shift failed. The shift has been reopened. Please update your payment method.",
      },
    });
  }
}
