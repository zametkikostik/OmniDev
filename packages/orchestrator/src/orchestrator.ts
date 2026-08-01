/**
 * OmniDev LLM Orchestrator
 * 
 * Central brain that:
 * - Classifies user intent
 * - Routes to the correct engine (UI Gen / DB Gen / Agent / Web3)
 * - Maintains conversation + project state
 * - Coordinates the Self-Healing Agent
 */

import type { SelfHealingAgent } from '../../core/src/self-healing-agent';
import type { WebContainerManager } from '../../webcontainer/src/manager';

export type Intent =
  | 'create_app'
  | 'edit_ui'
  | 'add_feature'
  | 'fix_error'
  | 'generate_db'
  | 'add_web3'
  | 'explain'
  | 'unknown';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ProjectState {
  files: Record<string, string>;
  packageJson: any;
  previewUrl?: string;
  lastError?: string;
}

export interface OrchestratorOptions {
  llm: {
    complete: (prompt: string) => Promise<string>;
    completeJson: <T>(prompt: string) => Promise<T>;
  };
  webcontainer: WebContainerManager;
  agent: SelfHealingAgent;
  onMessage?: (msg: Message) => void;
  onProjectUpdate?: (state: ProjectState) => void;
}

export class Orchestrator {
  private history: Message[] = [];
  private project: ProjectState = { files: {}, packageJson: {} };
  private options: OrchestratorOptions;

  constructor(options: OrchestratorOptions) {
    this.options = options;
  }

  async handleUserMessage(text: string): Promise<string> {
    this.push({ role: 'user', content: text });

    const intent = await this.classifyIntent(text);

    let response = '';

    switch (intent) {
      case 'create_app':
        response = await this.handleCreateApp(text);
        break;
      case 'edit_ui':
      case 'add_feature':
        response = await this.handleEdit(text);
        break;
      case 'generate_db':
        response = await this.handleGenerateDb(text);
        break;
      case 'add_web3':
        response = await this.handleAddWeb3(text);
        break;
      case 'fix_error':
        response = await this.handleFix();
        break;
      default:
        response = await this.handleGeneric(text);
    }

    this.push({ role: 'assistant', content: response });
    return response;
  }

  private async classifyIntent(text: string): Promise<Intent> {
    const prompt = `Classify the user request into one of these intents:
- create_app
- edit_ui
- add_feature
- fix_error
- generate_db
- add_web3
- explain
- unknown

User message: "${text}"

Reply with only the intent name.`;

    const result = await this.options.llm.complete(prompt);
    const cleaned = result.trim().toLowerCase() as Intent;
    const valid: Intent[] = [
      'create_app', 'edit_ui', 'add_feature', 'fix_error',
      'generate_db', 'add_web3', 'explain', 'unknown'
    ];
    return valid.includes(cleaned) ? cleaned : 'unknown';
  }

  private async handleCreateApp(text: string): Promise<string> {
    const scaffoldPrompt = `You are OmniDev. Generate a complete Next.js + Tailwind + TypeScript project based on this request:

"${text}"

Return a JSON object:
{
  "files": {
    "package.json": "...",
    "app/page.tsx": "...",
    "app/layout.tsx": "...",
    "app/globals.css": "...",
    "tailwind.config.ts": "...",
    "tsconfig.json": "...",
    "next.config.ts": "..."
  },
  "description": "short description of what was created"
}

Use modern App Router, Shadcn-style components, Lucide icons. Keep it clean and production-ready.`;

    const result = await this.options.llm.completeJson<{
      files: Record<string, string>;
      description: string;
    }>(scaffoldPrompt);

    this.project.files = result.files;
    try {
      this.project.packageJson = JSON.parse(result.files['package.json'] || '{}');
    } catch {}

    await this.bootProject();

    this.options.onProjectUpdate?.(this.project);

    return `✅ Приложение создано!\n\n${result.description}\n\nПревью уже запускается...`;
  }

  private async handleEdit(text: string): Promise<string> {
    const editPrompt = `You are editing an existing project. Current files:

${Object.entries(this.project.files)
  .map(([p, c]) => `### ${p}\n\`\`\`\n${c.slice(0, 3000)}\n\`\`\``)
  .join('\n\n')}

User request: "${text}"

Return JSON:
{
  "files": {
    "path/to/changed/file.tsx": "full new content"
  },
  "explanation": "what you changed"
}

Only return files that actually need to change. Keep the rest of the app intact.`;

    const result = await this.options.llm.completeJson<{
      files: Record<string, string>;
      explanation: string;
    }>(editPrompt);

    for (const [path, content] of Object.entries(result.files)) {
      this.project.files[path] = content;
      await this.options.webcontainer.writeFile(path, content);
    }

    this.options.onProjectUpdate?.(this.project);

    return `✏️ ${result.explanation}`;
  }

  private async handleGenerateDb(text: string): Promise<string> {
    const dbPrompt = `Generate a Prisma schema + basic API routes for this request:

"${text}"

Return JSON:
{
  "files": {
    "prisma/schema.prisma": "...",
    "app/api/...": "..."
  },
  "explanation": "..."
}`;

    const result = await this.options.llm.completeJson<{
      files: Record<string, string>;
      explanation: string;
    }>(dbPrompt);

    for (const [path, content] of Object.entries(result.files)) {
      this.project.files[path] = content;
      await this.options.webcontainer.writeFile(path, content);
    }

    this.options.onProjectUpdate?.(this.project);
    return `🗄️ ${result.explanation}`;
  }

  private async handleAddWeb3(text: string): Promise<string> {
    const web3Files: Record<string, string> = {
      'lib/wagmi.ts': `import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
`,
      'components/WalletButton.tsx': `'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButton() {
  return <ConnectButton />
}
`,
    };

    for (const [path, content] of Object.entries(web3Files)) {
      this.project.files[path] = content;
      await this.options.webcontainer.writeFile(path, content);
    }

    this.options.onProjectUpdate?.(this.project);

    return `🔗 Web3 (wagmi + RainbowKit) добавлен. Используй <WalletButton /> в любом компоненте.`;
  }

  private async handleFix(): Promise<string> {
    if (this.project.lastError) {
      await this.options.agent.handleError(this.project.lastError);
      return '🔧 Агент исправляет ошибки...';
    }
    return 'Ошибок не обнаружено.';
  }

  private async handleGeneric(text: string): Promise<string> {
    const prompt = `You are OmniDev assistant. User said: "${text}"
Respond helpfully in Russian. Be concise.`;
    return await this.options.llm.complete(prompt);
  }

  private async bootProject(): Promise<void> {
    const { filesToTree } = await import('../../webcontainer/src/manager');
    const tree = filesToTree(this.project.files);
    await this.options.webcontainer.mount(tree);

    try {
      const { url } = await this.options.webcontainer.startDevServer();
      this.project.previewUrl = url;
    } catch (err) {
      console.error('Boot failed, agent will heal:', err);
    }
  }

  private push(msg: Omit<Message, 'timestamp'>): void {
    const full: Message = { ...msg, timestamp: Date.now() };
    this.history.push(full);
    this.options.onMessage?.(full);
  }

  getHistory(): Message[] {
    return [...this.history];
  }

  getProject(): ProjectState {
    return { ...this.project };
  }
}
