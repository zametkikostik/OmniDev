'use client';

import { useRef, useState } from 'react';
import { loadSettings } from '@/lib/settings-store';

interface Props {
  onGenerated: (files: Record<string, string>, description: string) => void;
}

export function ScreenshotUpload({ onGenerated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Нужен файл изображения');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      const settings = loadSettings();
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
          prompt: 'Сделай pixel-perfect React + Tailwind реализацию',
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Ошибка vision API');
        return;
      }
      onGenerated(data.files || {}, data.description || 'UI по скриншоту');
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        className="text-xs text-zinc-400 hover:text-violet-400 transition disabled:opacity-50"
        title="Загрузить скриншот UI → код">
        {loading ? 'Анализирую...' : '📷 Скрин'}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
