'use client';

import { useEffect, useState } from 'react';
import {
  WorkspaceDTO,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  cacheWorkspaces,
  getSessionWallet,
} from '@/lib/workspace-store';

export default function WorkspacePage() {
  const [list, setList] = useState<WorkspaceDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [inviteWallet, setInviteWallet] = useState('');
  const [inviteWsId, setInviteWsId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces');
      const data = await res.json();
      setList(data.workspaces || []);
      cacheWorkspaces(data.workspaces || []);
      setActiveId(getActiveWorkspaceId());
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createWorkspace() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ownerWallet: getSessionWallet() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setName('');
      setActiveWorkspaceId(data.workspace.id);
      setActiveId(data.workspace.id);
      setMsg(`\u0421\u043e\u0437\u0434\u0430\u043d\u043e: ${data.workspace.name}`);
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
        body: JSON.stringify({ workspaceId: inviteWsId, walletAddress: inviteWallet.trim(), role: 'member' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setInviteWallet('');
      setMsg('\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d');
      await refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">\u041a\u043e\u043c\u0430\u043d\u0434\u044b</h1>
            <p className="text-sm text-zinc-500 mt-1">Workspace \u00b7 invite</p>
          </div>
          <a href="/" className="text-sm text-violet-400">\u2190 \u0427\u0430\u0442</a>
        </div>

        <section className="rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm text-zinc-400">\u0421\u043e\u0437\u0434\u0430\u0442\u044c</h2>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm" />
            <button onClick={createWorkspace} disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 text-sm disabled:opacity-40">OK</button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 p-5 space-y-2">
          <h2 className="text-sm text-zinc-400 mb-2">\u0421\u043f\u0438\u0441\u043e\u043a</h2>
          {list.map((ws) => (
            <button key={ws.id} type="button"
              onClick={() => { setActiveWorkspaceId(ws.id); setActiveId(ws.id); setMsg(ws.name); }}
              className={`w-full text-left rounded-xl border px-3 py-3 ${
                activeId === ws.id ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800'
              }`}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{ws.name}</span>
                {activeId === ws.id && <span className="text-[10px] text-violet-400">active</span>}
              </div>
              <p className="text-[11px] text-zinc-500">/{ws.slug} \u00b7 {ws.members?.length || 0}</p>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm text-zinc-400">Invite</h2>
          <select value={inviteWsId} onChange={(e) => setInviteWsId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm">
            <option value="">...</option>
            {list.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={inviteWallet} onChange={(e) => setInviteWallet(e.target.value)} placeholder="0x..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-mono" />
            <button onClick={invite} disabled={loading || !inviteWsId || !inviteWallet.trim()}
              className="px-4 py-2 rounded-xl border border-zinc-600 text-sm disabled:opacity-40">Invite</button>
          </div>
        </section>

        {msg && <p className="text-center text-xs text-zinc-400">{msg}</p>}
      </div>
    </div>
  );
}
