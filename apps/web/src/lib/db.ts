/**
 * OmniDev DB — memory default, Neon when DATABASE_URL + @neondatabase/serverless.
 */
export type MemProject = {
  id: string;
  userId: string | null;
  workspaceId?: string | null;
  name: string;
  description: string;
  prompt: string;
  files: Record<string, string>;
  shareSlug: string | null;
  isPublic: boolean;
  previewUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
export type MemUser = { id: string; walletAddress: string | null; credits: number };
export type MemWorkspace = {
  id: string; name: string; slug: string; ownerId: string | null;
  members: { userId: string; role: string; walletAddress?: string | null }[];
};

const mem = {
  projects: new Map<string, MemProject>(),
  users: new Map<string, MemUser>(),
  payments: new Set<string>(),
  workspaces: new Map<string, MemWorkspace>(),
  usage: [] as { userId: string | null; action: string; cost: number; at: number }[],
};
const nid = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const memoryStore = {
  listProjects(userId?: string) {
    return [...mem.projects.values()].filter((p) => !userId || p.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },
  getProject(id: string) { return mem.projects.get(id) || null; },
  getBySlug(slug: string) {
    return [...mem.projects.values()].find((p) => p.shareSlug === slug && p.isPublic) || null;
  },
  saveProject(data: Partial<MemProject> & { name: string; files: Record<string, string> }) {
    const now = new Date();
    if (data.id && mem.projects.has(data.id)) {
      const u = { ...mem.projects.get(data.id)!, ...data, updatedAt: now };
      mem.projects.set(data.id, u);
      return u;
    }
    const id = data.id || nid('proj');
    const project: MemProject = {
      id, userId: data.userId || null, workspaceId: data.workspaceId || null,
      name: data.name, description: data.description || '', prompt: data.prompt || '',
      files: data.files, shareSlug: data.shareSlug || null, isPublic: data.isPublic || false,
      previewUrl: data.previewUrl || null, createdAt: now, updatedAt: now,
    };
    mem.projects.set(id, project);
    return project;
  },
  getOrCreateUserByWallet(wallet: string) {
    const w = wallet.toLowerCase();
    for (const u of mem.users.values()) if (u.walletAddress === w) return u;
    const user: MemUser = { id: nid('user'), walletAddress: w, credits: 50 };
    mem.users.set(user.id, user);
    return user;
  },
  addCredits(userId: string, amount: number) {
    const u = mem.users.get(userId); if (!u) return 0;
    u.credits = Math.max(0, u.credits + amount); return u.credits;
  },
  deductCredits(userId: string, amount: number) {
    const u = mem.users.get(userId);
    if (!u || u.credits < amount) return { ok: false, credits: u?.credits ?? 0 };
    u.credits -= amount; return { ok: true, credits: u.credits };
  },
  hasPayment(tx: string) { return mem.payments.has(tx); },
  recordPayment(tx: string) { mem.payments.add(tx); },
  listUsers() { return [...mem.users.values()]; },
  recordUsage(userId: string | null, action: string, cost: number) {
    mem.usage.push({ userId, action, cost, at: Date.now() });
  },
  createWorkspace(name: string, ownerId: string | null, ownerWallet?: string) {
    const slug = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'ws') + '-' + Math.random().toString(36).slice(2, 6);
    const ws: MemWorkspace = {
      id: nid('ws'), name, slug, ownerId,
      members: ownerId ? [{ userId: ownerId, role: 'owner', walletAddress: ownerWallet || null }] : [],
    };
    mem.workspaces.set(ws.id, ws);
    return ws;
  },
  getWorkspace(id: string) { return mem.workspaces.get(id) || null; },
  listWorkspaces(userId?: string) {
    return [...mem.workspaces.values()].filter(
      (w) => !userId || w.ownerId === userId || w.members.some((m) => m.userId === userId)
    );
  },
  addMember(workspaceId: string, userId: string, role = 'member', wallet?: string) {
    const ws = mem.workspaces.get(workspaceId); if (!ws) return null;
    if (!ws.members.some((m) => m.userId === userId))
      ws.members.push({ userId, role, walletAddress: wallet || null });
    return ws;
  },
};

export const prisma: any = {
  user: {
    async findUnique({ where }: any) {
      if (where?.walletAddress) return memoryStore.getOrCreateUserByWallet(where.walletAddress);
      return where?.id ? mem.users.get(where.id) || null : null;
    },
    async findMany() { return memoryStore.listUsers(); },
    async upsert({ where, create, update }: any) {
      const u = memoryStore.getOrCreateUserByWallet((where.walletAddress || create.walletAddress || '').toLowerCase());
      if (update?.credits?.increment) u.credits += update.credits.increment;
      else if (typeof update?.credits === 'number') u.credits = update.credits;
      return u;
    },
    async update({ where, data }: any) {
      const u = (where.id && mem.users.get(where.id)) ||
        (where.walletAddress && memoryStore.getOrCreateUserByWallet(where.walletAddress));
      if (!u) return null;
      if (typeof data.credits === 'number') u.credits = data.credits;
      if (data.credits?.increment) u.credits += data.credits.increment;
      if (data.credits?.decrement) u.credits = Math.max(0, u.credits - data.credits.decrement);
      return u;
    },
    async create({ data }: any) { return memoryStore.getOrCreateUserByWallet(data.walletAddress || nid('anon')); },
  },
  project: {
    async findUnique({ where }: any) {
      if (where.id) return memoryStore.getProject(where.id);
      if (where.shareSlug) return memoryStore.getBySlug(where.shareSlug);
      return null;
    },
    async findMany({ where }: any = {}) { return memoryStore.listProjects(where?.userId); },
    async create({ data }: any) { return memoryStore.saveProject(data); },
    async update({ where, data }: any) {
      const e = memoryStore.getProject(where.id); if (!e) throw new Error('Not found');
      return memoryStore.saveProject({ ...e, ...data, id: where.id });
    },
    async upsert({ where, create, update }: any) {
      const e = where.id ? memoryStore.getProject(where.id) : null;
      if (e) return memoryStore.saveProject({ ...e, ...update, id: e.id });
      return memoryStore.saveProject(create);
    },
  },
  payment: {
    async findUnique({ where }: any) {
      return where.txHash && memoryStore.hasPayment(where.txHash) ? { txHash: where.txHash } : null;
    },
    async create({ data }: any) { memoryStore.recordPayment(data.txHash); return data; },
  },
};

let neonReady: boolean | null = null;
let sql: any = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL) && neonReady === true;
}

