type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit) return { ok: false, remaining: 0, resetAt: entry.resetAt };
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  const h = (name: string) => req.headers.get(name);
  return h('x-forwarded-for')?.split(',')[0]?.trim() || h('x-real-ip') || h('cf-connecting-ip') || 'unknown';
}
