---
name: shop-bot-feature
description: >
  Use this skill for ANY work on the shop_bot Telegram bot project located at C:\shop_bot.
  Triggers when the user asks to add a feature, fix a bug, create a new page, add an API
  endpoint, add a bot command, update the scheduler, or deploy the bot. Also use when the
  user says things like "додай функцію", "зроби сторінку", "додай кнопку", "реалізуй",
  "виправ баг у боті", or "задеплой". If anything touches the shop_bot project — use this skill.
---

# Shop Bot — Feature Development Skill

## Project overview

`C:\shop_bot` — Telegram-бот + Mini App інтернет-магазин іграшок.
Деплоється на Railway.app через `push_fix.bat`.

## Tech stack

| Шар | Технологія |
|---|---|
| Telegram bot | aiogram 3.7.0, polling |
| Backend API | FastAPI + uvicorn |
| Mini App frontend | React + Vite (Telegram WebApp SDK) |
| Database | PostgreSQL (Railway), SQLAlchemy async + asyncpg |
| Scheduler | APScheduler (AsyncIOScheduler) |
| ORM | SQLAlchemy 2.x з `Mapped` / `mapped_column` |
| Deploy | Railway.app auto-deploy on git push |

## Directory structure

```
C:\shop_bot\
├── api/
│   ├── main.py              ← FastAPI app, підключення роутерів
│   └── routes/
│       ├── products.py      ← GET /api/products, /api/categories
│       ├── orders.py        ← POST /api/orders, GET /api/orders/history
│       ├── promo.py         ← POST /api/promo/validate
│       └── wishlist.py      ← GET/POST/DELETE /api/wishlist
├── database/
│   ├── models.py            ← SQLAlchemy ORM моделі
│   └── repo.py              ← Всі запити до БД (repository pattern)
├── handlers/                ← aiogram handlers (команди бота)
├── keyboards/               ← aiogram inline/reply клавіатури
├── mini_app/
│   └── src/
│       ├── App.jsx          ← Головний компонент, bottom nav, роутинг
│       ├── api.js           ← Всі fetch-запити до FastAPI
│       ├── hooks/
│       │   └── useCart.js   ← CartProvider + useCart hook
│       ├── components/
│       │   └── ProductCard.jsx
│       └── pages/
│           ├── CatalogPage.jsx
│           ├── CategoryPage.jsx
│           ├── ProductPage.jsx
│           ├── CartPage.jsx
│           ├── SearchPage.jsx
│           ├── OrdersPage.jsx
│           └── WishlistPage.jsx
├── scheduler/
│   └── tasks.py             ← APScheduler: daily post, price check, abandoned cart
├── config.py                ← pydantic Settings (читає .env)
├── push_fix.bat             ← npm run build + git add/commit/push
└── run_all.py               ← Запускає бота + FastAPI разом
```

## Core patterns — дотримуйся їх завжди

### 1. Repository pattern (database/repo.py)
Жодних прямих SQL-запитів у роутах або хендлерах. Всі звернення до БД через функції в `repo.py`.

```python
# repo.py
async def get_something(session: AsyncSession, param: int) -> Something | None:
    result = await session.execute(
        select(Something).where(Something.id == param)
    )
    return result.scalar_one_or_none()
```

### 2. HMAC-SHA256 auth для API
Будь-який ендпоінт, що потребує авторизації, перевіряє `x-telegram-init-data` заголовок.
Вже є готова функція `validate_init_data(init_data: str) -> dict` (дивись orders.py або wishlist.py).

```python
from api.routes.orders import validate_init_data  # або скопіюй у свій роутер

@router.post("/something")
async def do_something(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    init_data = request.headers.get("x-telegram-init-data", "")
    user_data = validate_init_data(init_data)  # кидає HTTPException якщо невалідно
    telegram_id = int(user_data["user"]["id"])
```

### 3. Додавання нового роутера (api/main.py)
```python
from api.routes.my_feature import router as my_router
app.include_router(my_router, prefix="/api")
```

