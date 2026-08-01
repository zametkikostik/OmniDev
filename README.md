# OmniDev — Autonomous AI Full-Stack Application Builder

**Создавай полноценные продакшн-приложения с помощью ИИ.**

## v0.6

| Фича | Статус |
|------|--------|
| Генерация → WebContainer → Live Preview | ✅ |
| Self-Healing + Conversational edits | ✅ |
| Сохранение проектов + GitHub export | ✅ |
| OpenRouter / Ollama / OpenAI | ✅ |
| **MetaMask real payments (wagmi)** | ✅ |
| **Screenshot → Code** | ✅ |

## Быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp apps/web/.env.example apps/web/.env.local
# Заполни NEXT_PUBLIC_WC_PROJECT_ID и NEXT_PUBLIC_TREASURY_ADDRESS
npm install
npm run dev
```

### .env.local

```
NEXT_PUBLIC_WC_PROJECT_ID=...
NEXT_PUBLIC_TREASURY_ADDRESS=0x...
```

## Возможности

1. Чат → «Создай SaaS дашборд» → живое превью
2. Правки → «сделай кнопку круглее»
3. 📷 Скрин → загрузка скриншота UI → код
4. GitHub → экспорт репозитория
5. MetaMask → `/billing` — оплата native-токеном
6. OpenRouter / Ollama → свои ключи и локальные модели

MIT
