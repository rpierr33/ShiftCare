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

export async function sendNotification({ userId, type, title, body, data, channels = ['inapp'] }: NotificationPayload) {
  // Always create in-app notification
  await db.notification.create({
    data: { userId, type, title, body, data: data ? JSON.parse(JSON.stringify(data)) : undefined, read: false }
  });

  const user = await db.user.findUnique({ where: { id: userId }, include: { workerProfile: true } });
  if (!user) return;

  // Email via Resend (ready when RESEND_API_KEY is set)
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

  // SMS via Twilio (ready when TWILIO vars are set)
  // Install twilio: npm install twilio
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

  // Web Push (ready when VAPID keys are set)
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

// Convenience functions for specific notification types
export async function notifyShiftAssigned(shiftId: string, workerId: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { provider: { include: { providerProfile: true } } } });
  if (!shift) return;

  const worker = await db.user.findUnique({ where: { id: workerId } });
  if (!worker) return;

  // Notify worker
  await sendNotification({
    userId: workerId,
    type: 'SHIFT_ACCEPTED',
    title: `Shift Confirmed`,
    body: `Confirmed: ${shift.role} at ${shift.provider.providerProfile?.companyName || shift.provider.name} on ${shift.startTime.toLocaleDateString()}.`,
    channels: ['inapp', 'email', 'push']
  });

  // Notify employer
  await sendNotification({
    userId: shift.providerId,
    type: 'WORKER_ACCEPTED',
    title: `${worker.name} accepted your shift`,
    body: `${worker.name} (${shift.role}) accepted your ${shift.startTime.toLocaleDateString()} shift. Payment has been held.`,
    channels: ['inapp', 'email', 'push']
  });
}

export async function notifyShiftCancelled(shiftId: string, cancelledBy: string) {
  const shift = await db.shift.findUnique({ where: { id: shiftId }, include: { provider: true, assignedWorker: true } });
  if (!shift) return;

  if (cancelledBy === 'WORKER' && shift.assignedWorker) {
    await sendNotification({
      userId: shift.providerId,
      type: 'WORKER_CANCELLED',
      title: `${shift.assignedWorker.name} cancelled`,
      body: `${shift.assignedWorker.name} cancelled the ${shift.startTime.toLocaleDateString()} shift. Your payment has been refunded.`,
      channels: ['inapp', 'sms', 'email', 'push']
    });
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

export async function notifyCredentialApproved(workerId: string) {
  await sendNotification({
    userId: workerId,
    type: 'CREDENTIAL_APPROVED',
    title: 'Credentials Verified',
    body: 'Credentials verified! You can now accept shifts!',
    channels: ['inapp', 'email', 'sms']
  });
}

export async function notifyCredentialRejected(workerId: string, reason: string) {
  await sendNotification({
    userId: workerId,
    type: 'CREDENTIAL_REJECTED',
    title: 'Credential Needs Attention',
    body: `Credential needs attention. Reason: ${reason}. Please re-submit in Profile.`,
    channels: ['inapp', 'email', 'push']
  });
}
