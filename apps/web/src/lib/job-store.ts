export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export type Job = {
  id: string;
  status: JobStatus;
  prompt: string;
  result?: { files?: Record<string, string>; description?: string; error?: string };
  createdAt: number;
  updatedAt: number;
  userId?: string | null;
};

const mem = new Map<string, Job>();

function id() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function neonSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      prompt TEXT NOT NULL,
      result JSONB,
      user_id TEXT,
      created_at BIGINT,
      updated_at BIGINT
    )
  `;
  return sql;
}

export async function createJob(prompt: string, userId?: string | null): Promise<Job> {
  const job: Job = {
    id: id(),
    status: 'queued',
    prompt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userId: userId || null,
  };
  mem.set(job.id, job);
  try {
    const sql = await neonSql();
    if (sql) {
      await sql`
        INSERT INTO jobs (id, status, prompt, result, user_id, created_at, updated_at)
        VALUES (${job.id}, ${job.status}, ${job.prompt}, ${null}, ${job.userId}, ${job.createdAt}, ${job.updatedAt})
      `;
    }
  } catch (e) {
    console.warn('[jobs] create', e);
  }
  return job;
}

export async function updateJob(
  jobId: string,
  patch: Partial<Pick<Job, 'status' | 'result'>>
): Promise<Job | null> {
  const cur = mem.get(jobId) || (await getJob(jobId));
  if (!cur) return null;
  const next: Job = { ...cur, ...patch, updatedAt: Date.now() };
  mem.set(jobId, next);
  try {
    const sql = await neonSql();
    if (sql) {
      await sql`
        UPDATE jobs SET status = ${next.status}, result = ${JSON.stringify(next.result || null)}::jsonb, updated_at = ${next.updatedAt}
        WHERE id = ${jobId}
      `;
    }
  } catch (e) {
    console.warn('[jobs] update', e);
  }
  return next;
}

export async function getJob(jobId: string): Promise<Job | null> {
  if (mem.has(jobId)) return mem.get(jobId)!;
  try {
    const sql = await neonSql();
    if (!sql) return null;
    const rows = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
    if (!rows?.[0]) return null;
    const r = rows[0] as any;
    const job: Job = {
      id: r.id,
      status: r.status,
      prompt: r.prompt,
      result: typeof r.result === 'string' ? JSON.parse(r.result) : r.result,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      userId: r.user_id,
    };
    mem.set(job.id, job);
    return job;
  } catch {
    return null;
  }
}
