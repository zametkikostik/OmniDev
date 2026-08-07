'use client';

import { useState, useRef, useEffect } from 'react';
import { loadSettings } from '@/lib/settings-store';
import { useProjectRunner } from '@/hooks/useProjectRunner';
import { ExportGitHubModal } from '@/components/ExportGitHubModal';
import { ScreenshotUpload } from '@/components/ScreenshotUpload';
import { ShareButton } from '@/components/ShareButton';
import { SignInButton } from '@/components/wallet/SignInButton';
import { FileTree } from '@/components/editor/FileTree';
import { TEMPLATES } from '@/lib/templates';
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel';
import { getActiveWorkspaceId } from '@/lib/workspace-store';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function isCreateIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('создай') ||
    lower.includes('сделай') ||
    lower.includes('create') ||
    lower.includes('build') ||
    lower.includes('приложение') ||
    lower.includes('app') ||
    lower.includes('сайт') ||
    lower.includes('landing') ||
    lower.includes('dashboard') ||
    lower.includes('saas') ||
    lower.includes('сгенерируй') ||
    lower.includes('създай') ||
    lower.includes('створи')
  );
}

function isEditIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('измени') ||
    lower.includes('поменяй') ||
    lower.includes('edit') ||
    lower.includes('change') ||
    lower.includes('добавь') ||
    lower.includes('add') ||
    lower.includes('убери') ||
    lower.includes('исправ') ||
    lower.includes('стиль')
  );
}

/** Same HTML on server and first client paint */
function BootShell() {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold">
          O
        </div>
        <p className="text-sm text-zinc-500">OmniDev</p>
      </div>
    </div>
  );
}

