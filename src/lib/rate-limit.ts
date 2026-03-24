import { db } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_ATTEMPTS = 10;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastCleanupTime = 0;

interface RateLimitOptions {
  windowMs?: number;
  maxAttempts?: number;
}

/**
 * Database-backed rate limiter.
 * Key format: "action:identifier" e.g. "login:email:foo@bar.com"
 */
export async function checkRateLimit(
  key: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  const now = new Date();

  // Clean up expired entries deterministically every 5 minutes
  const nowMs = now.getTime();
  if (nowMs - lastCleanupTime >= CLEANUP_INTERVAL_MS) {
    lastCleanupTime = nowMs;
    await db.rateLimitEntry.deleteMany({
      where: { expiresAt: { lt: now } },
    }).catch(() => {}); // non-critical
  }

  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const existing = await db.rateLimitEntry.findUnique({
    where: { key },
  });

  // No existing entry or expired — allow
  if (!existing || existing.expiresAt < now) {
    await db.rateLimitEntry.upsert({
      where: { key },
      create: {
        key,
        attempts: 1,
        lastAttempt: now,
        expiresAt: new Date(now.getTime() + windowMs),
      },
      update: {
        attempts: 1,
        lastAttempt: now,
        expiresAt: new Date(now.getTime() + windowMs),
      },
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Still within window
  if (existing.attempts >= maxAttempts) {
    const retryAfter = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Increment
  await db.rateLimitEntry.update({
    where: { key },
    data: {
      attempts: existing.attempts + 1,
      lastAttempt: now,
    },
  });

  return { allowed: true, remaining: maxAttempts - existing.attempts - 1 };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export async function resetRateLimit(key: string): Promise<void> {
  await db.rateLimitEntry.deleteMany({
    where: { key },
  }).catch(() => {});
}
