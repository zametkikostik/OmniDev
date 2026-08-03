'use client';

import { useEffect, useState } from 'react';
import {
  WorkspaceDTO,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  cacheWorkspaces,
  getCachedWorkspaces,
  getSessionWallet,
} from '@/lib/workspace-store';

interface Props {
  open: boolean;
  onClose: () => void;
  onChange?: (ws: WorkspaceDTO | null) => void;
}

export function WorkspacePanel({ open, onClose, onChange }: Props) {
  const [list, setList] = useState<WorkspaceDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [inviteWallet, setInviteWallet] = useState('');
  const [inviteWsId, setInviteWsId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      const workspaces: WorkspaceDTO[] = data.workspaces || [];
      setList(workspaces);
      cacheWorkspaces(workspaces);
      const aid = getActiveWorkspaceId();
      setActiveId(aid);
      if (aid) onChange?.(workspaces.find((w) => w.id === aid) || null);
    } catch (e: any) {
      setMsg(e.message || 'Ошибка');
      setList(getCachedWorkspaces());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function createWorkspace() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ownerWallet: getSessionWallet() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setName('');
      setActiveWorkspaceId(data.workspace.id);
      setActiveId(data.workspace.id);
      onChange?.(data.workspace);
      setMsg(`Команда «${data.workspace.name}» создана`);
      await refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function invite() {
    if (!inviteWsId || !inviteWallet.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: inviteWsId,
          walletAddress: inviteWallet.trim(),
          role: 'member',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      setInviteWallet('');
      setMsg('Участник добавлен');
      await refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-semibold">Команда / Workspace</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Несколько человек — один проект</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg px-2">
            ×
          </button>
        </div>
        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-xs font-medium text-zinc-400 mb-2">Создать</h3>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Dev"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={loading || !name.trim()}
                onClick={createWorkspace}
                className="px-4 py-2 rounded-xl bg-violet-600 text-sm disabled:opacity-40"
              >
                Создать
              </button>
            </div>
          </section>
          <section>
            <h3 className="text-xs font-medium text-zinc-400 mb-2">Список</h3>
            {list.length === 0 ? (
              <p className="text-sm text-zinc-600">Пока пусто</p>
            ) : (
              <ul className="space-y-2">
                {list.map((ws) => (
                  <li
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setActiveId(ws.id);
                      onChange?.(ws);
                      setMsg(ws.name);
                    }}
                    className={`rounded-xl border px-3 py-2.5 cursor-pointer ${
                      activeId === ws.id ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{ws.name}</span>
                      {activeId === ws.id && (
                        <span className="text-[10px] text-violet-400">active</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      /{ws.slug} · {ws.members?.length || 0}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="text-xs font-medium text-zinc-400 mb-2">Пригласить (0x...)</h3>
            <select
              value={inviteWsId}
              onChange={(e) => setInviteWsId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm mb-2"
            >
              <option value="">Команда</option>
              {list.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={inviteWallet}
                onChange={(e) => setInviteWallet(e.target.value)}
                placeholder="0x..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                disabled={loading || !inviteWsId || !inviteWallet.trim()}
                onClick={invite}
                className="px-4 py-2 rounded-xl border border-zinc-600 text-sm disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </section>
          {msg && <p className="text-xs text-center text-zinc-400">{msg}</p>}
          <button
            type="button"
            onClick={() => {
              setActiveWorkspaceId(null);
              setActiveId(null);
              onChange?.(null);
            }}
            className="w-full text-xs text-zinc-500 py-2"
          >
            Сбросить активную
          </button>
        </div>
      </div>
    </div>
  );
}
