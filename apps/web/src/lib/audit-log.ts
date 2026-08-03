export type AuditEvent = {
  id: string;
  at: number;
  type: 'moderation' | 'generate' | 'admin' | 'payment' | 'workspace' | 'job';
  action: string;
  ip?: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
};

const MAX = 500;
const events: AuditEvent[] = [];

export function audit(
  type: AuditEvent['type'],
  action: string,
  opts?: { ip?: string; userId?: string | null; meta?: Record<string, unknown> }
) {
  events.unshift({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    type,
    action,
    ip: opts?.ip,
    userId: opts?.userId,
    meta: opts?.meta,
  });
  if (events.length > MAX) events.length = MAX;
}

export function listAudit(limit = 100, type?: AuditEvent['type']): AuditEvent[] {
  const list = type ? events.filter((e) => e.type === type) : events;
  return list.slice(0, limit);
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
  };
}
