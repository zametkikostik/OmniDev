'use client';

import { useEffect, useState } from 'react';

export function JobStatus({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState('queued');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`);
        const data = await res.json();
        if (stop) return;
        setStatus(data.status || 'unknown');
        if (data.result?.error) setError(data.result.error);
        if (data.status === 'done' || data.status === 'failed') return;
        setTimeout(tick, 2000);
      } catch {
        if (!stop) setTimeout(tick, 3000);
      }
    };
    tick();
    return () => {
      stop = true;
    };
  }, [jobId]);

  return (
    <div className="text-xs text-zinc-400">
      Job <span className="font-mono text-zinc-300">{jobId.slice(0, 12)}…</span>:{' '}
      <span
        className={
          status === 'done'
            ? 'text-emerald-400'
            : status === 'failed'
              ? 'text-red-400'
              : 'text-amber-400'
        }
      >
        {status}
      </span>
      {error && <span className="text-red-400 ml-2">{error}</span>}
    </div>
  );
}
