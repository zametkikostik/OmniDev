# OmniDev — Autonomous AI Full-Stack Application Builder

**Создавай полноценные продакшн-приложения с помощью ИИ.**

## Что умеет (v0.3)

| Фича | Статус |
|------|--------|
| Self-Healing AI Agent | ✅ |
| WebContainer Manager | ✅ |
| LLM Orchestrator | ✅ |
| Chat + Preview UI | ✅ |
| **OpenRouter** (свой API / Management Key) | ✅ |
| **Ollama** (локальные модели) | ✅ |
| **MetaMask billing** (любые сети) | ✅ |
| Settings UI | ✅ |
| Real LLM wiring in chat | ✅ |
| Full create → preview cycle | 🔄 |
| Screenshot → Code | ⏳ |
| Multi-tenant SaaS | ⏳ |

## Быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
npm install
npm run dev
```

1. Открой http://localhost:3000
2. Зайди в **Настройки**
3. Вставь свой **OpenRouter API Key** (или укажи Ollama)
4. Вернись в чат и пиши: «Сделай SaaS дашборд с авторизацией»

## Провайдеры LLM

- **OpenRouter** — вставь свой ключ с https://openrouter.ai/keys (Management keys поддерживаются)
- **Ollama** — локальные модели (`llama3.1`, `codellama`, `deepseek-coder` и т.д.)
- **OpenAI** / **Custom endpoint** — любой OpenAI-compatible сервер

Клиенты тоже могут подключать свои ключи и свои локальные Ollama.

## Оплата через MetaMask

Страница `/billing` — оплата в любой сети:
- Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, Sepolia
- Native token или USDC

После подтверждения транзакции кредиты зачисляются автоматически.

## Структура

```
apps/web/                 # Next.js UI (чат, настройки, биллинг)
packages/
  core/                   # Self-Healing Agent
  webcontainer/           # WebContainer Manager
  orchestrator/           # Intent Router
  llm/                    # Universal LLM Provider (OpenRouter + Ollama + ...)
  billing/                # MetaMask multi-chain payments
templates/
  next-saas/
  web3-dapp/
```

## Лицензия

MIT
