import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync, getClientIp } from '@/lib/redis-rate-limit';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';
import { moderatePrompt } from '@/lib/prompt-guard';
import { audit } from '@/lib/audit-log';
import { creditsFor } from '@/lib/usage-billing';
import { db } from '@/lib/db';
import { CREDIT_COSTS } from '@/lib/credits';
import {
  validateProjectFiles,
  ensureMinimalConfigs,
  parseFilesJson,
} from '@/lib/project-validate';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are OmniDev, an expert full-stack engineer.
Generate a complete Next.js 15 (App Router) + TypeScript + Tailwind CSS project.

Rules:
1. Return ONLY valid JSON:
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
  "description": "short description"
}
2. package.json must include next, react, react-dom, typescript, tailwindcss, postcss, autoprefixer, lucide-react
3. App Router only. Dark UI. No markdown fences.`;

const FIX_PROMPT = `Fix the project JSON. Missing or invalid files were reported.
Return ONLY valid JSON { "files": { ... }, "description": "..." } with ALL required files:
package.json, app/page.tsx, app/layout.tsx, app/globals.css, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs
No markdown.`;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimitAsync(`gen:${ip}`, 20, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { prompt, settings, address } = body as {
      prompt: string;
      settings?: any;
      address?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    }

    const guard = moderatePrompt(prompt);
    if (!guard.ok) {
      audit('moderation', guard.code || 'block', {
        ip,
        meta: { reason: guard.reason, soft: !!guard.soft, preview: prompt.slice(0, 80) },
      });
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }
    audit('generate', 'start', { ip, meta: { len: prompt.length } });

    const llmConfig = buildLLMConfig(settings);

    if (needsApiKey(llmConfig)) {
      return NextResponse.json({
        files: getDemoProject(prompt),
        description: `Демо-режим: ${prompt}`,
        demo: true,
      });
    }

    const provider = createLLMProvider(llmConfig);

    async function runOnce(system: string, user: string) {
      const raw = await provider.complete({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        json: true,
        temperature: 0.2,
        maxTokens: 12000,
      });
      return parseFilesJson(raw);
    }

    let parsed = await runOnce(SYSTEM_PROMPT, `Создай приложение: ${prompt}`);
    let healAttempts = 0;

    if (parsed.error || !parsed.files) {
      healAttempts++;
      audit('generate', 'retry_json', { ip });
      parsed = await runOnce(
        FIX_PROMPT,
        `Original request: ${prompt}\nPrevious error: invalid JSON. Produce complete project JSON.`
      );
    }

    let files = parsed.files || {};
    files = ensureMinimalConfigs(files);
    let validation = validateProjectFiles(files);

    if (!validation.ok) {
      healAttempts++;
      audit('generate', 'retry_validate', {
        ip,
        meta: { reason: validation.reason },
      });
      parsed = await runOnce(
        FIX_PROMPT,
        `Original: ${prompt}\nValidation failed: ${validation.reason}\nMissing: ${(validation as any).missing?.join(', ') || ''}`
      );
      files = ensureMinimalConfigs(parsed.files || {});
      validation = validateProjectFiles(files);
    }

    if (!validation.ok) {
      audit('generate', 'fail_validate', { ip, meta: { reason: validation.reason } });
      return NextResponse.json(
        { error: validation.reason, healAttempts },
        { status: 500 }
      );
    }

    let creditsLeft: number | undefined;
    let charged = 0;
    if (address) {
      try {
        const user = await db.getOrCreateUserByWallet(address);
        const cost = creditsFor('generate');
        const ded = await db.deductCredits(user.id, cost);
        if (ded.ok) {
          charged = cost;
          await db.recordUsage(user.id, 'generate', cost);
          creditsLeft = ded.credits;
        } else {
          creditsLeft = ded.credits;
        }
      } catch (e) {
        console.warn('[generate] usage', e);
      }
    }

    audit('generate', 'success', {
      ip,
      meta: { healAttempts, charged, files: Object.keys(files).length },
    });

    return NextResponse.json({
      files,
      description: parsed.description || 'Проект создан',
      demo: false,
      credits: creditsLeft,
      cost: charged || CREDIT_COSTS.generate,
      charged,
      healAttempts,
    });
  } catch (err: any) {
    console.error('[generate]', err);
    return NextResponse.json(
      { error: err.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function getDemoProject(prompt: string): Record<string, string> {
  const safe = prompt.replace(/"/g, "'").slice(0, 120);
  return ensureMinimalConfigs({
    'package.json': JSON.stringify(
      {
        name: 'omnidev-demo',
        version: '0.1.0',
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: {
          next: '15.0.0',
          react: '19.0.0',
          'react-dom': '19.0.0',
          'lucide-react': '^0.400.0',
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
    ),
    'app/layout.tsx': `import './globals.css';\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang="en"><body>{children}</body></html>);\n}\n`,
    'app/page.tsx': `'use client';\nexport default function Home() {\n  return (\n    <main className="min-h-screen flex items-center justify-center p-8">\n      <div className="max-w-lg text-center">\n        <h1 className="text-4xl font-bold mb-4 text-violet-400">OmniDev Demo</h1>\n        <p className="text-zinc-400">«${safe}»</p>\n      </div>\n    </main>\n  );\n}\n`,
  });
}
