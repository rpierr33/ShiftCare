"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import type { ActionResult } from "@/types";

/** Get the count of unread notifications for the current user. */
export async function getUnreadCount(): Promise<number> {
  const user = await getSessionUser();
  return db.notification.count({
    where: { userId: user.id, read: false },
  });
}

/** Get the 100 most recent notifications for the current user. */
export async function getNotifications() {
  const user = await getSessionUser();
  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Mark a single notification as read. Uses updateMany with userId filter for ownership check. */
export async function markAsRead(notificationId: string): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    await db.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification." };
  }
}

/** Mark all unread notifications as read for the current user. */
export async function markAllRead(): Promise<ActionResult> {
  try {
    const user = await getSessionUser();
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Failed to update notifications." };
  }
}
