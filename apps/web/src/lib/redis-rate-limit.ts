type Result = { ok: boolean; remaining: number; resetAt: number };

const memory = new Map<string, { count: number; resetAt: number }>();

async function upstashIncr(key: string, limit: number, windowSec: number): Promise<Result | null> {
  const url = process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !url.startsWith('https://') || !token) return null;

  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['INCR', key], ['TTL', key]]),
    });
    const data = await res.json();
    const count = Number(data[0]?.result ?? data[0] ?? 0);
    let ttl = Number(data[1]?.result ?? data[1] ?? -1);
    if (ttl < 0 && count === 1) {
      await fetch(`${base}/expire/${encodeURIComponent(key)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      ttl = windowSec;
    }
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + Math.max(ttl, 0) * 1000,
    };
  } catch {
    return null;
  }
}

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memory.set(key, entry);
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function rateLimitAsync(key: string, limit = 60, windowSec = 60): Promise<Result> {
  const fromRedis = await upstashIncr(`rl:${key}`, limit, windowSec);
  if (fromRedis) return fromRedis;
  return memoryLimit(key, limit, windowSec * 1000);
}

export function getClientIp(req: Request): string {
  const h = (n: string) => req.headers.get(n);
  return (
    h('x-forwarded-for')?.split(',')[0]?.trim() ||
    h('x-real-ip') ||
    h('cf-connecting-ip') ||
    'unknown'
  );
}
