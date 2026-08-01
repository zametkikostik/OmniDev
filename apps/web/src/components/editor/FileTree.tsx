'use client';

import { useState } from 'react';

interface Props {
  files: Record<string, string>;
  onSelect?: (path: string, content: string) => void;
}

export function FileTree({ files, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const paths = Object.keys(files).sort();
  if (paths.length === 0) return <div className="text-xs text-zinc-600 p-3">Нет файлов</div>;
  return (
    <div className="flex flex-col h-full border-t border-zinc-800">
      <div className="text-[10px] uppercase tracking-wider text-zinc-600 px-3 py-2 border-b border-zinc-800">
        Файлы ({paths.length})
      </div>
      <div className="flex-1 overflow-y-auto">
        {paths.map((path) => (
          <button key={path} onClick={() => { setSelected(path); onSelect?.(path, files[path]); }}
            className={`w-full text-left px-3 py-1.5 text-xs font-mono truncate transition ${
              selected === path ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}>{path}</button>
        ))}
      </div>
      {selected && files[selected] && (
        <div className="max-h-48 overflow-y-auto border-t border-zinc-800 bg-zinc-950 p-2">
          <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap break-all font-mono">
            {files[selected].slice(0, 3000)}{files[selected].length > 3000 ? '\n…' : ''}
          </pre>
        </div>
      )}
    </div>
  );
}
