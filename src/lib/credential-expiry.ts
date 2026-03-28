"use server";

import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

// Alert thresholds in days before expiry — notifications are sent at each threshold
const ALERT_THRESHOLDS = [60, 30, 14, 7, 0];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Checks all worker credentials for upcoming expiry and sends alerts
// Also automatically marks expired credentials and updates worker profile status
// Called by a cron job on a daily schedule
export async function checkWorkerCredentialExpiry(): Promise<{
  alertsSent: number;
  expired: number;
}> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  // Fetch all non-expired, non-rejected credentials that have an expiry date
  const credentials = await db.credential.findMany({
    where: {
      expiryDate: { not: null },
      status: { notIn: ["EXPIRED", "REJECTED"] },
    },
    include: {
      workerProfile: {
        select: { id: true, userId: true },
      },
    },
  });

  for (const credential of credentials) {
    // Skip credentials without expiry date or orphaned records
    if (!credential.expiryDate || !credential.workerProfile) continue;

    // Calculate days remaining until expiry (negative = already expired)
    const daysUntilExpiry = Math.ceil(
      (credential.expiryDate.getTime() - now.getTime()) / MS_PER_DAY
    );

    // Handle already-expired credentials — mark as EXPIRED and block worker from accepting shifts
    if (daysUntilExpiry <= 0 && credential.status !== "EXPIRED") {
      await db.credential.update({
        where: { id: credential.id },
        data: { status: "EXPIRED" },
      });

      // Update worker profile to reflect expired credential status
      await db.workerProfile.update({
        where: { id: credential.workerProfile.id },
        data: { credentialStatus: "EXPIRED" },
      });

      await sendNotification({
        userId: credential.workerProfile.userId,
        type: "CREDENTIAL_EXPIRED",
        title: "Credential Expired",
        body: `Your ${credential.name} has expired. You cannot accept shifts until renewed.`,
        channels: ["inapp", "push"],
      });

      expired++;
    }

    // Check each alert threshold and send notification if not already sent
    for (const threshold of ALERT_THRESHOLDS) {
      // Skip thresholds that haven't been reached yet
      if (daysUntilExpiry > threshold) continue;

      try {
        // Upsert deduplicates alerts — if the unique constraint already exists, the update is a no-op
        const alert = await db.credentialAlert.upsert({
          where: {
            userId_credentialId_daysBeforeExpiry: {
              userId: credential.workerProfile.userId,
              credentialId: credential.id,
              daysBeforeExpiry: threshold,
            },
          },
          create: {
            userId: credential.workerProfile.userId,
            credentialId: credential.id,
            daysBeforeExpiry: threshold,
            sentAt: now,
          },
          update: {}, // No-op if already exists
        });

        // Check if this was a newly created alert (not a duplicate)
        // Compares sentAt timestamp to detect new vs existing records
        // NOTE: This comparison is fragile if DB round-trips lose millisecond precision
        if (alert.sentAt.getTime() === now.getTime()) {
          // Only send notification for future thresholds (not the 0-day one, which is handled above)
          if (threshold > 0) {
            await sendNotification({
              userId: credential.workerProfile.userId,
              type: "CREDENTIAL_EXPIRING",
              title: "Credential Expiring Soon",
              body: `Your ${credential.name} expires in ${threshold} days. Renew now to keep accepting shifts.`,
              channels: ["inapp", "push"],
            });
          }
          alertsSent++;
        }
      } catch {
        // Unique constraint violation means alert already exists — safe to skip
      }
    }
  }

  return { alertsSent, expired };
}

// Checks provider (agency) license expiry dates and sends alerts
// Similar to worker credential expiry but uses a sentinel credential ID pattern
export async function checkProviderLicenseExpiry(): Promise<{
  alertsSent: number;
  expired: number;
}> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  // Fetch all non-private providers that have a license expiry date
  const providerProfiles = await db.providerProfile.findMany({
    where: {
      licenseExpiryDate: { not: null },
      providerType: { not: "PRIVATE" }, // Private payers don't have agency licenses
    },
    include: {
      user: { select: { id: true } },
    },
  });

  for (const profile of providerProfiles) {
    if (!profile.licenseExpiryDate) continue;

    const daysUntilExpiry = Math.ceil(
      (profile.licenseExpiryDate.getTime() - now.getTime()) / MS_PER_DAY
    );

    // Use a synthetic credential ID for the alert dedup table since providers don't have credential records
    const sentinelCredentialId = `provider-license-${profile.id}`;

    // Check each alert threshold
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntilExpiry > threshold) continue;

      try {
        // Same upsert dedup pattern as worker credentials
        const alert = await db.credentialAlert.upsert({
          where: {
            userId_credentialId_daysBeforeExpiry: {
              userId: profile.user.id,
              credentialId: sentinelCredentialId,
              daysBeforeExpiry: threshold,
            },
          },
          create: {
            userId: profile.user.id,
            credentialId: sentinelCredentialId,
            daysBeforeExpiry: threshold,
            sentAt: now,
          },
          update: {},
        });

        // If newly created, send the appropriate notification
        if (alert.sentAt.getTime() === now.getTime()) {
          const msg = threshold === 0
            ? "Your agency license has expired. You cannot post new shifts until renewed."
            : `Your agency license expires in ${threshold} days. Renew to continue posting shifts.`;

          await sendNotification({
            userId: profile.user.id,
            type: threshold === 0 ? "LICENSE_EXPIRED" : "LICENSE_EXPIRING",
            title: threshold === 0 ? "License Expired" : "License Expiring Soon",
            body: msg,
            channels: ["inapp", "push"],
          });
          alertsSent++;
        }
      } catch {
        // Unique constraint violation means alert already exists — safe to skip
      }
    }

    if (daysUntilExpiry <= 0) expired++;
  }

  return { alertsSent, expired };
}
