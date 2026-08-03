export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface GenerationJob {
  id: string;
  status: JobStatus;
  prompt: string;
  result?: { files: Record<string, string>; description: string };
  error?: string;
  createdAt: number;
  updatedAt?: number;
}

const jobs = new Map<string, GenerationJob>();

export function enqueueGeneration(prompt: string): GenerationJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: GenerationJob = {
    id,
    status: 'queued',
    prompt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): GenerationJob | undefined {
  return jobs.get(id);
}

export function listJobs(limit = 50): GenerationJob[] {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function updateJob(id: string, patch: Partial<GenerationJob>) {
  const j = jobs.get(id);
  if (!j) return;
  Object.assign(j, patch, { updatedAt: Date.now() });
}

export async function publishToQStash(destinationUrl: string, body: unknown): Promise<boolean> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return false;
  const res = await fetch(
    `https://qstash.upstash.io/v2/publish/${encodeURIComponent(destinationUrl)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  return res.ok;
}
