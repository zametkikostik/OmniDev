# OmniDev — Autonomous AI Full-Stack Application Builder

**Next-generation AI platform that synthesizes the best of V0, Bolt.new, Replit Agent, Marblism and Lovable.**

OmniDev generates complete, production-ready Full-Stack applications from natural language or screenshots, runs them instantly in the browser via WebContainers, automatically heals build/runtime errors, generates database schemas & APIs, and supports Web3 out of the box.

## Core Features

| Source          | Capability                                      | OmniDev Implementation                          |
|-----------------|-------------------------------------------------|-------------------------------------------------|
| **V0**          | High-fidelity UI generation                     | LLM + visual parser → React + Tailwind + Shadcn + Lucide |
| **Bolt.new**    | Browser full-stack runtime                      | WebContainers (Node.js + Vite) in the client    |
| **Replit Agent**| Self-healing autonomous loop                    | Loop-error fixer agent                          |
| **Marblism**    | Auto DB schema + API from plain English         | Prisma + PostgreSQL + auto routes               |
| **Lovable**     | Conversational editing                          | Stateful chat that never breaks existing code   |
| **OmniDev**     | Web3-native                                     | wagmi + RainbowKit + ethers.js templates        |

## Quick Start (Development)

```bash
git clone https://github.com/zametkikostik/OmniDev.git
cd OmniDev
npm install
npm run dev
```

## Architecture Overview

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design and Mermaid diagram.

## Self-Healing Agent

The heart of autonomy lives in `src/self-healing-agent.ts`.  
It captures Vite/Next.js build errors, pipes them to the LLM, rewrites the broken files and retries until the application compiles successfully.

## Roadmap

See the Master Plan section in `docs/ARCHITECTURE.md`.

## License

MIT

---

Built to be the ultimate developer platform.
