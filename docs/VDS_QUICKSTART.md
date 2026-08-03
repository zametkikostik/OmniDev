# OmniDev на VDS — быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp .env.example .env
# ADMIN_SECRET, DATABASE_URL, OLLAMA_BASE_URL

docker compose up -d --build
curl http://localhost:3000/api/health
```

## Ollama на другом ПК
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
ollama pull llama3.3
```

В `.env` на VDS:
```
ALLOW_OLLAMA=1
PLATFORM_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://IP_OLLAMA:11434
OLLAMA_MODEL=llama3.3
```

Firewall: VDS → Ollama:11434.

Admin: `/admin` + `ADMIN_SECRET`.
Preview: Caddy :8080 → `deploy/preview/`.