export async function ensureDb(): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) { neonReady = false; return false; }
  if (neonReady === true) return true;
  try {
    const mod = await import('@neondatabase/serverless').catch(() => null);
    if (!mod?.neon) { neonReady = false; return false; }
    sql = mod.neon(url);
    await sql`CREATE TABLE IF NOT EXISTS omnidev_users (
      id TEXT PRIMARY KEY, wallet_address TEXT UNIQUE, credits INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS omnidev_projects (
      id TEXT PRIMARY KEY, user_id TEXT, workspace_id TEXT, name TEXT NOT NULL,
      description TEXT DEFAULT '', prompt TEXT DEFAULT '', files JSONB NOT NULL DEFAULT '{}',
      share_slug TEXT UNIQUE, is_public BOOLEAN DEFAULT FALSE, preview_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS omnidev_payments (
      tx_hash TEXT PRIMARY KEY, user_id TEXT, plan_id TEXT, chain_id INT,
      amount TEXT, token TEXT, credits INT, created_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS omnidev_workspaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, owner_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS omnidev_workspace_members (
      workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member',
      PRIMARY KEY (workspace_id, user_id))`;
    await sql`CREATE TABLE IF NOT EXISTS omnidev_usage (
      id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, cost INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW())`;
    neonReady = true;
    return true;
  } catch (e) {
    console.error('[db] Neon init failed', e);
    neonReady = false;
    return false;
  }
}

