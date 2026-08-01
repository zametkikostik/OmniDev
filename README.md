# OmniDev — Autonomous AI Full-Stack Application Builder

**Создавай полноценные продакшн-приложения с помощью ИИ.**

OmniDev объединяет лучшее из V0, Bolt.new, Replit Agent, Marblism и Lovable в одну платформу:

- Генерация UI по тексту или скриншоту (React + Tailwind + Shadcn + Lucide)
- Запуск full-stack прямо в браузере через WebContainers
- Автономный Self-Healing Agent, который сам чинит ошибки сборки
- Автогенерация Prisma-схем и API из обычного текста
- Человечный чат-интерфейс для правок
- Web3 из коробки (wagmi + RainbowKit)

## Текущий статус (v0.2)

| Компонент                    | Статус      |
|-----------------------------|-------------|
| Self-Healing AI Agent       | ✅ Готов    |
| WebContainer Manager        | ✅ Готов    |
| LLM Orchestrator            | ✅ Готов    |
| Chat + Preview UI           | ✅ Готов    |
| Project templates           | ✅ Готов    |
| Web3 templates              | ✅ Готов    |
| Real LLM wiring             | 🔄 В работе |
| Screenshot → Code           | ⏳ Планируется |
| Multi-tenant SaaS           | ⏳ Планируется |

## Структура репозитория

```
OmniDev/
├── apps/
│   └── web/                  # Next.js фронтенд (чат + превью)
├── packages/
│   ├── core/                 # Self-Healing Agent
│   ├── webcontainer/         # WebContainer Manager
│   ├── orchestrator/         # Intent Router + координация
│   ├── ui-engine/            # (скоро) UI Generation
│   └── db-engine/            # (скоро) Prisma + API gen
├── templates/
│   ├── next-saas/            # Базовый SaaS-шаблон
│   └── web3-dapp/            # Web3-шаблон
└── docs/
    └── ARCHITECTURE.md
```

## Быстрый старт

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
npm install
npm run dev
```

Открой http://localhost:3000

## Как это работает

1. Пользователь пишет в чат: «Сделай SaaS-дашборд с авторизацией и Stripe»
2. Orchestrator классифицирует intent → `create_app`
3. LLM генерирует полный набор файлов
4. WebContainer Manager монтирует проект и запускает `npm install && npm run dev`
5. Если возникают ошибки — Self-Healing Agent ловит их, чинит код и ретраит
6. Пользователь видит живое превью справа
7. Дальше можно править фразами: «сделай кнопку круглее», «добавь кошелёк»

## Документация

Полная архитектура и roadmap: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Лицензия

MIT

---

Строим платформу, которая позволит любому человеку создавать настоящие продукты.
