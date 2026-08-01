export interface SavedProject {
  id: string; name: string; description: string; files: Record<string, string>;
  prompt: string; createdAt: number; updatedAt: number; previewUrl?: string;
  shareSlug?: string | null; isPublic?: boolean;
}

const STORAGE_KEY = 'omnidev_projects_v1';

export async function listProjectsAPI(userId?: string): Promise<SavedProject[]> {
  try {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`/api/projects${q}`);
    const data = await res.json();
    if (data.projects) return data.projects.map(normalize);
  } catch {}
  return listProjectsLocal();
}

export async function saveProjectAPI(
  project: Omit<SavedProject, 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SavedProject> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    const data = await res.json();
    if (data.project) {
      const saved = normalize(data.project);
      saveProjectLocal(saved);
      return saved;
    }
  } catch {}
  return saveProjectLocal(project as any);
}

export async function deleteProjectAPI(id: string): Promise<void> {
  try { await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch {}
  deleteProjectLocal(id);
}

export async function shareProjectAPI(projectId: string): Promise<{ slug: string; url: string }> {
  const res = await fetch('/api/share', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { slug: data.slug, url: data.url };
}

function listProjectsLocal(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveProjectLocal(project: any): SavedProject {
  const projects = listProjectsLocal();
  const now = Date.now();
  if (project.id) {
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...project, updatedAt: now };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return projects[idx];
    }
  }
  const saved: SavedProject = {
    id: project.id || `proj_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: project.name, description: project.description, files: project.files,
    prompt: project.prompt, createdAt: now, updatedAt: now,
    previewUrl: project.previewUrl, shareSlug: project.shareSlug, isPublic: project.isPublic,
  };
  projects.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 50)));
  return saved;
}

function deleteProjectLocal(id: string) {
  const projects = listProjectsLocal().filter((p) => p.id !== id);
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function normalize(p: any): SavedProject {
  return {
    id: p.id, name: p.name, description: p.description || '',
    files: typeof p.files === 'string' ? JSON.parse(p.files) : p.files,
    prompt: p.prompt || '',
    createdAt: new Date(p.createdAt).getTime(),
    updatedAt: new Date(p.updatedAt).getTime(),
    shareSlug: p.shareSlug, isPublic: p.isPublic,
  };
}

export function listProjects(): SavedProject[] { return listProjectsLocal(); }
export function saveProject(project: any): SavedProject { return saveProjectLocal(project); }
export function deleteProject(id: string): void { deleteProjectLocal(id); }
