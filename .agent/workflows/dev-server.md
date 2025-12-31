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

---

## Обновление до актуальной версии с GitHub

Если открывается устаревшая версия приложения, выполните:

```powershell
# 1. Остановите сервер (Ctrl+C)

# 2. Полный сброс до версии с GitHub:
git fetch origin
git reset --hard origin/main

# 3. Удалите и переустановите зависимости:
Remove-Item -Recurse -Force node_modules
npm install

# 4. Запустите сервер:
npm run dev
```

**После запуска:**
- Откройте http://localhost:3000/ в режиме инкогнито (Ctrl+Shift+N)
- Или очистите кэш браузера: Ctrl+Shift+R
