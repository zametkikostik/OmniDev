# Implemented in order

1. Neon/Postgres via DATABASE_URL + @neondatabase/serverless
2. Usage billing on generate (address + creditsFor)
3. Prompt moderation on generate/chat/edit/heal/vision
4. Job queue /api/jobs + /api/jobs/worker (+ QStash)
5. Templates
6. GitHub export (existing)
7. Workspaces /api/workspaces + members
8. Preview /api/preview → /p/[slug]

## Env
DATABASE_URL=
QSTASH_TOKEN=
NEXT_PUBLIC_APP_URL=
PREVIEW_HOOK_URL=
ADMIN_SECRET=
OPENROUTER_API_KEY=
PLATFORM_LLM_PROVIDER=openrouter
PLATFORM_LLM_MODEL=anthropic/claude-sonnet-4
ALLOW_USER_BYOK=0
