/**
 * OmniDev WebContainer Manager
 * 
 * Manages the lifecycle of a WebContainer instance:
 * - Boot
 * - Mount project files
 * - Install dependencies
 * - Run scripts
 * - Stream terminal output
 * - Hot-reload support
 */

import { WebContainer, FileSystemTree } from '@webcontainer/api';

export type TerminalCallback = (data: string) => void;
export type StatusCallback = (status: WebContainerStatus) => void;

export type WebContainerStatus =
  | 'booting'
  | 'ready'
  | 'installing'
  | 'running'
  | 'error'
  | 'destroyed';

export class WebContainerManager {
  private container: WebContainer | null = null;
  private status: WebContainerStatus = 'booting';
  private onTerminal?: TerminalCallback;
  private onStatus?: StatusCallback;
  private currentProcess: any = null;

  constructor(options?: {
    onTerminal?: TerminalCallback;
    onStatus?: StatusCallback;
  }) {
    this.onTerminal = options?.onTerminal;
    this.onStatus = options?.onStatus;
  }

  async boot(): Promise<WebContainer> {
    this.setStatus('booting');
    this.container = await WebContainer.boot({
      coep: 'require-corp',
    });
    this.setStatus('ready');
    return this.container;
  }

  get instance(): WebContainer {
    if (!this.container) {
      throw new Error('WebContainer is not booted. Call boot() first.');
    }
    return this.container;
  }

  async mount(files: FileSystemTree): Promise<void> {
    await this.instance.mount(files);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.instance.fs.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    return await this.instance.fs.readFile(path, 'utf-8');
  }

  async install(): Promise<void> {
    this.setStatus('installing');
    const process = await this.instance.spawn('npm', ['install']);
    this.pipeOutput(process);
    const exitCode = await process.exit;
    if (exitCode !== 0) {
      this.setStatus('error');
      throw new Error(`npm install failed with code ${exitCode}`);
    }
    this.setStatus('ready');
  }

  async run(command: string, args: string[] = []): Promise<any> {
    if (this.currentProcess) {
      this.currentProcess.kill();
    }

    this.setStatus('running');
    this.currentProcess = await this.instance.spawn(command, args);
    this.pipeOutput(this.currentProcess);

    this.currentProcess.exit.then((code: number) => {
      if (code !== 0) {
        this.setStatus('error');
      }
    });

    return this.currentProcess;
  }

  async startDevServer(): Promise<{ url: string }> {
    await this.install();

    const urlPromise = new Promise<string>((resolve) => {
      this.instance.on('server-ready', (port, url) => {
        resolve(url);
      });
    });

    await this.run('npm', ['run', 'dev']);

    const url = await urlPromise;
    return { url };
  }

  destroy(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
    }
    this.container = null;
    this.setStatus('destroyed');
  }

  private pipeOutput(process: any): void {
    process.output.pipeTo(
      new WritableStream({
        write: (data: string) => {
          this.onTerminal?.(data);
        },
      })
    );
  }

  private setStatus(status: WebContainerStatus): void {
    this.status = status;
    this.onStatus?.(status);
  }
}

export function filesToTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let current: any = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = {
          file: { contents: content },
        };
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        current = current[part].directory;
      }
    }
  }

  return tree;
}
