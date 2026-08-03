'use client';

import { useState, useCallback, useRef } from 'react';
import { runProject, writeFile } from '@/lib/webcontainer/client';
import { loadSettings } from '@/lib/settings-store';
import { saveProject } from '@/lib/project-store';
import { getActiveWorkspaceId } from '@/lib/workspace-store';
import { deductLocalCredits } from '@/lib/credits';
import { summarizeDiff } from '@/lib/file-diff';

export type RunnerStatus =
  | 'idle'
  | 'generating'
  | 'booting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'healing'
  | 'editing'
  | 'error';

export interface ProjectState {
  files: Record<string, string>;
  description: string;
  previewUrl: string | null;
  logs: string[];
  status: RunnerStatus;
  error?: string;
  projectId?: string;
}

const initial: ProjectState = {
  files: {},
  description: '',
  previewUrl: null,
  logs: [],
  status: 'idle',
};

export function useProjectRunner() {
  const [state, setState] = useState<ProjectState>(initial);
  const healingRef = useRef(false);

  const generateAndRun = useCallback(async (prompt: string) => {
    const bill = deductLocalCredits('generate');
    if (!bill.ok) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: `Недостаточно кредитов (нужно ${bill.cost}, есть ${bill.remaining}). Пополни на /billing`,
      }));
      return;
    }
    setState((s) => ({
      ...s,
      status: 'generating',
      logs: [`Генерирую проект...`],
      error: undefined,
      previewUrl: null,
    }));

    try {
      const settings = loadSettings();
      let address: string | undefined;
      try {
        const raw = localStorage.getItem('omnidev_session');
        if (raw) address = JSON.parse(raw).walletAddress;
      } catch {}
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, settings, address }),
      });
      const genData = await genRes.json();
      if (!genRes.ok || !genData.files) {
        try {
          const { getLocalCredits, setLocalCredits } = await import('@/lib/credits');
          setLocalCredits(getLocalCredits() + bill.cost);
        } catch {}
        throw new Error(genData.error || 'Generation failed');
      }
      if (genData.healAttempts) {
        setState((s) => ({
          ...s,
          logs: [...s.logs, `Auto-heal: ${genData.healAttempts} попыток`],
        }));
      }

      setState((s) => ({
        ...s,
        files: genData.files,
        description: genData.description || '',
        status: 'booting',
        logs: [...s.logs, 'Boot WebContainer...'],
      }));

      const result = await runProject(genData.files, (line) => {
        setState((s) => ({
          ...s,
          logs: [...s.logs.slice(-80), line],
          status: line.includes('npm install')
            ? 'installing'
            : line.includes('Starting') || line.includes('dev')
              ? 'starting'
              : s.status,
        }));
      });

      if (result.error || !result.url) {
        setState((s) => ({
          ...s,
          status: 'error',
          error: result.error || 'No preview URL',
          logs: result.logs,
        }));
        return;
      }

      const saved = saveProject({
        name: (genData.description || prompt).slice(0, 60),
        description: genData.description || '',
        files: genData.files,
        prompt,
        previewUrl: result.url || undefined,
      });
      try {
        const { saveProjectAPI } = await import('@/lib/project-store');
        await saveProjectAPI({
          id: saved.id,
          name: saved.name,
          description: genData.description || '',
          files: genData.files,
          prompt,
          workspaceId: getActiveWorkspaceId(),
        });
      } catch {}

      setState((s) => ({
        ...s,
        previewUrl: result.url,
        logs: result.logs,
        status: 'ready',
        projectId: saved.id,
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, status: 'error', error: err.message || String(err) }));
    }
  }, []);

  const editProject = useCallback(async (instruction: string) => {
    const bill = deductLocalCredits('edit');
    if (!bill.ok) {
      setState((s) => ({
        ...s,
        error: `Недостаточно кредитов (edit: ${bill.cost})`,
      }));
      return;
    }
    setState((s) => ({
      ...s,
      status: 'editing',
      logs: [...s.logs, `✏️ ${instruction}`],
    }));
    try {
      const settings = loadSettings();
      const before = { ...state.files };
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          files: state.files,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.files) throw new Error(data.error || 'Edit failed');
      const diff = summarizeDiff(before, data.files);
      for (const [path, content] of Object.entries(data.files as Record<string, string>)) {
        try {
          await writeFile(path, content as string);
        } catch {}
      }
      setState((s) => ({
        ...s,
        files: data.files,
        status: 'ready',
        logs: [...s.logs, diff.summary],
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  }, [state.files]);

  const runFromFiles = useCallback(
    async (files: Record<string, string>, description = '') => {
      setState((s) => ({
        ...s,
        status: 'booting',
        files,
        description,
        error: undefined,
        previewUrl: null,
      }));
      try {
        const result = await runProject(files, (line) => {
          setState((s) => ({
            ...s,
            logs: [...s.logs.slice(-80), line],
            status: line.includes('npm install')
              ? 'installing'
              : line.includes('Starting') || line.includes('dev')
                ? 'starting'
                : s.status,
          }));
        });
        if (result.error || !result.url) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: result.error || 'No preview URL',
            logs: result.logs,
          }));
          return;
        }
        const saved = saveProject({
          name: description.slice(0, 60) || 'Project',
          description,
          files,
          prompt: 'import',
          previewUrl: result.url || undefined,
        });
        try {
          const { saveProjectAPI } = await import('@/lib/project-store');
          await saveProjectAPI({
            id: saved.id,
            name: saved.name,
            description,
            files,
            prompt: 'import',
            workspaceId: getActiveWorkspaceId(),
          });
        } catch {}
        setState((s) => ({
          ...s,
          previewUrl: result.url,
          logs: result.logs,
          status: 'ready',
          projectId: saved.id,
        }));
      } catch (err: any) {
        setState((s) => ({ ...s, status: 'error', error: err.message || String(err) }));
      }
    },
    []
  );

  const restartSandbox = useCallback(async () => {
    const { files, description } = state;
    if (!Object.keys(files).length) return;
    await runFromFiles(files, description || '');
  }, [state.files, state.description, runFromFiles]);

  return {
    ...state,
    generateAndRun,
    editProject,
    runFromFiles,
    restartSandbox,
  };
}
