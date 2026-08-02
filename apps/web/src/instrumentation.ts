export async function register() {
  if (process.env.SENTRY_DSN) {
    console.log('[omnidev] SENTRY_DSN set but Sentry package not bundled');
  }
}
