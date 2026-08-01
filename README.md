# OmniDev — Autonomous AI Full-Stack Application Builder

**Создавай полноценные продакшн-приложения с помощью ИИ.**

## v0.7

| Фича | Статус |
|------|--------|
| Генерация → WebContainer → Live Preview | ✅ |
| Self-Healing + Conversational edits | ✅ |
| OpenRouter / Ollama | ✅ |
| **Postgres backend** (с fallback) | ✅ |
| **Шаринг проектов** `/p/[slug]` | ✅ |
| **USDC + native MetaMask** | ✅ |
| **Screenshot → Code → WebContainer** | ✅ |
| GitHub export | ✅ |

## Быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp apps/web/.env.example apps/web/.env.local
npm install
npm run dev
```

Без Postgres — in-memory + localStorage. С Postgres — `DATABASE_URL` + `npx prisma db push` в `packages/db`.

MIT
