export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await initSentry('server');
  if (process.env.NEXT_RUNTIME === 'edge') await initSentry('edge');
}

async function initSentry(runtime: 'server' | 'edge') {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log(`[omnidev] Sentry disabled (${runtime})`);
    return;
  }
  try {
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    if (!Sentry) {
      console.warn('[omnidev] @sentry/nextjs not installed');
      return;
    }
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    });
    console.log(`[omnidev] Sentry initialized (${runtime})`);
  } catch (err) {
    console.warn('[omnidev] Sentry init failed', err);
  }
}
