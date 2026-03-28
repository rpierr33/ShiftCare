import { db } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until the rate limit window resets
}

// Default rate limit: 10 attempts per 15-minute window
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 10;
// Clean up expired rate limit entries every 5 minutes to prevent table bloat
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// In-memory timestamp of last cleanup — shared across all requests in the same process
let lastCleanupTime = 0;

interface RateLimitOptions {
  windowMs?: number;
  maxAttempts?: number;
}

/**
 * Database-backed rate limiter for server actions and API routes.
 * Key format: "action:identifier" e.g. "login:email:foo@bar.com"
 *
 * Uses a sliding window approach: each key tracks attempt count and window expiry.
 * Expired entries are cleaned up periodically to prevent DB bloat.
 */
export async function checkRateLimit(
  key: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  const now = new Date();

  // Periodic cleanup of expired entries — runs at most once per CLEANUP_INTERVAL_MS
  const nowMs = now.getTime();
  if (nowMs - lastCleanupTime >= CLEANUP_INTERVAL_MS) {
    lastCleanupTime = nowMs;
    // Non-critical — catch and ignore cleanup failures
    await db.rateLimitEntry.deleteMany({
      where: { expiresAt: { lt: now } },
    }).catch(() => {});
  }

  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  // Check for existing rate limit entry
  const existing = await db.rateLimitEntry.findUnique({
    where: { key },
  });

  // No existing entry or window has expired — reset and allow
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

  // Within window and at max attempts — reject with retry time
  if (existing.attempts >= maxAttempts) {
    const retryAfter = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Within window, under limit — increment attempt count
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
 * Resets the rate limit for a key.
 * Call after a successful action (e.g., after successful login to clear login rate limit).
 */
export async function resetRateLimit(key: string): Promise<void> {
  await db.rateLimitEntry.deleteMany({
    where: { key },
  }).catch(() => {});
}
