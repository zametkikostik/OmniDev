export type ValidationResult =
  | { ok: true; files: Record<string, string> }
  | { ok: false; reason: string; missing?: string[] };

const REQUIRED = [
  'package.json',
  'app/page.tsx',
  'app/layout.tsx',
  'app/globals.css',
] as const;

export function validateProjectFiles(
  files: Record<string, string> | null | undefined
): ValidationResult {
  if (!files || typeof files !== 'object') {
    return { ok: false, reason: 'Нет files в ответе LLM' };
  }

  const missing = REQUIRED.filter((p) => !files[p] || !String(files[p]).trim());
  if (missing.length) {
    return {
      ok: false,
      reason: `Не хватает файлов: ${missing.join(', ')}`,
      missing: [...missing],
    };
  }

  try {
    const pkg = JSON.parse(files['package.json']);
    if (!pkg.dependencies?.next && !pkg.dependencies?.react) {
      return { ok: false, reason: 'package.json без next/react' };
    }
  } catch {
    return { ok: false, reason: 'package.json невалидный JSON' };
  }

  return { ok: true, files };
}

export function ensureMinimalConfigs(
  files: Record<string, string>
): Record<string, string> {
  const out = { ...files };
  if (!out['tsconfig.json']) {
    out['tsconfig.json'] = JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2
    );
  }
  if (!out['next.config.ts']) {
    out['next.config.ts'] =
      "import type { NextConfig } from 'next';\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n";
  }
  if (!out['tailwind.config.ts']) {
    out['tailwind.config.ts'] =
      "import type { Config } from 'tailwindcss';\nexport default { content: ['./app/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] } satisfies Config;\n";
  }
  if (!out['postcss.config.mjs']) {
    out['postcss.config.mjs'] =
      'export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n';
  }
  if (!out['app/globals.css']) {
    out['app/globals.css'] =
      '@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { background: #09090b; color: #fafafa; }\n';
  }
  return out;
}

export function parseFilesJson(raw: string): {
  files?: Record<string, string>;
  description?: string;
  error?: string;
} {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: 'invalid JSON' };
  }
}
