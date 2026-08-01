'use client';

import { useState } from 'react';

interface UserRow {
  id: string;
  walletAddress: string | null;
  credits: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [lookup, setLookup] = useState<{ credits: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-secret': secret });

  async function loadUsers() {
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/admin/credits?list=1', { headers: headers() });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Unauthorized'); return; }
      setUsers(data.users || []);
      setMsg(`Backend: ${data.backend} · ${data.users?.length ?? 0} users`);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  async function lookupCredits() {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/credits?address=${encodeURIComponent(address)}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Error'); return; }
      setLookup({ credits: data.credits });
      setMsg(`Balance: ${data.credits}`);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  async function adjustCredits() {
    if (!address || !amount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ address, amount, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Error'); return; }
      setMsg(`OK · new balance: ${data.credits}`);
      setLookup({ credits: data.credits });
      await loadUsers();
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Credits</h1>
            <p className="text-sm text-zinc-500 mt-1">Управление кредитами</p>
          </div>
          <a href="/" className="text-sm text-violet-400">← App</a>
        </div>
        <label className="block text-xs text-zinc-500 mb-1">ADMIN_SECRET</label>
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="from env ADMIN_SECRET" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6 space-y-4">
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono"
            placeholder="0x..." />
          <div className="flex gap-3">
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm" placeholder="amount" />
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm" placeholder="reason" />
          </div>
          <div className="flex gap-2">
            <button onClick={lookupCredits} disabled={loading || !secret} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm disabled:opacity-40">Lookup</button>
            <button onClick={adjustCredits} disabled={loading || !secret} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-sm font-medium disabled:opacity-40">Apply</button>
            <button onClick={loadUsers} disabled={loading || !secret} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm disabled:opacity-40">List</button>
          </div>
        </div>
        {msg && <p className="text-sm text-zinc-400 mb-4 font-mono">{msg}</p>}
        {lookup && <p className="text-violet-400 text-sm mb-4">Credits: {lookup.credits}</p>}
        {users.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-500 text-xs">
                <tr><th className="text-left px-4 py-2">Wallet</th><th className="text-right px-4 py-2">Credits</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-zinc-800">
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-[240px]">{u.walletAddress}</td>
                    <td className="px-4 py-2 text-right text-violet-300">{u.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
