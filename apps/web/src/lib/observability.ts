export async function captureException(err: unknown, context?: Record<string, unknown>) {
  console.error('[omnidev]', err, context);
}

export async function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
  console.log(`[omnidev:${level}]`, msg);
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
