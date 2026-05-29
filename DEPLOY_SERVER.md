# Установка CRM torenaOne на сервер 89.125.72.180

Цель: открыть CRM по адресу `https://crm.torenaone-office.ru`, а сайт `мировые-мощности.рф` подключить к этой CRM через виджет.

## 1. DNS домена torenaone-office.ru

В кабинете, где куплен домен `torenaone-office.ru`, добавить запись:

```text
Тип: A
Имя: crm
Значение: 89.125.72.180
TTL: auto / 3600
```

После этого адрес `crm.torenaone-office.ru` начнет вести на сервер. Обычно ожидание занимает от 5 минут до 2 часов.

## 2. Войти на сервер

На Mac открыть Terminal и выполнить:

```bash
ssh root@89.125.72.180
```

Если спросит `yes/no`, написать:

```bash
yes
```

Потом ввести пароль от сервера.

## 3. Установить программы на сервер

На сервере выполнить:

```bash
apt update
apt install -y git curl nginx certbot python3-certbot-nginx docker.io docker-compose-plugin nodejs npm
systemctl enable --now docker
systemctl enable --now nginx
```

## 4. Загрузить проект

Если проект уже есть на GitHub:

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/torenaone-eng/CRM-sistems.git crm
cd crm
```

Если сервер скажет, что папка уже есть:

```bash
cd /var/www/crm
git pull
```

## 5. Настроить backend

Создать файл:

```bash
nano backend/.env
```

Вставить:

```env
DATABASE_URL="postgresql://crm_user:crm_password@127.0.0.1:5432/crm"

PORT=3001
HOST=127.0.0.1
NODE_ENV=production
CORS_ORIGIN=https://crm.torenaone-office.ru,https://мировые-мощности.рф,https://xn----ctbjkdteieebqvo5h1a.xn--p1ai

JWT_SECRET="CHANGE_THIS_LONG_RANDOM_SECRET_BEFORE_REAL_CLIENTS"
JWT_EXPIRES_IN="7d"

S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="crm-recordings"

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
TELEGRAM_BOT_TOKEN=""
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_ID=""
OPENAI_API_KEY=""

BASE_URL="https://crm.torenaone-office.ru"
```

Сохранить: `Ctrl+O`, Enter, потом `Ctrl+X`.

## 6. Запустить базу и хранилище

```bash
docker compose up -d
docker ps
```

Должны быть контейнеры `postgres` и `minio`.

## 7. Установить зависимости и собрать проект

```bash
npm --prefix backend install
npm --prefix frontend install
npm run build
```

## 8. Создать таблицы и загрузить стартовые данные

```bash
npm --prefix backend run db:push
npm --prefix backend run db:seed
```

## 9. Запустить backend как сервис

Создать сервис:

```bash
nano /etc/systemd/system/crm-backend.service
```

Вставить:

```ini
[Unit]
Description=CRM torenaOne backend
After=network.target docker.service

[Service]
Type=simple
WorkingDirectory=/var/www/crm/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Сохранить и запустить:

```bash
systemctl daemon-reload
systemctl enable --now crm-backend
systemctl status crm-backend
```

## 10. Настроить Nginx

```bash
cp /var/www/crm/nginx/crm.conf /etc/nginx/sites-available/crm
ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/crm
nginx -t
systemctl reload nginx
```

Проверка без SSL:

```text
http://crm.torenaone-office.ru
```

## 11. Выпустить SSL-сертификат

```bash
certbot --nginx -d crm.torenaone-office.ru
```

## 12. Проверить CRM

Открыть:

```text
https://crm.torenaone-office.ru
```

Вход:

```text
admin@torenaone.ru
TorenaOne2026!
```

## 13. Вставить виджет на сайт мировые-мощности.рф

На сайт `мировые-мощности.рф` вставить в нужное место:

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

После отправки формы новый лид должен появиться в CRM в `Контакты` → `Новые лиды`.
