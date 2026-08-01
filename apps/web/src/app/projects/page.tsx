'use client';

import { useEffect, useState } from 'react';
import { listProjects, deleteProject, SavedProject } from '@/lib/project-store';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);

  useEffect(() => { setProjects(listProjects()); }, []);

  function handleDelete(id: string) {
    if (!confirm('Удалить проект?')) return;
    deleteProject(id);
    setProjects(listProjects());
  }

  function handleDownload(p: SavedProject) {
    const blob = new Blob([JSON.stringify(p.files, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name || p.id}.files.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Мои проекты</h1>
            <p className="text-sm text-zinc-500 mt-1">Сохранённые приложения OmniDev</p>
          </div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">← К чату</a>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg mb-2">Пока нет сохранённых проектов</p>
            <p className="text-sm">Создай приложение в чате — оно сохранится автоматически</p>
            <a href="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm">Создать первое</a>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium truncate">{p.name}</h2>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{p.description || p.prompt}</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    {new Date(p.updatedAt).toLocaleString('ru')} · {Object.keys(p.files).length} файлов
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleDownload(p)} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs">JSON</button>
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/50 text-xs text-red-400">Удалить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
