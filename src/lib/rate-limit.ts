// Best-effort in-memory per-IP rate limiter. State persists within a Worker
// isolate across requests. Cloudflare may spin up multiple isolates under load,
// so this is not a distributed guarantee — it's enough to stop runaway scripts,
// accidental loops, and casual abuse before they hit paid APIs or send email.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Returns true if the caller has exceeded `limit` requests in the rolling `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

/** Cloudflare always sets CF-Connecting-IP; the fallbacks are for non-CF runtimes. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("CF-Connecting-IP") ??
    req.headers.get("X-Forwarded-For") ??
    "unknown"
  );
}
