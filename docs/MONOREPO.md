# Monorepo

**Source of truth: `apps/web`.**

`packages/*` are stubs so npm workspaces install cleanly. Do not import them into the Next app.

```bash
cd apps/web && npm install --legacy-peer-deps
npm run dev
```
