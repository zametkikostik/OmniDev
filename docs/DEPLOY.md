# OmniDev — Deploy

## Vercel (recommended)

1. Import repo: https://github.com/zametkikostik/OmniDev
2. **Root Directory:** `apps/web`
3. Framework: Next.js (auto)
4. Install / Build: defaults (`npm install`, `next build`)

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TREASURY_ADDRESS` | for crypto | Wallet for USDC/native |
| `NEXT_PUBLIC_WC_PROJECT_ID` | for wallets | WalletConnect Cloud project id |
| `ADMIN_SECRET` | for `/admin` | Random long string |
| `DATABASE_URL` | optional | Postgres (Neon/Supabase). Without → in-memory |
| `STRIPE_SECRET_KEY` | optional | Card payments |
| `STRIPE_WEBHOOK_SECRET` | optional | Stripe webhook |
| `REDIS_URL` | optional | Upstash REST or redis:// |
| `UPSTASH_REDIS_REST_TOKEN` | optional | With Upstash REST |
| `SENTRY_DSN` | optional | Error tracking |

Users add **OpenRouter / Google AI Studio / Ollama** keys in **Settings** UI.

### After deploy

- Health: `https://YOUR.vercel.app/api/health`
- App `/` · Landing `/landing` · Admin `/admin`
- Settings → OpenRouter or Google key → generate

### WebContainers

COOP/COEP headers are set in `next.config.ts`. Preview runs in the **browser**.

### standalone

`output: 'standalone'` only when `DOCKER_BUILD=1`. Not used on Vercel.

---

## Docker

```bash
git clone https://github.com/zametkikostik/OmniDev.git && cd OmniDev
cp apps/web/.env.example .env
DOCKER_BUILD=1 docker compose up -d --build
```

## Local

```bash
cd apps/web && cp .env.example .env.local && npm install && npm run dev
```
