# Node на VDS

## Рекомендуется Node 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
```

## Запуск
```bash
cd ~/OmniDev && git pull
cd apps/web
npm install --legacy-peer-deps
# ALLOWED_DEV_ORIGINS=ТВОЙ_IP >> .env.local
npm run dev -- -H 0.0.0.0
```

Sentry не обязателен.
