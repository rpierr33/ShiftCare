import webpush from "web-push";
import { db } from "@/lib/db";

// Configure VAPID credentials for web push notifications
// Only initializes if both public and private VAPID keys are set in environment
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
  url?: string;    // URL to open when notification is clicked
  tag?: string;    // Dedup tag — replaces existing notification with same tag
  data?: Record<string, unknown>;
}

// Sends a web push notification to a single subscription endpoint
// Non-throwing — push failures are logged but never block the caller
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
    // 410 Gone or 404 Not Found means the subscription is no longer valid
    // Clean up the stale subscription from our database
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {}); // Ignore if already deleted
    }
    // Log but don't throw — push is a non-critical notification channel
    console.error("Push notification failed:", err.statusCode || err.message);
  }
}

// Sends a push notification to all of a user's registered devices
// Uses Promise.allSettled to send to all devices even if some fail
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  // Skip entirely if VAPID not configured — prevents runtime errors
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return;
  }

  // Fetch all push subscriptions for this user (one per device/browser)
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  // Send to all devices in parallel, tolerating individual failures
  await Promise.allSettled(
    subscriptions.map((sub) =>
      sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );
}
