/**
 * Client-side WebContainer integration for OmniDev.
 */
'use client';

import type { WebContainer, FileSystemTree } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    const { WebContainer } = await import('@webcontainer/api');
    webcontainerInstance = await WebContainer.boot({ coep: 'require-corp' });
    return webcontainerInstance;
  })();

  return bootPromise;
}

export function filesToTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split('/').filter(Boolean);
    let current: any = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        current[part] = { file: { contents: content } };
      } else {
        if (!current[part]) current[part] = { directory: {} };
        current = current[part].directory;
      }
    }
  }
  return tree;
}

export interface RunResult {
  url: string | null;
  logs: string[];
  error?: string;
}

export async function runProject(
  files: Record<string, string>,
  onLog?: (line: string) => void
): Promise<RunResult> {
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); onLog?.(msg); };

  try {
    const container = await getWebContainer();
    log('WebContainer booted');

    await container.mount(filesToTree(files));
    log('Files mounted');

    log('npm install...');
    const install = await container.spawn('npm', ['install']);
    install.output.pipeTo(new WritableStream({ write(data) { log(data); } }));
    const installCode = await install.exit;
    if (installCode !== 0) {
      return { url: null, logs, error: `npm install failed with code ${installCode}` };
    }
    log('Dependencies installed');

    const urlPromise = new Promise<string>((resolve) => {
      container.on('server-ready', (_port, url) => resolve(url));
    });

    log('Starting dev server...');
    const dev = await container.spawn('npm', ['run', 'dev']);
    dev.output.pipeTo(new WritableStream({ write(data) { log(data); } }));

    const url = await Promise.race([
      urlPromise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for server')), 60000)),
    ]);

    log(`Preview ready: ${url}`);
    return { url, logs };
  } catch (err: any) {
    return { url: null, logs, error: err.message || String(err) };
  }
}

export async function writeFile(path: string, content: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
  const container = await getWebContainer();
  return await container.fs.readFile(path, 'utf-8');
}
