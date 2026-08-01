'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SharedProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/share?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProject(data.project);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function download() {
    if (!project?.files) return;
    const blob = new Blob([JSON.stringify(project.files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'project'}.files.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center">Загрузка...</div>;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Проект не найден</p>
          <p className="text-sm text-zinc-500">{error || 'Ссылка недействительна'}</p>
          <a href="/" className="inline-block mt-6 text-violet-400 hover:underline text-sm">← OmniDev</a>
        </div>
      </div>
    );
  }

  const fileCount = project.files ? Object.keys(project.files).length : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold">O</div>
          <div>
            <p className="text-xs text-zinc-500">OmniDev · публичный проект</p>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
          </div>
        </div>
        {project.description && <p className="text-zinc-400 mb-6">{project.description}</p>}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Файлов</span><span>{fileCount}</span></div>
          <div className="flex justify-between text-sm mt-2"><span className="text-zinc-500">Обновлён</span><span>{new Date(project.updatedAt).toLocaleString('ru')}</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={download} className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">Скачать JSON</button>
          <a href="/" className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-center">Открыть в OmniDev</a>
        </div>
        <p className="text-[11px] text-zinc-600 text-center mt-8">/p/{slug}</p>
      </div>
    </div>
  );
}
