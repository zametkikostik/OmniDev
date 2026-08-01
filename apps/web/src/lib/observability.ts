type Level = 'info' | 'warn' | 'error';

export async function captureException(err: unknown, context?: Record<string, unknown>) {
  console.error('[omnidev]', err, context);
  try {
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    if (Sentry) {
      if (context) Sentry.setContext('extra', context);
      Sentry.captureException(err);
    }
  } catch {}
}

export async function captureMessage(message: string, level: Level = 'info') {
  if (level === 'error') console.error('[omnidev]', message);
  else if (level === 'warn') console.warn('[omnidev]', message);
  else console.log('[omnidev]', message);
  try {
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    if (Sentry) Sentry.captureMessage(message, level);
  } catch {}
}

export function withTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn()
    .then((result) => {
      console.log(`[timing] ${name} ${Date.now() - start}ms`);
      return result;
    })
    .catch(async (err) => {
      await captureException(err, { operation: name });
      throw err;
    });
}