export const db = {
  async getOrCreateUserByWallet(wallet: string) {
    await ensureDb();
    if (!hasDatabase() || !sql) return memoryStore.getOrCreateUserByWallet(wallet);
    const w = wallet.toLowerCase();
    const rows = await sql`SELECT * FROM omnidev_users WHERE wallet_address = ${w} LIMIT 1`;
    if (rows[0]) return { id: rows[0].id, walletAddress: rows[0].wallet_address, credits: rows[0].credits };
    const uid = nid('user');
    await sql`INSERT INTO omnidev_users (id, wallet_address, credits) VALUES (${uid}, ${w}, 50)`;
    return { id: uid, walletAddress: w, credits: 50 };
  },
  async addCredits(userId: string, amount: number) {
    await ensureDb();
    if (!hasDatabase() || !sql) return memoryStore.addCredits(userId, amount);
    await sql`UPDATE omnidev_users SET credits = GREATEST(0, credits + ${amount}), updated_at = NOW() WHERE id = ${userId}`;
    const rows = await sql`SELECT credits FROM omnidev_users WHERE id = ${userId}`;
    return rows[0]?.credits ?? 0;
  },
  async deductCredits(userId: string, amount: number) {
    await ensureDb();
    if (!hasDatabase() || !sql) return memoryStore.deductCredits(userId, amount);
    const rows = await sql`SELECT credits FROM omnidev_users WHERE id = ${userId}`;
    const cur = rows[0]?.credits ?? 0;
    if (cur < amount) return { ok: false, credits: cur };
    await sql`UPDATE omnidev_users SET credits = credits - ${amount}, updated_at = NOW() WHERE id = ${userId} AND credits >= ${amount}`;
    const after = await sql`SELECT credits FROM omnidev_users WHERE id = ${userId}`;
    return { ok: true, credits: after[0]?.credits ?? 0 };
  },
  async saveProject(data: Partial<MemProject> & { name: string; files: Record<string, string> }) {
    await ensureDb();
    if (!hasDatabase() || !sql) return memoryStore.saveProject(data);
    const pid = data.id || nid('proj');
    const files = JSON.stringify(data.files);
    await sql`
      INSERT INTO omnidev_projects (id, user_id, workspace_id, name, description, prompt, files, share_slug, is_public, preview_url)
      VALUES (${pid}, ${data.userId || null}, ${data.workspaceId || null}, ${data.name}, ${data.description || ''},
        ${data.prompt || ''}, ${files}::jsonb, ${data.shareSlug || null}, ${data.isPublic || false}, ${data.previewUrl || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, prompt = EXCLUDED.prompt,
        files = EXCLUDED.files, share_slug = COALESCE(EXCLUDED.share_slug, omnidev_projects.share_slug),
        is_public = EXCLUDED.is_public, preview_url = COALESCE(EXCLUDED.preview_url, omnidev_projects.preview_url),
        updated_at = NOW()`;
    return { ...data, id: pid } as MemProject;
  },
  async recordUsage(userId: string | null, action: string, cost: number) {
    await ensureDb();
    if (!hasDatabase() || !sql) { memoryStore.recordUsage(userId, action, cost); return; }
    await sql`INSERT INTO omnidev_usage (id, user_id, action, cost) VALUES (${nid('usage')}, ${userId}, ${action}, ${cost})`;
  },
  async createWorkspace(name: string, ownerId: string | null) {
    await ensureDb();
    if (!hasDatabase() || !sql) return memoryStore.createWorkspace(name, ownerId);
    const wid = nid('ws');
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}-${wid.slice(-4)}`;
    await sql`INSERT INTO omnidev_workspaces (id, name, slug, owner_id) VALUES (${wid}, ${name}, ${slug}, ${ownerId})`;
    if (ownerId) {
      await sql`INSERT INTO omnidev_workspace_members (workspace_id, user_id, role) VALUES (${wid}, ${ownerId}, 'owner') ON CONFLICT DO NOTHING`;
    }
    return { id: wid, name, slug, ownerId, members: ownerId ? [{ userId: ownerId, role: 'owner' }] : [] };
  },
};
