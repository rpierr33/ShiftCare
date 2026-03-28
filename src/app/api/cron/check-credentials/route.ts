import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

const ALERT_THRESHOLDS = [60, 30, 14, 7, 0];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerResult = await checkWorkerCredentials();
  const providerResult = await checkProviderLicenses();

  return NextResponse.json({
    workers: workerResult,
    providers: providerResult,
    timestamp: new Date().toISOString(),
  });
}

async function checkWorkerCredentials(): Promise<{ alertsSent: number; expired: number }> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  // Check individual Credential records
  const credentials = await db.credential.findMany({
    where: {
      expiryDate: { not: null },
      status: { notIn: ["EXPIRED", "REJECTED"] },
    },
    include: {
      workerProfile: { select: { id: true, userId: true } },
    },
  });

  for (const cred of credentials) {
    if (!cred.expiryDate) continue;
    const daysUntil = Math.ceil((cred.expiryDate.getTime() - now.getTime()) / MS_PER_DAY);

    // Auto-expire
    if (daysUntil <= 0 && cred.status !== "EXPIRED") {
      await db.credential.update({
        where: { id: cred.id },
        data: { status: "EXPIRED" },
      });

      // Also update the worker profile credential status
      await db.workerProfile.update({
        where: { id: cred.workerProfileId },
        data: { credentialStatus: "EXPIRED" },
      });

      expired++;
    }

    // Send alerts at each threshold
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntil <= threshold) {
        try {
          await db.credentialAlert.create({
            data: {
              userId: cred.workerProfile.userId,
              credentialId: cred.id,
              daysBeforeExpiry: threshold,
            },
          });

          // Alert was created (not duplicate) — send notification
          const message = threshold === 0
            ? `Your ${cred.name} has expired. You cannot accept shifts until renewed.`
            : `Your ${cred.name} expires in ${daysUntil} days. Renew now to keep accepting shifts.`;

          await sendNotification({
            userId: cred.workerProfile.userId,
            type: threshold === 0 ? "CREDENTIAL_EXPIRED" : "CREDENTIAL_EXPIRING",
            title: threshold === 0 ? "Credential Expired" : "Credential Expiring Soon",
            body: message,
            channels: ["inapp", "push"],
          });

          alertsSent++;
        } catch {
          // Unique constraint violation = already sent this alert, skip
        }
      }
    }
  }

  // Also check workerProfile-level credentialExpiryDate
  const profiles = await db.workerProfile.findMany({
    where: {
      credentialExpiryDate: { not: null },
      credentialStatus: { notIn: ["EXPIRED", "REJECTED", "PENDING"] },
    },
  });

  for (const profile of profiles) {
    if (!profile.credentialExpiryDate) continue;
    const daysUntil = Math.ceil((profile.credentialExpiryDate.getTime() - now.getTime()) / MS_PER_DAY);

    if (daysUntil <= 0 && profile.credentialStatus !== "EXPIRED") {
      await db.workerProfile.update({
        where: { id: profile.id },
        data: { credentialStatus: "EXPIRED" },
      });
      expired++;
    }

    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntil <= threshold) {
        try {
          await db.credentialAlert.create({
            data: {
              userId: profile.userId,
              credentialId: `profile-${profile.id}`,
              daysBeforeExpiry: threshold,
            },
          });

          const message = threshold === 0
            ? "Your credentials have expired. You cannot accept shifts until renewed."
            : `Your credentials expire in ${daysUntil} days. Update your profile to maintain shift access.`;

          await sendNotification({
            userId: profile.userId,
            type: threshold === 0 ? "CREDENTIAL_EXPIRED" : "CREDENTIAL_EXPIRING",
            title: threshold === 0 ? "Credentials Expired" : "Credentials Expiring Soon",
            body: message,
            channels: ["inapp", "push"],
          });

          alertsSent++;
        } catch {
          // Already sent
        }
      }
    }
  }

  return { alertsSent, expired };
}

async function checkProviderLicenses(): Promise<{ alertsSent: number; expired: number }> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  const providers = await db.providerProfile.findMany({
    where: {
      licenseExpiryDate: { not: null },
      providerType: "AGENCY", // Private employers don't have license requirements
    },
  });

  for (const provider of providers) {
    if (!provider.licenseExpiryDate) continue;
    const daysUntil = Math.ceil((provider.licenseExpiryDate.getTime() - now.getTime()) / MS_PER_DAY);

    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntil <= threshold) {
        try {
          await db.credentialAlert.create({
            data: {
              userId: provider.userId,
              credentialId: `provider-license-${provider.id}`,
              daysBeforeExpiry: threshold,
            },
          });

          const message = threshold === 0
            ? "Your agency license has expired. You cannot post new shifts until renewed."
            : `Your agency license expires in ${daysUntil} days. Renew to continue posting shifts.`;

          await sendNotification({
            userId: provider.userId,
            type: threshold === 0 ? "LICENSE_EXPIRED" : "LICENSE_EXPIRING",
            title: threshold === 0 ? "License Expired" : "License Expiring Soon",
            body: message,
            channels: ["inapp", "push"],
          });

          alertsSent++;
        } catch {
          // Already sent
        }
      }
    }

    if (daysUntil <= 0) {
      expired++;
    }
  }

  return { alertsSent, expired };
}
