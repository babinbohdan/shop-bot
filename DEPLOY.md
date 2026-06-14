# 🚀 Інструкція запуску — покроково

## Частина 1: Локальна розробка (Windows)

### Крок 1 — Встановіть залежності Python
```
cd C:\shop_bot
pip install -r requirements.txt
```

### Крок 2 — Налаштуйте .env
Скопіюйте `.env.example` → `.env` і заповніть:
```
BOT_TOKEN=ваш_токен
ADMIN_CHAT_ID=ваш_id
CHANNEL_ID=@ваш_канал
DATABASE_URL=sqlite+aiosqlite:///shop.db
```

### Крок 3 — Імпортуйте CSV (перший запуск)
```
python -m scripts.import_csv --file prom_csv.csv --sqlite
```
Це займе 3–5 хвилин. Імпортує всі 19 980 товарів.

### Крок 4 — Запустіть бота (у першому cmd-вікні)
```
python main.py
```

### Крок 5 — Запустіть API (у другому cmd-вікні)
```
uvicorn api.main:app --reload --port 8000
```
Перевірте: http://localhost:8000/api/categories — має повернути JSON зі списком категорій.

### Крок 6 — Запустіть Mini App (у третьому cmd-вікні)
```
cd mini_app
npm install
npm run dev
```
Mini App доступний на: http://localhost:5173

---

## Частина 2: Продакшен (VPS Hetzner)

### Крок 1 — Орендуйте сервер
- Hetzner: https://www.hetzner.com/cloud → CX22 (€4.5/міс)
- Ubuntu 22.04
- Запам'ятайте IP сервера

### Крок 2 — Підключіться до сервера
На Windows: відкрийте cmd і введіть:
```
ssh root@ВАШ_IP_СЕРВЕРА
```

### Крок 3 — Встановіть необхідне на сервері
```bash
apt update && apt upgrade -y
apt install -y python3.11 python3.11-pip python3.11-venv nginx certbot python3-certbot-nginx nodejs npm git
```

### Крок 4 — Завантажте проєкт на сервер
```bash
mkdir /home/ubuntu/shop_bot
# Скопіюйте файли через FileZilla (SFTP) або git clone
```

### Крок 5 — Встановіть залежності
```bash
cd /home/ubuntu/shop_bot
pip3.11 install -r requirements.txt
```

### Крок 6 — Налаштуйте PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER shop_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE shop_db OWNER shop_user;"
```
У `.env` змініть:
```
DATABASE_URL=postgresql+asyncpg://shop_user:your_password@localhost/shop_db
```

### Крок 7 — Імпортуйте CSV
```bash
python3.11 -m scripts.import_csv --file prom_csv.csv
```

### Крок 8 — Зберіть React Mini App
```bash
cd mini_app
npm install
npm run build   # створює папку dist/
```

### Крок 9 — Налаштуйте домен і HTTPS
1. Купіть домен (Namecheap, GoDaddy) і направте A-запис на IP сервера
2. Замініть `yourdomain.com` у `nginx.conf` на ваш домен
3. Скопіюйте nginx.conf:
```bash
cp nginx.conf /etc/nginx/sites-available/shopbot
ln -s /etc/nginx/sites-available/shopbot /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com
```

### Крок 10 — Зареєструйте Mini App у боті
У BotFather:
```
/setmenubutton → ваш бот → https://yourdomain.com → 🛍 Магазин
```
АБО додайте inline-кнопку в коді бота:
```python
builder.button(text="🛍 Відкрити магазин", web_app=WebAppInfo(url="https://yourdomain.com"))
```

### Крок 11 — Запустіть бота і API як сервіси
```bash
# Бот
cat > /etc/systemd/system/shopbot.service << EOF
[Unit]
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/shop_bot
ExecStart=/usr/bin/python3.11 main.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# FastAPI
cat > /etc/systemd/system/shopapi.service << EOF
[Unit]
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/shop_bot
ExecStart=/usr/bin/uvicorn api.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable shopbot shopapi
systemctl start shopbot shopapi
```

### Перевірка
```bash
systemctl status shopbot    # бот запущений?
systemctl status shopapi    # API запущений?
curl https://yourdomain.com/api/categories   # повертає JSON?
```

---

## Корисні команди для підтримки

```bash
# Переглянути логи бота
journalctl -u shopbot -f

# Перезапустити після оновлення коду
systemctl restart shopbot shopapi

# Оновити ціни вручну
python3.11 -m scripts.sync_prices

# Оновити CSV
python3.11 -m scripts.import_csv --file new_catalog.csv
```
