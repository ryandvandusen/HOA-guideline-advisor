/**
 * Simple in-memory rate limiter.
 *
 * Works well for single-instance local dev and low-traffic Vercel deployments.
 * For high-traffic production, replace with Upstash Redis (@upstash/ratelimit).
 * See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * @param key      - Identifier (e.g. IP address)
 * @param limit    - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

/** Call periodically to prevent unbounded memory growth in long-running processes. */
export function pruneExpiredEntries(): void {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (now > entry.resetAt) store.delete(key);
  });
}

// Prune stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(pruneExpiredEntries, 10 * 60 * 1000);
}
