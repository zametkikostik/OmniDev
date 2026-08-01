/**
 * OmniDev DB — memory by default (Vercel-safe, no Prisma required at build).
 */

export type MemProject = {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  prompt: string;
  files: Record<string, string>;
  shareSlug: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MemUser = {
  id: string;
  walletAddress: string | null;
  credits: number;
};

const mem = {
  projects: new Map<string, MemProject>(),
  users: new Map<string, MemUser>(),
  payments: new Set<string>(),
};

export const memoryStore = {
  listProjects(userId?: string) {
    return [...mem.projects.values()]
      .filter((p) => !userId || p.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },
  getProject(id: string) {
    return mem.projects.get(id) || null;
  },
  getBySlug(slug: string) {
    return [...mem.projects.values()].find((p) => p.shareSlug === slug && p.isPublic) || null;
  },
  saveProject(data: Partial<MemProject> & { name: string; files: Record<string, string> }) {
    const now = new Date();
    if (data.id && mem.projects.has(data.id)) {
      const existing = mem.projects.get(data.id)!;
      const updated = { ...existing, ...data, updatedAt: now };
      mem.projects.set(data.id, updated);
      return updated;
    }
    const id = data.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const project: MemProject = {
      id,
      userId: data.userId || null,
      name: data.name,
      description: data.description || '',
      prompt: data.prompt || '',
      files: data.files,
      shareSlug: data.shareSlug || null,
      isPublic: data.isPublic || false,
      createdAt: now,
      updatedAt: now,
    };
    mem.projects.set(id, project);
    return project;
  },
  getOrCreateUserByWallet(wallet: string) {
    const w = wallet.toLowerCase();
    for (const u of mem.users.values()) {
      if (u.walletAddress === w) return u;
    }
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const user: MemUser = { id, walletAddress: w, credits: 0 };
    mem.users.set(id, user);
    return user;
  },
  addCredits(userId: string, amount: number) {
    const u = mem.users.get(userId);
    if (!u) return 0;
    u.credits = Math.max(0, u.credits + amount);
    return u.credits;
  },
  hasPayment(txHash: string) {
    return mem.payments.has(txHash);
  },
  recordPayment(txHash: string) {
    mem.payments.add(txHash);
  },
};

/** Stub when Prisma not installed — hasDatabase() is false */
export const prisma: any = {
  user: {
    async findUnique() { return null; },
    async findMany() { return []; },
    async upsert() { return null; },
    async update() { return null; },
    async create() { return null; },
  },
  project: {
    async findUnique() { return null; },
    async findMany() { return []; },
    async create() { return null; },
    async update() { return null; },
    async upsert() { return null; },
  },
  payment: {
    async findUnique() { return null; },
    async create() { return null; },
  },
};

export function hasDatabase(): boolean {
  return false;
}
