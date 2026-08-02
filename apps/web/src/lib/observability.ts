/**
 * Lightweight observability — console only (no optional Sentry package).
 */

type Level = 'info' | 'warn' | 'error';

export async function captureException(err: unknown, context?: Record<string, unknown>) {
  console.error('[omnidev]', err, context ?? '');
}

export async function captureMessage(message: string, level: Level = 'info') {
  if (level === 'error') console.error('[omnidev]', message);
  else if (level === 'warn') console.warn('[omnidev]', message);
  else console.log('[omnidev]', message);
}

export function withTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn()
    .then((result) => {
      console.log(`[timing] ${name} ${Date.now() - start}ms`);
      return result;
    })
    .catch(async (err) => {
      console.error(`[timing] ${name} failed after ${Date.now() - start}ms`);
      await captureException(err, { operation: name });
      throw err;
    });
}
