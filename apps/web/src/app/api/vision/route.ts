import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, prompt, settings } = body as {
      imageBase64?: string;
      prompt?: string;
      settings?: any;
    };

    const llmConfig = buildLLMConfig(settings);
    if (needsApiKey(llmConfig)) {
      return NextResponse.json({
        files: demoVision(prompt || 'UI from screenshot'),
        description: 'Демо vision (добавь API key)',
        demo: true,
      });
    }

    const provider = createLLMProvider(llmConfig);
    // Text-only fallback if multimodal not supported by OpenAI-compat path
    const userContent = imageBase64
      ? `Screenshot (base64 length ${imageBase64.length}). Build Next.js UI matching it. ${prompt || ''}`
      : prompt || 'Build a modern landing page';

    const raw = await provider.complete({
      messages: [
        {
          role: 'system',
          content: `Return ONLY JSON { "files": { path: content }, "description": "ru" } for a Next.js 15 + Tailwind app.`,
        },
        { role: 'user', content: userContent },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 12000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({
      files: parsed.files,
      description: parsed.description || 'From screenshot',
      demo: false,
    });
  } catch (err: any) {
    console.error('[vision]', err);
    return NextResponse.json({ error: err.message || 'Vision failed' }, { status: 500 });
  }
}

function demoVision(prompt: string): Record<string, string> {
  return {
    'package.json': JSON.stringify({
      name: 'omnidev-vision-demo', version: '0.1.0', private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '15.0.0', react: '19.0.0', 'react-dom': '19.0.0' },
      devDependencies: { typescript: '^5.6.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
    }, null, 2),
    'app/page.tsx': `'use client';\nexport default function Page() {\n  return <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center"><h1 className="text-3xl">Vision demo: ${prompt.slice(0, 80)}</h1></main>;\n}\n`,
    'app/layout.tsx': `export default function RootLayout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n`,
    'app/globals.css': '@tailwind base;@tailwind components;@tailwind utilities;',
  };
}
