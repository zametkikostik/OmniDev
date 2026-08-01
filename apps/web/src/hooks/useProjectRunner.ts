'use client';

import { useState, useCallback, useRef } from 'react';
import { runProject, writeFile } from '@/lib/webcontainer/client';
import { loadSettings } from '@/lib/settings-store';

export type RunnerStatus =
  | 'idle' | 'generating' | 'booting' | 'installing' | 'starting' | 'ready' | 'healing' | 'error';

export interface ProjectState {
  files: Record<string, string>;
  description: string;
  previewUrl: string | null;
  logs: string[];
  status: RunnerStatus;
  error?: string;
}

const initial: ProjectState = {
  files: {}, description: '', previewUrl: null, logs: [], status: 'idle',
};

export function useProjectRunner() {
  const [state, setState] = useState<ProjectState>(initial);
  const healingRef = useRef(false);

  const generateAndRun = useCallback(async (prompt: string) => {
    setState((s) => ({
      ...s, status: 'generating', logs: ['Генерирую проект...'], error: undefined, previewUrl: null,
    }));

    try {
      const settings = loadSettings();

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, settings }),
      });

      const genData = await genRes.json();
      if (!genRes.ok || !genData.files) throw new Error(genData.error || 'Generation failed');

      setState((s) => ({
        ...s,
        files: genData.files,
        description: genData.description,
        status: 'booting',
        logs: [...s.logs, genData.description, 'Запускаю WebContainer...'],
      }));

      const result = await runProject(genData.files, (line) => {
        setState((s) => ({
          ...s,
          logs: [...s.logs.slice(-80), line],
          status: line.includes('npm install') ? 'installing'
            : line.includes('Starting') || line.includes('dev') ? 'starting' : s.status,
        }));
      });

      if (result.error || !result.url) {
        setState((s) => ({ ...s, status: 'error', error: result.error || 'No preview URL', logs: result.logs }));
        if (result.error && !healingRef.current) {
          await selfHeal(genData.files, result.error, result.logs.join('\n'));
        }
        return;
      }

      setState((s) => ({ ...s, previewUrl: result.url, logs: result.logs, status: 'ready' }));
    } catch (err: any) {
      setState((s) => ({ ...s, status: 'error', error: err.message || String(err) }));
    }
  }, []);

  const selfHeal = useCallback(async (
    currentFiles: Record<string, string>,
    error: string,
    fullLog: string
  ) => {
    if (healingRef.current) return;
    healingRef.current = true;

    setState((s) => ({
      ...s, status: 'healing',
      logs: [...s.logs, '🔧 Self-Healing Agent: анализирую ошибку...'],
    }));

    try {
      const settings = loadSettings();
      const res = await fetch('/api/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: currentFiles, error, log: fullLog.slice(-6000), settings }),
      });

      const data = await res.json();
      if (!data.files) {
        setState((s) => ({ ...s, status: 'error', error: data.error || 'Heal failed' }));
        return;
      }

      for (const [path, content] of Object.entries(data.files as Record<string, string>)) {
        await writeFile(path, content);
      }

      setState((s) => ({
        ...s,
        files: { ...s.files, ...data.files },
        logs: [...s.logs, data.explanation || 'Файлы исправлены, перезапускаю...'],
      }));

      const result = await runProject({ ...currentFiles, ...data.files }, (line) => {
        setState((s) => ({ ...s, logs: [...s.logs.slice(-80), line] }));
      });

      if (result.url) {
        setState((s) => ({ ...s, previewUrl: result.url, status: 'ready', error: undefined }));
      } else {
        setState((s) => ({ ...s, status: 'error', error: result.error || 'Still broken after heal' }));
      }
    } catch (err: any) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    } finally {
      healingRef.current = false;
    }
  }, []);

  return { ...state, generateAndRun };
}
