'use client';

import { useRef, useState } from 'react';
import { loadSettings } from '@/lib/settings-store';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  onGenerated: (files: Record<string, string>, description: string) => void | Promise<void>;
}

export function ScreenshotUpload({ onGenerated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { d, hydrated } = useI18n();

  const labelIdle = hydrated ? d.screenshot || '📷 Screen' : '📷 Screen';
  const labelBusy = hydrated ? d.analyzing || 'Analyzing...' : 'Analyzing...';

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Image file required');
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
          prompt:
            'Make a pixel-perfect React + Tailwind + Next.js App Router implementation. Include package.json, layout, page, globals.css so the project runs.',
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Vision API error');
        return;
      }

      const files = ensureRunnable(data.files || {});
      await onGenerated(files, data.description || 'UI from screenshot');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-xs text-zinc-400 hover:text-violet-400 transition disabled:opacity-50"
        title="Screenshot → code"
        suppressHydrationWarning
      >
        {loading ? labelBusy : labelIdle}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 mt-1 max-w-[120px]" suppressHydrationWarning>
          {error}
        </p>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result || '');
      const b64 = r.includes(',') ? r.split(',')[1] : r;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ensureRunnable(files: Record<string, string>): Record<string, string> {
  const out = { ...files };

  if (!out['package.json']) {
    out['package.json'] = JSON.stringify(
      {
        name: 'omnidev-vision',
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: {
          next: '15.0.0',
          react: '19.0.0',
          'react-dom': '19.0.0',
        },
        devDependencies: {
          typescript: '^5.6.0',
          '@types/react': '^19.0.0',
          '@types/node': '^22.0.0',
          tailwindcss: '^3.4.0',
          postcss: '^8.4.0',
          autoprefixer: '^10.4.0',
        },
      },
      null,
      2
    );
  }

  if (!out['app/globals.css']) {
    out['app/globals.css'] =
      '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody{background:#09090b;color:#fafafa}\n';
  }

  if (!out['app/layout.tsx']) {
    out['app/layout.tsx'] = `import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
`;
  }

  if (!out['app/page.tsx']) {
    const componentFile = Object.keys(out).find(
      (k) => k.endsWith('.tsx') && k.includes('component')
    );
    if (componentFile) {
      out['app/page.tsx'] = `'use client';
import Component from '../${componentFile.replace(/\.tsx$/, '')}';
export default function Page() { return <Component />; }
`;
    } else {
      out['app/page.tsx'] = `'use client';
export default function Page() {
  return <main className="min-h-screen p-8"><h1 className="text-2xl font-bold">Generated from screenshot</h1></main>;
}
`;
    }
  }

  return out;
}
