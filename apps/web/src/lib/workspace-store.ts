const KEY = 'omnidev_active_workspace_v1';
const LIST_KEY = 'omnidev_workspaces_cache_v1';

export type WorkspaceDTO = {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  members: { userId: string; role: string; walletAddress?: string | null }[];
};

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setActiveWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(KEY, id);
  else localStorage.removeItem(KEY);
}

export function cacheWorkspaces(list: WorkspaceDTO[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function getCachedWorkspaces(): WorkspaceDTO[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getSessionWallet(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem('omnidev_session');
    if (!s) return null;
    const u = JSON.parse(s);
    return u.walletAddress || null;
  } catch {
    return null;
  }
}
