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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMClient {
  /**
   * Send a prompt and receive a structured response with file patches.
   * Implementations can use OpenAI, Anthropic, Grok, etc.
   */
  complete(prompt: string): Promise<LLMResponse>;
}

export interface LLMResponse {
  /** Map of relative file path → new full content */
  files: Record<string, string>;
  /** Optional natural-language explanation (shown to user in chat) */
  explanation?: string;
  /** true if the model believes the error is unfixable without more context */
  giveUp?: boolean;
}

export interface AgentOptions {
  /** Maximum number of self-heal iterations before giving up */
  maxIterations?: number;
  /** Files that the agent is allowed to modify (security) */
  allowedPaths?: string[];
  /** Callback for progress / status updates */
  onStatus?: (status: AgentStatus) => void;
  /** Callback when a file is rewritten */
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

// ---------------------------------------------------------------------------
// SelfHealingAgent
// ---------------------------------------------------------------------------

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

  /**
   * Start the self-healing loop.
   * Call this after the initial project files are written and the first build is started.
   */
  async start(initialCommand = 'npm run dev'): Promise<void> {
    if (this.isRunning) {
      throw new Error('SelfHealingAgent is already running');
    }
    this.isRunning = true;
    this.currentIteration = 0;
    this.options.onStatus({ type: 'watching' });

    // Spawn the process and attach error listeners
    const process = await this.container.spawn('jsh', ['-c', initialCommand], {
      // We want to capture both stdout and stderr
    });

    let buffer = '';

    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          buffer += data;
          this.detectAndHandleError(buffer);
        },
      })
    );

    // Also listen for process exit (crash)
    process.exit.then((code) => {
      if (code !== 0 && this.isRunning) {
        this.handleError(`Process exited with code ${code}\n\n${buffer}`);
      }
    });
  }

  /**
   * Manually feed an error string (useful for unit tests or external triggers)
   */
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
      // 1. Collect relevant source files that appear in the stack trace
      const relevantFiles = await this.collectRelevantFiles(errorLog);

      // 2. Build the LLM prompt
      const prompt = this.buildFixPrompt(errorLog, relevantFiles);

      this.options.onStatus({ type: 'asking_llm', iteration: this.currentIteration });

      // 3. Ask the LLM
      const response = await this.llm.complete(prompt);

      if (response.giveUp) {
        this.fail('LLM indicated the error cannot be fixed automatically', errorLog);
        return;
      }

      // 4. Apply the patches
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

      // 5. The WebContainer will automatically pick up the file changes
      //    and Vite/Next.js HMR or the next build cycle will re-run.
      //    We simply keep watching.

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.fail(`Agent internal error: ${message}`, errorLog);
    }
  }

  stop(): void {
    this.isRunning = false;
    this.options.onStatus({ type: 'idle' });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async detectAndHandleError(buffer: string): Promise<void> {
    // Simple heuristic: look for common error signatures
    const errorPatterns = [
      /error\s+TS\d+/i,           // TypeScript
      /Error:/,                   // generic
      /Failed to compile/,        // Vite / Next
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
      // Debounce a little so we get a fuller log
      // In production you would use a proper stream parser
      await this.handleError(buffer.slice(-8000)); // last 8k chars
    }
  }

  private async collectRelevantFiles(errorLog: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    // Extract file paths that look like source files from the error
    const pathRegex = /(?:at\s+)?(?:file:\/\/)?([./\w-]+\.(?:ts|tsx|js|jsx|css|json))/g;
    const matches = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(errorLog)) !== null) {
      matches.add(m[1].replace(/^\.\//, ''));
    }

    // Always include package.json and main config files
    const always = ['package.json', 'tsconfig.json', 'vite.config.ts', 'next.config.ts', 'next.config.js'];
    always.forEach((p) => matches.add(p));

    for (const relPath of matches) {
      if (!this.isPathAllowed(relPath) && !always.includes(relPath)) continue;
      try {
        const content = await this.container.fs.readFile(relPath, 'utf-8');
        files[relPath] = content;
      } catch {
        // file may not exist yet – ignore
      }
    }

    return files;
  }

  private buildFixPrompt(
    errorLog: string,
    files: Record<string, string>
  ): string {
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
    "path/to/file.tsx": "full new content of the file",
    ...
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
    // Simple prefix check – can be made more sophisticated with micromatch
    return this.options.allowedPaths.some(
      (prefix) => path.startsWith(prefix) || path === prefix.replace(/\/$/, '')
    ) || ['package.json', 'tsconfig.json', 'vite.config.ts', 'next.config.ts', 'next.config.js'].includes(path);
  }

  private fail(reason: string, lastError: string): void {
    this.isRunning = false;
    this.options.onStatus({ type: 'failed', reason, lastError });
  }
}

// ---------------------------------------------------------------------------
// Example LLM adapter (OpenAI-compatible)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Usage example (pseudo)
// ---------------------------------------------------------------------------
/*
import { WebContainer } from '@webcontainer/api';
import { SelfHealingAgent, OpenAICompatibleLLM } from './self-healing-agent';

const container = await WebContainer.boot();
// ... write initial files ...

const llm = new OpenAICompatibleLLM(process.env.OPENAI_API_KEY!);
const agent = new SelfHealingAgent(container, llm, {
  maxIterations: 6,
  onStatus: (s) => console.log('[Agent]', s),
});

await agent.start('npm install && npm run dev');
*/
