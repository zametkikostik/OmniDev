import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync, getClientIp } from '@/lib/redis-rate-limit';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';
import { moderatePrompt } from '@/lib/prompt-guard';

const SYSTEM_PROMPT = `You are OmniDev, an expert full-stack engineer.
Generate a complete Next.js 15 (App Router) + TypeScript + Tailwind CSS project.
Return ONLY valid JSON:
{
  "files": { "package.json": "...", "app/page.tsx": "...", ... },
  "description": "short Russian description"
}
Include package.json, tsconfig, next.config, tailwind, postcss, app/layout, app/page, app/globals.css.
Dark UI by default. No markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimitAsync(`gen:${ip}`, 20, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, settings } = body as { prompt: string; settings?: any };
    if (!prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }

    const guard = moderatePrompt(prompt);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }

    const llmConfig = buildLLMConfig(settings);

    if (needsApiKey(llmConfig)) {
      return NextResponse.json({
        files: getDemoProject(prompt),
        description: `Демо-режим (платформа ещё без API-ключа админа): ${prompt}`,
        demo: true,
      });
    }

    const provider = createLLMProvider(llmConfig);
    const raw = await provider.complete({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Создай приложение: ${prompt}` },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 12000,
    });

    let parsed: { files: Record<string, string>; description: string };
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'LLM returned invalid JSON', raw: raw.slice(0, 500) }, { status: 500 });
    }

    if (!parsed.files || !parsed.files['package.json']) {
      return NextResponse.json({ error: 'Generated project is incomplete' }, { status: 500 });
    }

    return NextResponse.json({
      files: parsed.files,
      description: parsed.description || 'Проект создан',
      demo: false,
    });
  } catch (err: any) {
    console.error('[generate]', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}

function getDemoProject(prompt: string): Record<string, string> {
  const safe = prompt.replace(/"/g, "'").slice(0, 120);
  return {
    'package.json': JSON.stringify({
      name: 'omnidev-demo', version: '0.1.0', private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '15.0.0', react: '19.0.0', 'react-dom': '19.0.0', 'lucide-react': '^0.400.0' },
      devDependencies: {
        typescript: '^5.6.0', '@types/react': '^19.0.0', '@types/node': '^22.0.0',
        tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0',
      },
    }, null, 2),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true,
        strict: true, noEmit: true, esModuleInterop: true, module: 'esnext',
        moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true,
        jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'], exclude: ['node_modules'],
    }, null, 2),
    'next.config.ts': "import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n",
    'tailwind.config.ts': "import type { Config } from 'tailwindcss';\nexport default { content: ['./app/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] } satisfies Config;\n",
    'postcss.config.mjs': "export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n",
    'app/globals.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { background: #09090b; color: #fafafa; }\n',
    'app/layout.tsx': "import './globals.css';\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang=\"ru\"><body>{children}</body></html>);\n}\n",
    'app/page.tsx': `'use client';\nexport default function Home() {\n  return (\n    <main className="min-h-screen flex items-center justify-center p-8">\n      <div className="max-w-lg text-center">\n        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">OmniDev Demo</h1>\n        <p className="text-zinc-400 mb-6">Запрос: «${safe}»</p>\n        <p className="text-sm text-zinc-600">Полная генерация включится после настройки платформы администратором.</p>\n      </div>\n    </main>\n  );\n}\n`,
  };
}
