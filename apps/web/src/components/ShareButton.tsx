'use client';

import { useState } from 'react';
import { shareProjectAPI } from '@/lib/project-store';

interface Props { projectId: string | undefined; }

export function ShareButton({ projectId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [url, setUrl] = useState('');

  async function handleShare() {
    if (!projectId) return;
    setStatus('loading');
    try {
      const { url: path } = await shareProjectAPI(projectId);
      const full = `${window.location.origin}${path}`;
      setUrl(full);
      await navigator.clipboard.writeText(full);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  if (!projectId) return null;

  return (
    <div className="relative">
      <button onClick={handleShare} disabled={status === 'loading'}
        className="text-xs text-zinc-400 hover:text-violet-400 transition disabled:opacity-50"
        title="Публичная ссылка">
        {status === 'loading' && '...'}
        {status === 'done' && '✓ Скопировано'}
        {status === 'error' && 'Ошибка'}
        {status === 'idle' && 'Шаринг'}
      </button>
      {status === 'done' && url && (
        <div className="absolute top-6 right-0 z-20 w-64 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 break-all">{url}</div>
      )}
    </div>
  );
}
