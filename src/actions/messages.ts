"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";

export async function getMessages(shiftId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    select: { providerId: true, assignedWorkerId: true },
  });

  if (!shift) return [];
  if (shift.providerId !== userId && shift.assignedWorkerId !== userId) return [];

  const messages = await db.shiftMessage.findMany({
    where: { shiftId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return messages;
}

export async function sendMessage(
  shiftId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;
  const trimmed = content.trim();

  if (!trimmed) {
    return { success: false, error: "Message cannot be empty" };
  }

  if (trimmed.length > 1000) {
    return { success: false, error: "Message must be under 1000 characters" };
  }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    select: { providerId: true, assignedWorkerId: true, status: true },
  });

  if (!shift) {
    return { success: false, error: "Shift not found" };
  }

  if (shift.providerId !== userId && shift.assignedWorkerId !== userId) {
    return { success: false, error: "Unauthorized" };
  }

  const allowedStatuses = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];
  if (!allowedStatuses.includes(shift.status)) {
    return { success: false, error: "Messaging is not available for this shift status" };
  }

  await db.shiftMessage.create({
    data: {
      shiftId,
      senderId: userId,
      content: trimmed,
    },
  });

  // Notify the other party
  const recipientId =
    userId === shift.providerId ? shift.assignedWorkerId : shift.providerId;

  if (recipientId) {
    await sendNotification({
      userId: recipientId,
      type: "SHIFT_MESSAGE",
      title: "New Message",
      body: trimmed.length > 100 ? trimmed.slice(0, 100) + "..." : trimmed,
      data: { shiftId },
    });
  }

  revalidatePath(`/worker/shifts/${shiftId}`);
  revalidatePath(`/agency/shifts/${shiftId}`);

  return { success: true };
}
