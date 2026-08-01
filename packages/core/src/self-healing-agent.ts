/**
 * OmniDev — Self-Healing AI Agent
 * 
 * Core autonomous loop that:
 * 1. Watches WebContainer terminal for build/runtime errors
 * 2. Captures error context + relevant source files
 * 3. Asks the LLM to fix the code
 * 4. Writes the fixed files back into the container
 * 5. Retries the build until success or max iterations
 *
 * Inspired by Replit Agent, engineered for production reliability.
 */

import type { WebContainer } from '@webcontainer/api';

export interface LLMClient {
  complete(prompt: string): Promise<LLMResponse>;
}

export interface LLMResponse {
  files: Record<string, string>;
  explanation?: string;
  giveUp?: boolean;
}

export interface AgentOptions {
  maxIterations?: number;
  allowedPaths?: string[];
  onStatus?: (status: AgentStatus) => void;
  onFileRewrite?: (path: string, content: string) => void;
}

export type AgentStatus =
  | { type: 'idle' }
  | { type: 'watching' }
  | { type: 'error_detected'; error: string }
  | { type: 'asking_llm'; iteration: number }
  | { type: 'applying_fix'; files: string[] }
  | { type: 'retrying_build'; iteration: number }
  | { type: 'success' }
  | { type: 'failed'; reason: string; lastError: string };

export class SelfHealingAgent {
  private container: WebContainer;
  private llm: LLMClient;
  private options: Required<AgentOptions>;
  private isRunning = false;
  private currentIteration = 0;
  private lastError = '';

  constructor(
    container: WebContainer,
    llm: LLMClient,
    options: AgentOptions = {}
  ) {
    this.container = container;
    this.llm = llm;
    this.options = {
      maxIterations: options.maxIterations ?? 8,
      allowedPaths: options.allowedPaths ?? ['src/', 'app/', 'components/', 'lib/', 'prisma/'],
      onStatus: options.onStatus ?? (() => {}),
      onFileRewrite: options.onFileRewrite ?? (() => {}),
    };
  }

  async start(initialCommand = 'npm run dev'): Promise<void> {
    if (this.isRunning) {
      throw new Error('SelfHealingAgent is already running');
    }
    this.isRunning = true;
    this.currentIteration = 0;
    this.options.onStatus({ type: 'watching' });

    const process = await this.container.spawn('jsh', ['-c', initialCommand]);

    let buffer = '';

    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          buffer += data;
          this.detectAndHandleError(buffer);
        },
      })
    );

    process.exit.then((code) => {
      if (code !== 0 && this.isRunning) {
        this.handleError(`Process exited with code ${code}\n\n${buffer}`);
      }
    });
  }

  async handleError(errorLog: string): Promise<void> {
    if (!this.isRunning) return;
    if (this.currentIteration >= this.options.maxIterations) {
      this.fail('Max iterations reached', errorLog);
      return;
    }

    this.currentIteration += 1;
    this.lastError = errorLog;
    this.options.onStatus({ type: 'error_detected', error: errorLog });

    try {
      const relevantFiles = await this.collectRelevantFiles(errorLog);
      const prompt = this.buildFixPrompt(errorLog, relevantFiles);

      this.options.onStatus({ type: 'asking_llm', iteration: this.currentIteration });

      const response = await this.llm.complete(prompt);

      if (response.giveUp) {
        this.fail('LLM indicated the error cannot be fixed automatically', errorLog);
        return;
      }

      const written: string[] = [];
      for (const [path, content] of Object.entries(response.files)) {
        if (!this.isPathAllowed(path)) {
          console.warn(`[SelfHealingAgent] Skipping disallowed path: ${path}`);
          continue;
        }
        await this.container.fs.writeFile(path, content);
        this.options.onFileRewrite(path, content);
        written.push(path);
      }

      this.options.onStatus({ type: 'applying_fix', files: written });
      this.options.onStatus({ type: 'retrying_build', iteration: this.currentIteration });

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.fail(`Agent internal error: ${message}`, errorLog);
    }
  }

  stop(): void {
    this.isRunning = false;
    this.options.onStatus({ type: 'idle' });
  }

  private async detectAndHandleError(buffer: string): Promise<void> {
    const errorPatterns = [
      /error\s+TS\d+/i,
      /Error:/,
      /Failed to compile/,
      /Module not found/,
      /Cannot find module/,
      /SyntaxError/,
      /TypeError/,
      /ReferenceError/,
      /ENOENT/,
      /npm ERR!/,
    ];

    const hasError = errorPatterns.some((re) => re.test(buffer));
    if (hasError && !buffer.includes('compiled successfully')) {
      await this.handleError(buffer.slice(-8000));
    }
  }

  private async collectRelevantFiles(errorLog: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    const pathRegex = /(?:at\s+)?(?:file:\/\/)?([./\w-]+\.(?:ts|tsx|js|jsx|css|json))/g;
    const matches = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(errorLog)) !== null) {
      matches.add(m[1].replace(/^\.\//, ''));
    }

    const always = ['package.json', 'tsconfig.json', 'vite.config.ts', 'next.config.ts', 'next.config.js'];
    always.forEach((p) => matches.add(p));

    for (const relPath of matches) {
      if (!this.isPathAllowed(relPath) && !always.includes(relPath)) continue;
      try {
        const content = await this.container.fs.readFile(relPath, 'utf-8');
        files[relPath] = content;
      } catch {
        // ignore
      }
    }

    return files;
  }

  private buildFixPrompt(errorLog: string, files: Record<string, string>): string {
    const fileBlocks = Object.entries(files)
      .map(([path, content]) => `### FILE: ${path}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    return `You are an expert full-stack engineer working inside OmniDev.
Your only job is to fix the following build/runtime error by rewriting the necessary files.

## Error Log
\`\`\`
${errorLog.slice(-6000)}
\`\`\`

## Current Project Files
${fileBlocks}

## Instructions
1. Analyse the error carefully.
2. Return ONLY the files that need to be changed.
3. Output a valid JSON object with this exact shape:
{
  "files": {
    "path/to/file.tsx": "full new content of the file"
  },
  "explanation": "short human-readable summary of what you fixed",
  "giveUp": false
}
4. Do not invent new files unless absolutely required.
5. Keep the existing architecture and coding style.
6. Prefer minimal, surgical fixes.

Respond with pure JSON only.`;
  }

  private isPathAllowed(path: string): boolean {
    return this.options.allowedPaths.some(
      (prefix) => path.startsWith(prefix) || path === prefix.replace(/\/$/, '')
    ) || ['package.json', 'tsconfig.json', 'vite.config.ts', 'next.config.ts', 'next.config.js'].includes(path);
  }

  private fail(reason: string, lastError: string): void {
    this.isRunning = false;
    this.options.onStatus({ type: 'failed', reason, lastError });
  }
}

export class OpenAICompatibleLLM implements LLMClient {
  constructor(
    private apiKey: string,
    private baseURL = 'https://api.openai.com/v1',
    private model = 'gpt-4o'
  ) {}

  async complete(prompt: string): Promise<LLMResponse> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a precise code-fixing engine. Always reply with pure JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');

    return JSON.parse(content) as LLMResponse;
  }
}
