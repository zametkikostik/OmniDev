export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    try {
      const Sentry: any = await import('@sentry/nextjs').catch(() => null);
      if (Sentry?.init) {
        Sentry.init({
          dsn,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV,
        });
      }
    } catch {
      console.warn('[instrumentation] Sentry not installed — npm i @sentry/nextjs');
    }
  }
}
