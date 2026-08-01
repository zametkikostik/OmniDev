'use client';

import { useRef, useState } from 'react';
import { loadSettings } from '@/lib/settings-store';

interface Props {
  onGenerated: (files: Record<string, string>, description: string) => void | Promise<void>;
}

export function ScreenshotUpload({ onGenerated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Нужен файл изображения');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      const settings = loadSettings();
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
          prompt: 'Сделай pixel-perfect React + Tailwind + Next.js App Router. Включи package.json, layout, page, globals.css.',
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Ошибка vision API');
        return;
      }
      const files = ensureRunnable(data.files || {});
      await onGenerated(files, data.description || 'UI по скриншоту');
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        className="text-xs text-zinc-400 hover:text-violet-400 transition disabled:opacity-50">
        {loading ? 'Анализирую...' : '📷 Скрин'}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-1 max-w-[120px]">{error}</p>}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || (reader.result as string));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ensureRunnable(files: Record<string, string>): Record<string, string> {
  const out = { ...files };
  if (!out['package.json']) {
    out['package.json'] = JSON.stringify({
      name: 'omnidev-vision', version: '0.1.0', private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '15.0.0', react: '19.0.0', 'react-dom': '19.0.0', 'lucide-react': '^0.400.0' },
      devDependencies: { typescript: '^5.6.0', '@types/react': '^19.0.0', '@types/node': '^22.0.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
    }, null, 2);
  }
  if (!out['tsconfig.json']) {
    out['tsconfig.json'] = JSON.stringify({
      compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'], exclude: ['node_modules'],
    }, null, 2);
  }
  if (!out['next.config.ts'] && !out['next.config.js']) {
    out['next.config.ts'] = "import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n";
  }
  if (!out['tailwind.config.ts']) {
    out['tailwind.config.ts'] = "import type { Config } from 'tailwindcss';\nconst config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] };\nexport default config;\n";
  }
  if (!out['postcss.config.mjs']) {
    out['postcss.config.mjs'] = "const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };\nexport default config;\n";
  }
  if (!out['app/globals.css']) {
    out['app/globals.css'] = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { margin: 0; }\n';
  }
  if (!out['app/layout.tsx']) {
    out['app/layout.tsx'] = "import type { Metadata } from 'next';\nimport './globals.css';\nexport const metadata: Metadata = { title: 'OmniDev Vision' };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang=\"ru\"><body>{children}</body></html>;\n}\n";
  }
  if (!out['app/page.tsx']) {
    out['app/page.tsx'] = "'use client';\nexport default function Page() {\n  return <main className=\"min-h-screen p-8\"><h1 className=\"text-2xl font-bold\">Generated from screenshot</h1></main>;\n}\n";
  }
  return out;
}
