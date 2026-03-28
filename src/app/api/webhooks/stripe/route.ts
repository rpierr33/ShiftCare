import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error(`Stripe webhook error: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      case "account.updated": {
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      }

      case "payment_intent.payment_failed": {
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error(`Stripe webhook handler error for ${event.type}: ${message}`);
    // Still return 200 to prevent Stripe from retrying — log the error for investigation
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── checkout.session.completed ──────────────────────────────────
// Activate agency subscription after successful checkout

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const agencyId = session.metadata?.agencyId;
  const providerProfileId = session.metadata?.providerProfileId;
  const plan = session.metadata?.plan as "STARTER" | "PROFESSIONAL" | undefined;

  if (!agencyId || !providerProfileId || !plan) {
    console.error("checkout.session.completed: Missing metadata", session.metadata);
    return;
  }

  // Update provider profile
  await db.providerProfile.update({
    where: { id: providerProfileId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: "ACTIVE",
    },
  });

  // Upsert the subscription record
  const stripeSubscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;

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

  // Create notification
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
// Set subscription to PAST_DUE and notify

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id ?? null;

  if (!customerId) return;

  const profile = await db.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!profile) return;

  await db.providerProfile.update({
    where: { id: profile.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });

  await db.subscription.updateMany({
    where: { providerProfileId: profile.id },
    data: { status: "PAST_DUE" },
  });

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
// Downgrade to Free plan

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;

  if (!customerId) return;

  const profile = await db.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!profile) return;

  await db.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionPlan: "FREE",
      subscriptionStatus: "CANCELLED",
    },
  });

  await db.subscription.updateMany({
    where: { providerProfileId: profile.id },
    data: {
      plan: "FREE",
      status: "CANCELLED",
    },
  });

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
// Worker Stripe Connect onboarding completed

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.charges_enabled || !account.payouts_enabled) {
    return;
  }

  const workerProfile = await db.workerProfile.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (!workerProfile) return;

  // Only update if not already active
  if (workerProfile.stripeAccountStatus === "ACTIVE") return;

  await db.workerProfile.update({
    where: { id: workerProfile.id },
    data: { stripeAccountStatus: "ACTIVE" },
  });

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
// Revert shift to OPEN and notify agency

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const shiftId = paymentIntent.metadata?.shiftId;
  const agencyId = paymentIntent.metadata?.agencyId;

  if (!shiftId) return;

  // Revert the shift back to OPEN
  await db.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) return;

    // Only revert if the shift is still in ASSIGNED state with this payment intent
    if (shift.status === "ASSIGNED" && shift.stripePaymentIntentId === paymentIntent.id) {
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

      // Cancel the assignment
      await tx.assignment.updateMany({
        where: { shiftId, status: "ACCEPTED" },
        data: { status: "CANCELLED" },
      });
    }
  });

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
