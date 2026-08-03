export async function captureException(err: unknown, context?: Record<string, unknown>) {
  console.error('[omnidev]', err, context);
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry: any = await import('@sentry/nextjs').catch(() => null);
    if (Sentry?.captureException) {
      if (context && Sentry.setContext) Sentry.setContext('extra', context);
      Sentry.captureException(err);
    }
  } catch {}
}

export async function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
  console.log(`[omnidev:${level}]`, msg);
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry: any = await import('@sentry/nextjs').catch(() => null);
    Sentry?.captureMessage?.(msg, level);
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
      console.error(`[timing] ${name} failed after ${Date.now() - start}ms`);
      await captureException(err, { operation: name });
      throw err;
    });
}
