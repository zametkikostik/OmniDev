# OmniDev

**Autonomous AI platform for generating full-stack applications**  
*(V0 + Bolt.new + Replit Agent + Marblism + Lovable in one product)*

> **License: Proprietary** — see [LICENSE](./LICENSE).  
> Commercial use, redistribution, and derivatives require written permission from the owner.

---

## 🇷🇺 Русский

### Что это
OmniDev — ИИ-сервис, который по текстовому описанию или скриншоту создаёт полноценные Full-Stack приложения, запускает их в браузере (WebContainers), сам чинит ошибки и позволяет править продукт живым чатом.

### Возможности
| Функция | Статус |
|---------|--------|
| Генерация UI + full-stack (React, Tailwind, Vite) | ✅ |
| Live-превью в браузере (WebContainers) | ✅ |
| Self-healing агент | ✅ |
| Диалоговые правки | ✅ |
| OpenRouter / Ollama / свои ключи | ✅ |
| Postgres + шаринг по ссылке | ✅ |
| MetaMask (USDC / native) + Stripe | ✅ |
| SIWE | ✅ |
| Кредиты, Redis rate limit, admin | ✅ |
| Vision: скриншот → код | ✅ |
| Docker, CI, Sentry, E2E | ✅ |

### Быстрый старт
```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp apps/web/.env.example apps/web/.env.local
npm install && npm run dev
```
- http://localhost:3000  
- http://localhost:3000/landing  
- http://localhost:3000/admin  

Прод: [docs/DEPLOY.md](docs/DEPLOY.md)

### Важно
Код **проприетарный**. Без письменного разрешения владельца запрещены коммерческое использование, распространение и производные продукты.

---

## 🇬🇧 English

### What it is
OmniDev is an AI service that turns a text prompt or screenshot into a full-stack app, runs it in the browser (WebContainers), self-heals build errors, and lets you edit through natural conversation.

### Features
| Feature | Status |
|---------|--------|
| UI + full-stack generation | ✅ |
| Live browser preview (WebContainers) | ✅ |
| Self-healing agent | ✅ |
| Conversational edits | ✅ |
| OpenRouter / Ollama / custom keys | ✅ |
| Postgres + share-by-link | ✅ |
| MetaMask (USDC / native) + Stripe | ✅ |
| SIWE wallet login | ✅ |
| Credits, Redis rate limit, admin | ✅ |
| Vision: screenshot → code | ✅ |
| Docker, CI, Sentry, E2E | ✅ |

### Quick start
```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp apps/web/.env.example apps/web/.env.local
npm install && npm run dev
```
- http://localhost:3000  
- http://localhost:3000/landing  
- http://localhost:3000/admin  

Production: [docs/DEPLOY.md](docs/DEPLOY.md)

### License notice
This software is **proprietary**. Commercial use, redistribution, and derivative works require prior written permission. See [LICENSE](./LICENSE).

---

## 🇧🇬 Български

### Какво е това
OmniDev е ИИ платформа, която по текстово описание или скрийншот създава пълноценни Full-Stack приложения, стартира ги в браузъра (WebContainers), сама оправя грешки и позволява редакции чрез чат.

### Възможности
| Функция | Статус |
|---------|--------|
| Генерация UI + full-stack | ✅ |
| Live преглед (WebContainers) | ✅ |
| Self-healing агент | ✅ |
| Диалогови редакции | ✅ |
| OpenRouter / Ollama | ✅ |
| Postgres + споделяне по линк | ✅ |
| MetaMask (USDC / native) + Stripe | ✅ |
| SIWE | ✅ |
| Кредити, Redis, админ | ✅ |
| Vision: скрийншот → код | ✅ |
| Docker, CI, Sentry, E2E | ✅ |

### Бърз старт
```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
cp apps/web/.env.example apps/web/.env.local
npm install && npm run dev
```
- http://localhost:3000  
- http://localhost:3000/landing  
- http://localhost:3000/admin  

Продакшън: [docs/DEPLOY.md](docs/DEPLOY.md)

### Лиценз
Софтуерът е **проприетарен**. Търговска употреба, разпространение и производни продукти са забранени без писмено разрешение. Виж [LICENSE](./LICENSE).

---

## Stack

Next.js · WebContainers · OpenRouter/Ollama · Postgres/Prisma · wagmi/RainbowKit · Stripe · SIWE · Redis · Docker · Sentry · Playwright

## Contact / licensing

https://github.com/zametkikostik/OmniDev  

**© 2025–2026 zametkikostik. All rights reserved.**
