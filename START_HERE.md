# Запуск CRM torenaOne локально

## 1. Поднять базу и хранилище

На этом Mac проект настроен через Colima, потому что Docker Desktop требует системный пароль для `/Library`.

Команды для запуска локального Docker Engine:

```bash
colima start
```

Контейнеры CRM запускаются так:

```bash
npm run docker:up
```

Проверить контейнеры:

```bash
npm run docker:ps
```

Будут запущены:

- PostgreSQL: `localhost:5432`
- MinIO S3: `localhost:9000`
- MinIO Console: `http://localhost:9001`

## 2. Подготовить backend

```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

API будет доступен по адресу:

```text
http://127.0.0.1:3001/api/health
```

## 3. Запустить CRM

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Открыть:

```text
http://127.0.0.1:5173
```

## Быстрая проверка API

```bash
curl http://127.0.0.1:3001/api/health
```

Правильный ответ:

```json
{"ok":true}
```

## Тестовый вход

```text
admin@torenaone.ru
TorenaOne2026!
```

## Виджет для сайта мировые-мощности.рф

Локальная проверка виджета:

```text
http://127.0.0.1:5173/mm-widget-demo.html
```

Вставка на сайт:

```html
<div id="mm-crm-widget"></div>
<script
  src="https://crm.torenaone-office.ru/mm-crm-widget.js"
  data-api="https://crm.torenaone-office.ru"
  data-site-key="sk_live_torenaone_main"
  data-target="#mm-crm-widget"
  data-title="Получить расчет"
  data-button="Отправить заявку">
</script>
```

Основной адрес CRM: `https://crm.torenaone-office.ru`.

## Что подключать дальше

1. Подключить реальные формы сайта, телефонию и мессенджеры.
2. Перенести складские товары, документы и договоры в backend.
3. Добавить права доступа по ролям для руководителя и менеджеров.
4. Перенести запуск на сервер и домен CRM.
