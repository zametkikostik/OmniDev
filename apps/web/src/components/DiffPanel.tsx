'use client';

import { summarizeDiff } from '@/lib/file-diff';

export function DiffPanel({
  before,
  after,
  onClose,
}: {
  before: Record<string, string>;
  after: Record<string, string>;
  onClose?: () => void;
}) {
  const diff = summarizeDiff(before, after);
  if (!diff.changed.length && !diff.added.length && !diff.removed.length) {
    return null;
  }

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/80 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 font-medium">Изменения файлов</span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        )}
      </div>
      {diff.changed.length > 0 && (
        <div>
          <p className="text-amber-400/90 mb-1">Изменено</p>
          <ul className="space-y-0.5 font-mono text-zinc-300">
            {diff.changed.map((p) => (
              <li key={p}>~ {p}</li>
            ))}
          </ul>
        </div>
      )}
      {diff.added.length > 0 && (
        <div>
          <p className="text-emerald-400/90 mb-1">Добавлено</p>
          <ul className="space-y-0.5 font-mono text-zinc-300">
            {diff.added.map((p) => (
              <li key={p}>+ {p}</li>
            ))}
          </ul>
        </div>
      )}
      {diff.removed.length > 0 && (
        <div>
          <p className="text-red-400/90 mb-1">Удалено</p>
          <ul className="space-y-0.5 font-mono text-zinc-300">
            {diff.removed.map((p) => (
              <li key={p}>- {p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