export default function OmniDevPage() {
  const { d, hydrated } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [wsLabel, setWsLabel] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runner = useProjectRunner();
  const prevStatus = useRef(runner.status);
  const greeted = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hydrated || greeted.current) return;
    greeted.current = true;
    setMessages([{ role: 'assistant', content: d.greeting }]);
  }, [mounted, hydrated, d.greeting]);

  useEffect(() => {
    if (getActiveWorkspaceId()) setWsLabel('team');
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, runner.logs]);

  useEffect(() => {
    if (prevStatus.current !== 'ready' && runner.status === 'ready' && runner.previewUrl) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ ${runner.description || d.statusReady}!\n\n${d.readyPreview}`,
        },
      ]);
    }
    if (prevStatus.current !== 'error' && runner.status === 'error' && runner.error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${runner.error}` },
      ]);
    }
    prevStatus.current = runner.status;
  }, [runner.status, runner.previewUrl, runner.error, runner.description, d]);

  const busy = ['generating', 'booting', 'installing', 'starting', 'healing', 'editing'].includes(
    runner.status
  );

  const statusLabel =
    runner.status === 'generating'
      ? d.statusGenerating
      : runner.status === 'booting'
        ? d.statusBooting
        : runner.status === 'installing'
          ? d.statusInstalling
          : runner.status === 'starting'
            ? d.statusStarting
            : runner.status === 'healing'
              ? d.statusHealing
              : runner.status === 'editing'
                ? d.statusEditing
                : runner.status === 'ready'
                  ? d.statusReady
                  : runner.status === 'error'
                    ? d.statusError
                    : isLoading
                      ? d.statusBusy
                      : d.statusReady;

  async function sendMessage() {
    if (!input.trim() || isLoading || busy) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const hasProject = Object.keys(runner.files).length > 0;
      if (isCreateIntent(userMsg) && !hasProject) {
        setMessages((prev) => [...prev, { role: 'assistant', content: d.generating }]);
        await runner.generateAndRun(userMsg);
      } else if (hasProject && (isEditIntent(userMsg) || !isCreateIntent(userMsg))) {
        setMessages((prev) => [...prev, { role: 'assistant', content: d.editing }]);
        await runner.editProject(userMsg);
        setMessages((prev) => [...prev, { role: 'assistant', content: d.doneHmr }]);
      } else if (isCreateIntent(userMsg)) {
        await runner.generateAndRun(userMsg);
      } else {
        const settings = loadSettings();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, settings }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'OK' }]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `${d.errorPrefix}: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const tplLabels: Record<string, string> = {
    landing: d.templates.landing,
    saas: d.templates.saas,
    dashboard: d.templates.dashboard,
    portfolio: d.templates.portfolio,
  };

  // CRITICAL: no translated strings until client mounted
  if (!mounted) {
    return <BootShell />;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="w-full md:w-[420px] flex flex-col border-r border-zinc-800">
        <header className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              O
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-lg leading-none">{d.appName}</h1>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{statusLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <LanguageSwitcher compact />
            <ScreenshotUpload
              onGenerated={async (files, description) => {
                setMessages((prev) => [
                  ...prev,
                  { role: 'assistant', content: `📷 ${description}` },
                ]);
                await runner.runFromFiles(files, description);
              }}
            />
            {Object.keys(runner.files).length > 0 && (
              <>
                <ShareButton projectId={runner.projectId} />
                <button
                  onClick={() => setShowExport(true)}
                  className="text-xs text-zinc-400 hover:text-violet-400"
                >
                  {d.github}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowWorkspace(true)}
              className="text-xs text-zinc-400 hover:text-violet-400"
            >
              {d.team}
            </button>
            <a href="/projects" className="text-xs text-zinc-400 hover:text-violet-400">
              {d.projects}
            </a>
            <a href="/settings" className="text-xs text-zinc-400 hover:text-violet-400">
              {d.settings}
            </a>
            <a href="/admin" className="text-xs text-zinc-600 hover:text-amber-400" title="ADMIN_SECRET">
              {d.admin}
            </a>
            <SignInButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {(isLoading || busy) && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-400">{statusLabel}</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-zinc-800">
          {!Object.keys(runner.files).length && (
            <div className="flex flex-wrap gap-2 mb-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setInput(tpl.seedPrompt)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-400 hover:border-violet-500/50 hover:text-violet-300"
                >
                  {tplLabels[tpl.id] || tpl.titleRu}
                </button>
              ))}
            </div>
          )}
          {wsLabel && (
            <p className="text-[11px] text-violet-400/80 mb-2">
              {d.team}: {wsLabel}
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={
                Object.keys(runner.files).length ? d.placeholderEdit : d.placeholderCreate
              }
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isLoading || busy}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || busy || !input.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl px-5 py-3 text-sm font-medium"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col bg-zinc-900">
        <div className="h-10 border-b border-zinc-800 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center text-xs text-zinc-500 truncate">
            {runner.previewUrl || d.preview}
          </div>
        </div>
        <div className="flex-1 relative flex">
          {Object.keys(runner.files).length > 0 && (
            <div className="w-52 border-r border-zinc-800 overflow-hidden flex-shrink-0 hidden lg:flex flex-col bg-zinc-950">
              <FileTree files={runner.files} />
            </div>
          )}
          <div className="flex-1 relative">
            {runner.previewUrl ? (
              <iframe
                src={runner.previewUrl}
                className="absolute inset-0 w-full h-full border-0"
                title="Preview"
                allow="cross-origin-isolated"
              />
            ) : runner.logs.length > 0 ? (
              <div className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs text-zinc-500">
                {runner.logs.slice(-40).map((line, i) => (
                  <div key={i} className="break-all">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <div className="text-5xl mb-4 opacity-30">◈</div>
                  <p className="text-sm">{d.previewEmpty}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWorkspace && (
        <WorkspacePanel
          open={showWorkspace}
          onClose={() => setShowWorkspace(false)}
          onChange={(ws) => setWsLabel(ws ? ws.name : null)}
        />
      )}
      {showExport && Object.keys(runner.files).length > 0 && (
        <ExportGitHubModal
          files={runner.files}
          defaultName="omnidev-app"
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
