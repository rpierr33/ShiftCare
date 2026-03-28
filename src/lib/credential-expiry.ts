"use server";

import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

const ALERT_THRESHOLDS = [60, 30, 14, 7, 0];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function checkWorkerCredentialExpiry(): Promise<{
  alertsSent: number;
  expired: number;
}> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

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
    if (!credential.expiryDate || !credential.workerProfile) continue;

    const daysUntilExpiry = Math.ceil(
      (credential.expiryDate.getTime() - now.getTime()) / MS_PER_DAY
    );

    // Handle expired credentials
    if (daysUntilExpiry <= 0 && credential.status !== "EXPIRED") {
      await db.credential.update({
        where: { id: credential.id },
        data: { status: "EXPIRED" },
      });

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

    // Check each alert threshold
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntilExpiry > threshold) continue;

      try {
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
          update: {},
        });

        // If sentAt matches now, this was newly created
        if (alert.sentAt.getTime() === now.getTime()) {
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
        // Unique constraint violation means alert already exists — skip
      }
    }
  }

  return { alertsSent, expired };
}

export async function checkProviderLicenseExpiry(): Promise<{
  alertsSent: number;
  expired: number;
}> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  const providerProfiles = await db.providerProfile.findMany({
    where: {
      licenseExpiryDate: { not: null },
      providerType: { not: "PRIVATE" },
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

    const sentinelCredentialId = `provider-license-${profile.id}`;

    // Check each alert threshold
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntilExpiry > threshold) continue;

      try {
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

        // If sentAt matches now, this was newly created
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
        // Unique constraint violation means alert already exists — skip
      }
    }

    if (daysUntilExpiry <= 0) expired++;
  }

  return { alertsSent, expired };
}
