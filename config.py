"""
config.py — конфігурація через .env файл.
Всі секрети зберігаються виключно в .env, не в коді.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Telegram ──────────────────────────────────────────────────────────────
    BOT_TOKEN: str                  # токен від @BotFather
    ADMIN_CHAT_ID: int              # Telegram ID адміністратора
    CHANNEL_ID: str                 # @username або -100xxxxxxxxxx каналу

    # ── База даних ────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///shop.db"
    # Для PostgreSQL: postgresql+asyncpg://user:pass@localhost/dbname

    # ── Публікації в канал ────────────────────────────────────────────────────
    DAILY_POST_HOUR: int = 10       # година (UTC) щоденної публікації
    DAILY_POST_MINUTE: int = 0

    # ── Mini App ──────────────────────────────────────────────────────────────
    MINI_APP_URL: str = ""          # HTTPS URL мінізастосунку (залишіть порожнім якщо не використовується)

    # ── Парсер постачальника ──────────────────────────────────────────────────
    SUPPLIER_BASE_URL: str = ""     # базовий URL сайту постачальника
    PARSER_INTERVAL_MINUTES: int = 60  # інтервал перевірки (хвилини)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# Railway інжектує DATABASE_URL як postgresql:// — конвертуємо для asyncpg
if settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )
