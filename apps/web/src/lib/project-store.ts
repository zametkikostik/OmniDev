export interface SavedProject {
  id: string;
  name: string;
  description: string;
  files: Record<string, string>;
  prompt: string;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
}

const STORAGE_KEY = 'omnidev_projects_v1';

export function listProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export function getProject(id: string): SavedProject | null {
  return listProjects().find((p) => p.id === id) || null;
}

export function saveProject(
  project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): SavedProject {
  const projects = listProjects();
  const now = Date.now();

  if (project.id) {
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...project, updatedAt: now } as SavedProject;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return projects[idx];
    }
  }

  const saved: SavedProject = {
    id: project.id || `proj_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: project.name,
    description: project.description,
    files: project.files,
    prompt: project.prompt,
    createdAt: now,
    updatedAt: now,
    previewUrl: project.previewUrl,
  };

  projects.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 50)));
  return saved;
}

export function deleteProject(id: string): void {
  const projects = listProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
