'use client';

import { useEffect, useState } from 'react';
import { getVersion, loadVersions, type FileVersion } from '@/lib/chat-history';

export function VersionHistory({
  onRestore,
}: {
  onRestore: (files: Record<string, string>, label: string) => void;
}) {
  const [list, setList] = useState<FileVersion[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setList(loadVersions());
    setMounted(true);
  }, []);

  if (!list.length) return null;

  return (
    <div className="border-t border-zinc-800 p-3">
      <p className="text-[11px] text-zinc-500 mb-2">Versions</p>
      <ul className="space-y-1 max-h-32 overflow-y-auto">
        {list.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              className="w-full text-left text-[11px] text-zinc-400 hover:text-violet-300 truncate"
              onClick={() => {
                const full = getVersion(v.id);
                if (full) onRestore(full.files, full.label);
              }}
            >
              <span suppressHydrationWarning>
                {mounted ? new Date(v.at).toLocaleString() : '…'} — {v.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
