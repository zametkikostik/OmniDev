# OmniDev Production Deploy

## Env

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_WC_PROJECT_ID=...
```

## Vercel

Root: `apps/web`. Build: `npm run build`.

## Docker

```bash
docker compose up -d
```

## Migrate

```bash
cd packages/db && npx prisma generate && npx prisma db push
```

## Health

`GET /api/health`

## Checklist

- [ ] Treasury wallet
- [ ] Managed Postgres
- [ ] WalletConnect project id
- [ ] HTTPS
- [ ] Rate limit (middleware on)
