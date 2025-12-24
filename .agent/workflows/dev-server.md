---
description: Запуск dev-сервера для разработки
---

// turbo-all

## Запуск Dev-сервера

1. Запустите dev-сервер:
```bash
cd "d:\Проекты\Barber booking app (Antigravity)\barber-booking-app"
npm run dev
```

Сервер будет доступен на http://localhost:3000

## Cloudflare Tunnel (опционально)

2. Для публичного доступа через Cloudflare:
```bash
cloudflared tunnel --url http://localhost:3000 --protocol http2
```
