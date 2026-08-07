/**
 * Optional hooks. Sentry is NOT imported here — webpack warns if package missing.
 * To enable: npm i @sentry/nextjs + SENTRY_DSN + withSentryConfig in next.config.
 */
export async function register() {
  // no-op
}
