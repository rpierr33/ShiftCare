import webpush from "web-push";
import { db } from "@/lib/db";

// Configure VAPID (only if keys are set)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:push@shiftcare.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    // 410 Gone or 404 means subscription is no longer valid
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {}); // Ignore if already deleted
    }
    // Don't throw - push is non-blocking
    console.error("Push notification failed:", err.statusCode || err.message);
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return; // VAPID not configured, skip
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );
}
