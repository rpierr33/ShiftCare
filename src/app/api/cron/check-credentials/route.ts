import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

// Thresholds (in days) at which to send credential expiry alerts
// Sorted descending — we break after the first matching threshold to send only one alert per run
const ALERT_THRESHOLDS = [60, 30, 14, 7, 0];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * GET /api/cron/check-credentials
 * Cron job that checks worker credentials and provider licenses for expiry.
 * - Auto-expires credentials past their expiry date
 * - Sends alerts at configurable threshold intervals (60, 30, 14, 7, 0 days)
 * - Uses credentialAlert table with unique constraint for idempotency
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workerResult = await checkWorkerCredentials();
    const providerResult = await checkProviderLicenses();

    return NextResponse.json({
      workers: workerResult,
      providers: providerResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check credentials cron error:", error);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}

/**
 * Checks all worker credential records for expiry.
 * Auto-expires credentials past their date and sends threshold-based alerts.
 */
async function checkWorkerCredentials(): Promise<{ alertsSent: number; expired: number }> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  // Fetch all active credentials that have an expiry date
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

    // Auto-expire credentials that are past their expiry date
    if (daysUntil <= 0 && cred.status !== "EXPIRED") {
      await db.credential.update({
        where: { id: cred.id },
        data: { status: "EXPIRED" },
      });

      // Also update the worker profile's aggregate credential status
      await db.workerProfile.update({
        where: { id: cred.workerProfileId },
        data: { credentialStatus: "EXPIRED" },
      });

      expired++;
    }

    // BUG FIX: Send alert only for the most specific matching threshold.
    // Previously, ALL thresholds <= daysUntil would trigger alerts at once
    // (e.g., at 7 days remaining, alerts for 7, 14, 30, and 60 would all fire).
    // Now we find only the tightest matching threshold and try to create that alert.
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntil <= threshold) {
        try {
          // Create alert record — unique constraint prevents duplicates
          await db.credentialAlert.create({
            data: {
              userId: cred.workerProfile.userId,
              credentialId: cred.id,
              daysBeforeExpiry: threshold,
            },
          });

          // Alert was created (not a duplicate) — send notification
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
          // Unique constraint violation = already sent this alert — expected, skip
        }

        // BUG FIX: Break after the first matching threshold to avoid sending multiple alerts
        break;
      }
    }
  }

  // Also check workerProfile-level credentialExpiryDate (aggregate field)
  const profiles = await db.workerProfile.findMany({
    where: {
      credentialExpiryDate: { not: null },
      credentialStatus: { notIn: ["EXPIRED", "REJECTED", "PENDING"] },
    },
  });

  for (const profile of profiles) {
    if (!profile.credentialExpiryDate) continue;
    const daysUntil = Math.ceil((profile.credentialExpiryDate.getTime() - now.getTime()) / MS_PER_DAY);

    // Auto-expire profiles past their credential expiry date
    if (daysUntil <= 0 && profile.credentialStatus !== "EXPIRED") {
      await db.workerProfile.update({
        where: { id: profile.id },
        data: { credentialStatus: "EXPIRED" },
      });
      expired++;
    }

    // BUG FIX: Same fix as above — only send for the tightest matching threshold
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
          // Already sent — expected
        }

        // Break after first matching threshold
        break;
      }
    }
  }

  return { alertsSent, expired };
}

/**
 * Checks provider agency licenses for expiry.
 * Sends threshold-based alerts (does not auto-suspend — that's a business decision).
 */
async function checkProviderLicenses(): Promise<{ alertsSent: number; expired: number }> {
  let alertsSent = 0;
  let expired = 0;
  const now = new Date();

  // Only check agencies — private employers don't have license requirements
  const providers = await db.providerProfile.findMany({
    where: {
      licenseExpiryDate: { not: null },
      providerType: "AGENCY",
    },
  });

  for (const provider of providers) {
    if (!provider.licenseExpiryDate) continue;
    const daysUntil = Math.ceil((provider.licenseExpiryDate.getTime() - now.getTime()) / MS_PER_DAY);

    // BUG FIX: Same threshold fix — only send the tightest matching alert
    for (const threshold of ALERT_THRESHOLDS) {
      if (daysUntil <= threshold) {
        try {
          // Create alert record — unique constraint handles idempotency
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
          // Already sent — expected
        }

        // Break after first matching threshold
        break;
      }
    }

    // Count expired licenses
    if (daysUntil <= 0) {
      expired++;
    }
  }

  return { alertsSent, expired };
}
