# OmniDev — Autonomous AI Full-Stack Application Builder

**Создавай полноценные продакшн-приложения с помощью ИИ.**

## v0.4 — Полный цикл

| Фича | Статус |
|------|--------|
| Self-Healing AI Agent | ✅ |
| WebContainer (браузерный runtime) | ✅ |
| Генерация проекта → Live Preview | ✅ |
| OpenRouter (свой API Key) | ✅ |
| Ollama (локальные модели) | ✅ |
| MetaMask billing (любые сети) | ✅ |
| Settings UI | ✅ |
| Chat + Preview | ✅ |

## Как пользоваться

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
npm install
npm run dev
```

1. Открой http://localhost:3000
2. **Настройки** → вставь OpenRouter API Key (или укажи Ollama)
3. В чате: «Создай SaaS дашборд с тёмной темой»
4. OmniDev сгенерирует проект, поднимает WebContainer, ставит зависимости, запускает превью. Если ошибки — Self-Healing Agent чинит сам.

## Архитектура цикла

```
User prompt
    ↓
/api/generate  (LLM → files)
    ↓
WebContainer.boot() + mount(files)
    ↓
npm install && npm run dev
    ↓
server-ready → iframe preview
    ↓
(on error) /api/heal → rewrite files → retry
```

MIT