### 4. Нова сторінка Mini App (App.jsx)
```jsx
// 1. Імпортуй
import MyPage from "./pages/MyPage";

// 2. Додай до BACK_PAGES якщо потрібна кнопка "назад"
const BACK_PAGES = new Set([..., "my_page"]);

// 3. Рендери
{page === "my_page" && <MyPage onBack={handleBack} />}

// 4. Додай таб до BottomNav items (якщо потрібно)
{ key: "my_page", icon: "🔔", label: "Назва" }
```

### 5. Новий API-метод (api.js)
```javascript
myMethod: (param, initData) =>
  apiFetch(`/my-endpoint/${param}`, {
    method: "POST",
    headers: { "x-telegram-init-data": initData },
    body: JSON.stringify({ param }),
  }),
```

### 6. Новий APScheduler job (scheduler/tasks.py)
```python
_scheduler.add_job(
    my_task_func,
    trigger=IntervalTrigger(minutes=30),  # або CronTrigger(hour=9)
    args=[bot],
    id="my_task_id",
    replace_existing=True,
)
```

### 7. Нова ORM-модель (database/models.py)
```python
class MyModel(Base):
    __tablename__ = "my_table"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    # ... поля
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

### 8. Bottom nav — висота
Всі сторінки мають `paddingBottom: 80` (або більше якщо є фіксована кнопка внизу).
Footer кнопки: `position: "fixed", bottom: 60` (60px = висота bottom nav).

### 9. Стилізація (inline styles)
Проєкт використовує React inline styles (об'єкт `styles` в кінці файлу).
Кольорова схема: `#2481cc` (Telegram blue), `#e53935` (red/badge), `#43a047` (green/success).

## Workflow для нової функції

### Крок 1: Backend
1. **models.py** — додай нову модель або поля до існуючої
2. **repo.py** — додай функції для роботи з моделлю
3. **api/routes/my_feature.py** — створи новий файл роутера (POST/GET/DELETE)
4. **api/main.py** — підключи роутер

### Крок 2: Frontend
1. **mini_app/src/api.js** — додай нові методи
2. **mini_app/src/pages/MyPage.jsx** — створи нову сторінку
3. **mini_app/src/App.jsx** — підключи сторінку + таб навігації

### Крок 3: Bot (якщо потрібно)
1. **handlers/** — додай новий хендлер
2. **keyboards/** — додай клавіатуру

### Крок 4: Deploy
Запусти `push_fix.bat` (подвійний клік у File Explorer → C:\shop_bot\push_fix.bat).
Він виконає: `npm run build` → `git add -A` → `git commit` → `git push`.
Railway auto-redeploy займає ~2 хвилини.

## Приклади реалізованих функцій (для референсу)

| Функція | Backend | Frontend |
|---|---|---|
| Промокоди | `api/routes/promo.py`, `repo.py:get_promo_code` | `CartPage.jsx` — input + кнопка |
| Вішліст | `api/routes/wishlist.py`, `database/models.py:WishlistItem` | `WishlistPage.jsx`, ♡ у `ProductPage.jsx` |
| Кинутий кошик | `scheduler/tasks.py:check_abandoned_carts` | — (push через бота) |
| Історія замовлень | `api/routes/orders.py:GET /orders/history` | `OrdersPage.jsx` |

## Важливі правила

- **Не чіпай Desktop і Downloads** — це папки користувача, не пов'язані з ботом
- **C:\shop_bot** — тільки для коду бота
- База даних: проєкт не використовує Alembic — нові таблиці треба створювати вручну або через `Base.metadata.create_all()` при старті
- Перед будь-яким Edit файлу — спочатку Read його (або Write повністю)
- Pydantic v2: `model_config = ConfigDict(...)` замість `class Config`
- `selectinload` для eager loading зв'язків ORM
- `UniqueConstraint` для запобігання дублікатів (напр. wishlist)

## Telegram WebApp специфіка

```javascript
const tg = window.Telegram?.WebApp;
const initData = tg?.initData || "";  // порожній рядок у devmode
tg?.HapticFeedback?.notificationOccurred("success");  // тактильний відгук
tg?.close();  // закрити Mini App
```

Лінк для відкриття Mini App з боту: `https://t.me/BotUsername/appname?startapp=PARAM`
