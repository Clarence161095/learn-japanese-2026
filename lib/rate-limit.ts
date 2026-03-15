/**
 * In-memory rate limiter for Next.js middleware (Edge Runtime compatible).
 * Uses a sliding window approach per IP.
 *
 * Two tiers:
 *  - General API rate limit: 100 requests / 60s per IP
 *  - Login brute-force protection: 5 failed attempts / 15min per IP
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp ms
}

// General rate limit store: IP → entry
const generalStore = new Map<string, RateLimitEntry>();
// Login attempt store: IP → entry (only failed attempts)
const loginStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically (every 5 min)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;

  generalStore.forEach((entry, key) => {
    if (now > entry.resetAt) generalStore.delete(key);
  });
  loginStore.forEach((entry, key) => {
    if (now > entry.resetAt) loginStore.delete(key);
  });
}

/**
 * Check general rate limit.
 * @returns { allowed: boolean, remaining: number, retryAfterSec: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 100,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  cleanup();
  const now = Date.now();
  const entry = generalStore.get(ip);

  if (!entry || now > entry.resetAt) {
    generalStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSec: 0 };
}

/**
 * Record a failed login attempt. Returns whether the IP is now blocked.
 * 5 failed attempts in a 15-minute window → block.
 */
export function recordLoginFailure(ip: string): {
  blocked: boolean;
  attemptsLeft: number;
  retryAfterSec: number;
} {
  cleanup();
  const now = Date.now();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const entry = loginStore.get(ip);

  if (!entry || now > entry.resetAt) {
    loginStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { blocked: false, attemptsLeft: maxAttempts - 1, retryAfterSec: 0 };
  }

  entry.count++;
  if (entry.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { blocked: true, attemptsLeft: 0, retryAfterSec };
  }

  return { blocked: false, attemptsLeft: maxAttempts - entry.count, retryAfterSec: 0 };
}

/**
 * Check if an IP is currently blocked from login attempts.
 */
export function isLoginBlocked(ip: string): {
  blocked: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const entry = loginStore.get(ip);

  if (!entry || now > entry.resetAt) {
    return { blocked: false, retryAfterSec: 0 };
  }

  if (entry.count >= 5) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { blocked: true, retryAfterSec };
  }

  return { blocked: false, retryAfterSec: 0 };
}

/**
 * Clear login failures for an IP (call on successful login).
 */
export function clearLoginFailures(ip: string): void {
  loginStore.delete(ip);
}
