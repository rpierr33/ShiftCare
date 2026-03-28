"use server";

import { db } from "@/lib/db";

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels?: ('inapp' | 'email' | 'sms' | 'push')[];
}

// Central notification dispatcher — creates in-app notification and optionally sends via email, SMS, and push
export async function sendNotification({ userId, type, title, body, data, channels = ['inapp'] }: NotificationPayload) {
  // Always create an in-app notification record regardless of other channels
  await db.notification.create({
    data: { userId, type, title, body, data: data ? JSON.parse(JSON.stringify(data)) : undefined, read: false }
  });

  // Fetch user to get email/phone for external channels
  const user = await db.user.findUnique({ where: { id: userId }, include: { workerProfile: true } });
  if (!user) return;

  // Email via Resend — only fires when RESEND_API_KEY env var is configured
  if (channels.includes('email') && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'ShiftCare <no-reply@shiftcare.com>',
        to: user.email,
        subject: title,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">${title}</h2>
          <p>${body}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">ShiftCare — Healthcare Staffing Platform</p>
        </div>`
      });
    } catch (e) { console.error('Email send failed:', e); }
  }

  // SMS via Twilio — only fires when TWILIO_ACCOUNT_SID is set AND user has a phone number
  if (channels.includes('sms') && process.env.TWILIO_ACCOUNT_SID && user.phone) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER!,
        to: user.phone,
        body: `ShiftCare: ${body}`
      });
    } catch (e) { console.error('SMS send failed:', e); }
  }

  // Web Push via VAPID — only fires when VAPID keys are configured
  if (channels.includes('push')) {
    try {
      const { sendPushToUser } = await import('@/lib/web-push');
      await sendPushToUser(userId, {
        title,
        body,
        url: data?.url as string | undefined,
        data: data as Record<string, unknown> | undefined,
      });
    } catch (e) { console.error('Push send failed:', e); }
  }
}

// ─── Convenience notification functions for specific business events ────────

// Notifies both the worker (confirmation) and the provider (acceptance) when a shift is assigned
export async function notifyShiftAssigned(shiftId: string, workerId: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { provider: { include: { providerProfile: true } } } });
  if (!shift) return;

  const worker = await db.user.findUnique({ where: { id: workerId } });
  if (!worker) return;

  // Notify worker that their shift is confirmed
  await sendNotification({
    userId: workerId,
    type: 'SHIFT_ACCEPTED',
    title: `Shift Confirmed`,
    body: `Confirmed: ${shift.role} at ${shift.provider.providerProfile?.companyName || shift.provider.name} on ${shift.startTime.toLocaleDateString()}.`,
    channels: ['inapp', 'email', 'push']
  });

  // Notify employer that a worker accepted their posted shift
  await sendNotification({
    userId: shift.providerId,
    type: 'WORKER_ACCEPTED',
    title: `${worker.name} accepted your shift`,
    body: `${worker.name} (${shift.role}) accepted your ${shift.startTime.toLocaleDateString()} shift. Payment has been held.`,
    channels: ['inapp', 'email', 'push']
  });
}

// Notifies the affected party when a shift is cancelled (worker or provider, depending on who cancelled)
export async function notifyShiftCancelled(shiftId: string, cancelledBy: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { provider: true, assignedWorker: true } });
  if (!shift) return;

  // Worker cancelled — notify the provider
  if (cancelledBy === 'WORKER' && shift.assignedWorker) {
    await sendNotification({
      userId: shift.providerId,
      type: 'WORKER_CANCELLED',
      title: `${shift.assignedWorker.name} cancelled`,
      body: `${shift.assignedWorker.name} cancelled the ${shift.startTime.toLocaleDateString()} shift. Your payment has been refunded.`,
      channels: ['inapp', 'sms', 'email', 'push']
    });
  // Agency cancelled — notify the assigned worker
  } else if (cancelledBy === 'AGENCY' && shift.assignedWorkerId) {
    await sendNotification({
      userId: shift.assignedWorkerId,
      type: 'AGENCY_CANCELLED',
      title: `${shift.provider.name} cancelled your shift`,
      body: `${shift.provider.name} cancelled your ${shift.startTime.toLocaleDateString()} shift. Full refund issued, no penalty.`,
      channels: ['inapp', 'sms', 'email', 'push']
    });
  }
}

// Notifies worker when their payment for a completed shift has been released
export async function notifyWorkerPaid(workerId: string, amount: number, shiftId: string) {
  await sendNotification({
    userId: workerId,
    type: 'PAYMENT_RELEASED',
    title: 'Payment Released',
    body: `$${amount.toFixed(2)} released to your bank for your completed shift.`,
    data: { shiftId, amount },
    channels: ['inapp', 'email', 'push']
  });
}

// Notifies the assigned worker when a dispute is filed on their completed shift
export async function notifyDispute(shiftId: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { provider: true, assignedWorker: true } });
  if (!shift) return;

  if (shift.assignedWorkerId) {
    await sendNotification({
      userId: shift.assignedWorkerId,
      type: 'DISPUTE_FILED',
      title: 'Dispute Filed',
      body: `A dispute was filed for your ${shift.startTime.toLocaleDateString()} shift. Payment on hold pending review.`,
      channels: ['inapp', 'email', 'push']
    });
  }
}

// Notifies worker that their credentials have been verified — they can now accept shifts
export async function notifyCredentialApproved(workerId: string) {
  await sendNotification({
    userId: workerId,
    type: 'CREDENTIAL_APPROVED',
    title: 'Credentials Verified',
    body: 'Credentials verified! You can now accept shifts!',
    channels: ['inapp', 'email', 'sms']
  });
}

// Notifies worker that a credential was rejected with the reason, prompting re-submission
export async function notifyCredentialRejected(workerId: string, reason: string) {
  await sendNotification({
    userId: workerId,
    type: 'CREDENTIAL_REJECTED',
    title: 'Credential Needs Attention',
    body: `Credential needs attention. Reason: ${reason}. Please re-submit in Profile.`,
    channels: ['inapp', 'email', 'push']
  });
}
