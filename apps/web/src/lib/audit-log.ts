export type AuditEvent = {
  id: string;
  at: number;
  type: 'moderation' | 'generate' | 'admin' | 'payment' | 'workspace' | 'job' | 'edit' | 'vision';
  action: string;
  ip?: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
};

const MAX = 500;
const events: AuditEvent[] = [];

async function persistNeon(ev: AuditEvent) {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    await sql`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        at BIGINT NOT NULL,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        ip TEXT,
        user_id TEXT,
        meta JSONB
      )
    `;
    await sql`
      INSERT INTO audit_events (id, at, type, action, ip, user_id, meta)
      VALUES (${ev.id}, ${ev.at}, ${ev.type}, ${ev.action}, ${ev.ip || null}, ${ev.userId || null}, ${JSON.stringify(ev.meta || {})}::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (e) {
    console.warn('[audit] neon', e);
  }
}

export function audit(
  type: AuditEvent['type'],
  action: string,
  opts?: { ip?: string; userId?: string | null; meta?: Record<string, unknown> }
) {
  const ev: AuditEvent = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    type,
    action,
    ip: opts?.ip,
    userId: opts?.userId,
    meta: opts?.meta,
  };
  events.unshift(ev);
  if (events.length > MAX) events.length = MAX;
  void persistNeon(ev);
}

export function listAudit(limit = 100, type?: AuditEvent['type']): AuditEvent[] {
  const list = type ? events.filter((e) => e.type === type) : events;
  return list.slice(0, limit);
}

export async function listAuditAsync(limit = 100, type?: string): Promise<AuditEvent[]> {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(url);
      const rows = type
        ? await sql`SELECT * FROM audit_events WHERE type = ${type} ORDER BY at DESC LIMIT ${limit}`
        : await sql`SELECT * FROM audit_events ORDER BY at DESC LIMIT ${limit}`;
      if (Array.isArray(rows) && rows.length) {
        return rows.map((r: any) => ({
          id: r.id,
          at: Number(r.at),
          type: r.type,
          action: r.action,
          ip: r.ip,
          userId: r.user_id,
          meta: typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta,
        }));
      }
    } catch {}
  }
  return listAudit(limit, type as any);
}

export function auditStats() {
  const byType: Record<string, number> = {};
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  return {
    total: events.length,
    byType,
    last24h: events.filter((e) => e.at > Date.now() - 86400000).length,
    neon: !!process.env.DATABASE_URL,
  };
}
