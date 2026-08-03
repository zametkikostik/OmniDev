# OmniDev на VDS

## Быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp .env.example .env
docker compose up -d --build
```

Открой `http://IP:3000`. Admin: `/admin` + `ADMIN_SECRET`.

## Env

```
ADMIN_SECRET=
OPENROUTER_API_KEY=
DATABASE_URL=postgresql://omnidev:omnidev@db:5432/omnidev
PLATFORM_LLM_PROVIDER=openrouter
PLATFORM_LLM_MODEL=anthropic/claude-sonnet-4
NEXT_PUBLIC_APP_URL=https://your.domain
ALLOW_USER_BYOK=0
```

## Ollama на VDS

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:14b
```
