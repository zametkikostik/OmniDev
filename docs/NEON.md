# Neon Postgres for OmniDev

1. Create project at https://neon.tech
2. Set Vercel env `DATABASE_URL` (pooled + sslmode=require)
3. Schema: `packages/db/prisma/schema.prisma`
4. Migrate: `cd packages/db && npx prisma migrate deploy`
5. Wire Prisma client into `apps/web/src/lib/db.ts` when ready

Without DATABASE_URL the app uses in-memory store (resets on cold start).
