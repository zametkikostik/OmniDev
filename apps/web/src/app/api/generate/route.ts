import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider, LLMConfig } from '../../../../../../packages/llm/src/provider';

const SYSTEM_PROMPT = `You are OmniDev, an expert full-stack engineer.
Generate a complete, production-ready Next.js 15 (App Router) + TypeScript + Tailwind CSS project.

Rules:
1. Return ONLY valid JSON with this exact shape:
{
  "files": {
    "package.json": "...",
    "tsconfig.json": "...",
    "next.config.ts": "...",
    "tailwind.config.ts": "...",
    "postcss.config.mjs": "...",
    "app/layout.tsx": "...",
    "app/page.tsx": "...",
    "app/globals.css": "..."
  },
  "description": "short description in Russian of what was built"
}
2. package.json must include: next, react, react-dom, typescript, tailwindcss, postcss, autoprefixer, lucide-react, clsx, tailwind-merge
3. Use App Router only. Modern, clean code. Dark-themed UI by default.
4. Include all config files so npm install && npm run dev works immediately.
5. Do not wrap the JSON in markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, settings } = body as { prompt: string; settings?: any };

    if (!prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }

    const llmConfig = buildConfig(settings);

    if ((llmConfig.provider === 'openrouter' || llmConfig.provider === 'openai') && !llmConfig.apiKey) {
      return NextResponse.json({
        files: getDemoProject(prompt),
        description: `Демо-проект (добавь OpenRouter ключ в Настройках для полной генерации): ${prompt}`,
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

function buildConfig(s?: any): LLMConfig {
  if (!s) return { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' };
  switch (s.activeProvider) {
    case 'ollama':
      return { provider: 'ollama', baseURL: `${(s.ollamaBaseURL || 'http://localhost:11434').replace(/\/$/, '')}/v1`, model: s.ollamaModel || 'llama3.1', apiKey: 'ollama' };
    case 'openai':
      return { provider: 'openai', apiKey: s.openaiKey, model: 'gpt-4o' };
    case 'custom':
      return { provider: 'custom', baseURL: s.customBaseURL, model: s.customModel, apiKey: s.customKey };
    default:
      return { provider: 'openrouter', apiKey: s.openRouterKey, model: s.openRouterModel || 'anthropic/claude-3.5-sonnet' };
  }
}

function getDemoProject(prompt: string): Record<string, string> {
  const safe = prompt.replace(/"/g, "'").slice(0, 120);
  return {
    'package.json': JSON.stringify({
      name: 'omnidev-demo', version: '0.1.0', private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '15.0.0', react: '19.0.0', 'react-dom': '19.0.0', 'lucide-react': '^0.400.0' },
      devDependencies: { typescript: '^5.6.0', '@types/react': '^19.0.0', '@types/node': '^22.0.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
    }, null, 2),
    'tsconfig.json': JSON.stringify({
      compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'], exclude: ['node_modules'],
    }, null, 2),
    'next.config.ts': "import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n",
    'tailwind.config.ts': "import type { Config } from 'tailwindcss';\nconst config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] };\nexport default config;\n",
    'postcss.config.mjs': "/** @type {import('postcss-load-config').Config} */\nconst config = { plugins: { tailwindcss: {}, autoprefixer: {} } };\nexport default config;\n",
    'app/globals.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { background: #09090b; color: #fafafa; }\n',
    'app/layout.tsx': "import type { Metadata } from 'next';\nimport './globals.css';\n\nexport const metadata: Metadata = { title: 'OmniDev Demo', description: 'Generated by OmniDev' };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang=\"ru\"><body>{children}</body></html>);\n}\n",
    'app/page.tsx': `'use client';\n\nexport default function Home() {\n  return (\n    <main className="min-h-screen flex items-center justify-center p-8">\n      <div className="max-w-lg text-center">\n        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">OmniDev Demo</h1>\n        <p className="text-zinc-400 mb-6">Запрос: «${safe}»</p>\n        <p className="text-sm text-zinc-600">Добавь OpenRouter API Key в Настройках — и я сгенерирую полноценное приложение.</p>\n      </div>\n    </main>\n  );\n}\n`,
  };
}
