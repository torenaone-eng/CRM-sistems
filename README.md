# CRM torenaOne — омниканальная CRM с записью звонков

Полноценная CRM система с поддержкой нескольких сайтов, записью звонков, предупреждением клиентов о записи и интеграцией мессенджеров.

## Возможности

- 📞 **Запись звонков** — автоматическая запись, хранение в MinIO/S3
- ⚠️ **Предупреждение о записи** — голосовое и текстовое уведомление клиента (требование закона)
- 🌐 **Несколько сайтов** — каждый сайт со своими каналами и менеджерами
- 💬 **Омниканальный inbox** — WhatsApp, Telegram, MAX, Авито, Instagram, ВКонтакте, YouTube
- 👥 **До 10 менеджеров** — роли, назначение по сайтам, нагрузка
- 📊 **Воронка сделок** — канбан по этапам
- ✅ **Задачи** — с дедлайнами и напоминаниями

## Стек

**Frontend**: React 18, Vite  
**Backend**: Node.js, Express, TypeScript, Prisma ORM  
**БД**: PostgreSQL  
**Хранилище**: MinIO (S3-совместимое)  
**Телефония**: Twilio / Asterisk  
**Деплой**: Nginx, PM2, VPS

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/ВАШ_USERNAME/crm.git
cd crm
```

### 2. Настроить бэкенд

```bash
cd backend
cp .env.example .env
# Заполни .env своими данными

npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

### 3. Запустить фронтенд

```bash
cd frontend
npm install
npm run dev
# Открыть http://localhost:5173
```

## Деплой на VPS (89.125.72.180)

```bash
# 1. Установить зависимости (один раз)
bash scripts/install.sh

# 2. Загрузить код
git clone https://github.com/ВАШ_USERNAME/crm.git /var/www/crm

# 3. Собрать и запустить
cd /var/www/crm/frontend && npm install && npm run build
cd /var/www/crm/backend && npm install && npx prisma migrate deploy
pm2 start npm --name crm-backend -- start
systemctl reload nginx
```

## Автодеплой через GitHub Actions

Добавь в Settings → Secrets:
- `VPS_HOST` = `89.125.72.180`
- `VPS_USER` = `root`
- `VPS_SSH_KEY` = приватный SSH ключ

Каждый push в `main` автоматически деплоит на сервер.

## Структура проекта

```
crm/
├── frontend/          # React приложение
│   ├── src/
│   │   ├── App.jsx    # Основной компонент CRM
│   │   └── main.jsx   # Точка входа
│   ├── index.html
│   └── vite.config.js
├── backend/           # Node.js API
│   ├── src/
│   │   ├── app.ts     # Express сервер
│   │   ├── routes/    # API маршруты
│   │   ├── services/  # S3, телефония, AI
│   │   ├── middleware/ # Auth JWT
│   │   └── prisma/    # Схема БД
│   └── tsconfig.json
├── nginx/
│   └── crm.conf       # Nginx конфиг
└── .github/
    └── workflows/
        └── deploy.yml # CI/CD
```

## ⚠️ Безопасность

- Никогда не коммить `.env` файлы
- Смени пароли на VPS после установки
- Включай предупреждение о записи — это требование ст. 23 Конституции РФ

## Лицензия

MIT
