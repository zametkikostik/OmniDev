# Audit fixes (2026-08)

## P0
- package.json added to all packages/* (stubs)
- Documented apps/web as production code path
- @neondatabase/serverless + viem already in apps/web/package.json
- Root tsconfig fixed (no bogus rootDir: src)

## P1
- Docker healthchecks (web, postgres)
- deploy/preview/.gitkeep
- Dockerfile handles missing package-lock
- Prompt max length 20k on /api/generate
- Prisma: AuditEvent + Job models
- Treasury via NEXT_PUBLIC_TREASURY_ADDRESS

## P2
- Unit smoke: apps/web/test/project-validate.test.mjs
- CI: .github/workflows/ci.yml
- .env.example at repo root
- .prettierrc
