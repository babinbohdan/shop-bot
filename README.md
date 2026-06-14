# 🛍 Telegram Shop Bot

Повнофункціональний Telegram-бот магазин з каналом-вітриною, кошиком, адмін-панеллю та моніторингом цін постачальника.

---

## 📁 Структура проєкту

```
shop_bot/
│
├── main.py                  # Точка входу, запуск бота
├── config.py                # Налаштування через .env (pydantic-settings)
│
├── database/
│   ├── models.py            # ORM-моделі: User, Category, Product, CartItem, Order
│   ├── db.py                # Async-engine, фабрика сесій, init_db()
│   └── repo.py              # Репозиторій: всі SQL-запити
│
├── handlers/
│   ├── registration.py      # FSM реєстрації (контакт → ПІБ → місто → доставка)
│   ├── catalog.py           # Каталог: категорії → товари → картка
│   ├── cart.py              # Кошик: додавання, редагування, оформлення
│   ├── admin.py             # Адмін-команди, обробка рішень по цінах
│   └── common.py            # /help, main_menu, reply-кнопки
│
├── keyboards/
│   └── main_menu.py         # Головне inline-меню
│
├── middlewares/
│   └── auth.py              # Перевірка реєстрації перед кожним апдейтом
│
├── scheduler/
│   └── tasks.py             # APScheduler: щоденний пост + моніторинг цін
│
├── services/
│   └── parser.py            # Парсер/API-конектор сайту постачальника
│
├── utils/
│   ├── formatters.py        # Текстові шаблони повідомлень
│   ├── logger.py            # Централізоване логування з RotatingFileHandler
│   └── notify.py            # Утиліти сповіщень адміну
│
├── scripts/
│   └── seed_db.py           # Заповнення тестовими даними
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## ⚡ Швидкий старт

### 1. Клонування та середовище

```bash
git clone <your-repo>
cd shop_bot
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Налаштування .env

```bash
cp .env.example .env
nano .env   # заповніть BOT_TOKEN, ADMIN_CHAT_ID, CHANNEL_ID
```

| Змінна | Опис |
|---|---|
| `BOT_TOKEN` | Токен від @BotFather |
| `ADMIN_CHAT_ID` | Ваш Telegram ID (отримати: @userinfobot) |
| `CHANNEL_ID` | @username або `-100xxxxxxxxxx` вашого каналу |
| `DATABASE_URL` | SQLite або PostgreSQL connection string |
| `DAILY_POST_HOUR` | Година публікації в канал (UTC) |
| `PARSER_INTERVAL_MINUTES` | Як часто перевіряти ціни постачальника |

### 3. База даних + тестові дані

```bash
# Тільки таблиці
python -c "import asyncio; from database.db import init_db; asyncio.run(init_db())"

# Таблиці + тестові категорії та товари
python -m scripts.seed_db
```

### 4. Запуск

```bash
python main.py
```

### 5. Docker (продакшен)

```bash
docker-compose up -d --build
```

---

## 🗄 Схема бази даних

```
users
  id | telegram_id | phone | full_name | city | delivery_type | is_registered

categories
  id | name | parent_id (self-ref) | is_active

products
  id | category_id | name | description | price | supplier_price
     | supplier_url | photo_file_id | in_stock | is_active

cart_items
  id | user_id | product_id | quantity | added_at

orders
  id | user_id | total_price | comment | status | created_at

order_items
  id | order_id | product_id | quantity | price_at_order
```

---

## 🔧 Адмін-команди (тільки для ADMIN_CHAT_ID)

| Команда | Дія |
|---|---|
| `/admin` | Показати панель адміна |
| `/add_product` | Додати новий товар (покрокове FSM) |
| `/list_products` | Список усіх товарів з ID і цінами |
| `/toggle_stock <id>` | Перемкнути наявність товару |
| `/stats` | Кількість юзерів, замовлень, загальний дохід |

### Управління цінами (inline-кнопки)
Коли парсер виявляє зміну ціни у постачальника, адмін отримує повідомлення з кнопками:
- **✅ Оновити ціну на вітрині** — ціна в БД оновлюється, майбутні пости публікуються з новою ціною
- **⏸ Залишити стару** — зміна ігнорується

---

## 🕷 Налаштування парсера

Відкрийте `services/parser.py` та знайдіть функцію `_parse_html()`.

Адаптуйте CSS-селектори під сайт вашого постачальника:

```python
# Ціна — знайдіть у DevTools (F12 → Inspector) елемент з ціною:
price_tag = soup.select_one(".your-price-class")

# Наявність — знайдіть елемент зі статусом:
stock_tag = soup.select_one(".your-stock-class")
```

> ⚠️ **Важливо:** Парсер робить запити з випадковою затримкою 1–4 с між зверненнями та ротує User-Agent. Інтервал між повними циклами перевірки задається через `PARSER_INTERVAL_MINUTES` в `.env`.

---

## 📡 Публікації в канал

Щодня о `DAILY_POST_HOUR:DAILY_POST_MINUTE` (часовий пояс Europe/Kyiv) бот:
1. Обирає випадковий товар із наявних у каталозі
2. Формує пост: фото + назва + опис + ціна + статус наявності
3. Публікує в `CHANNEL_ID` з Inline-кнопкою **«🛒 Придбати»**, яка веде у бота

> Бот має бути **адміністратором каналу** з правом публікації повідомлень.

---

## 🔐 Безпека

- Усі секрети — лише в `.env`, `.env` додано до `.gitignore`
- Адмін-команди перевіряють `from_user.id == ADMIN_CHAT_ID` перед виконанням
- Middleware `AuthMiddleware` блокує незареєстрованих користувачів

---

## 🚀 Плани розвитку (з технічного завдання)

- [ ] **Telegram Mini App** — повноцінний каталог як веб-сторінка всередині Telegram
- [ ] **Webhook** замість polling (рекомендується для продакшену)
- [ ] **Redis** замість MemoryStorage для FSM (при масштабуванні)
- [ ] **Алерти** при помилках парсера (Sentry або Telegram notification)
- [ ] **Статуси замовлень** — адмін може змінювати статус прямо в боті
