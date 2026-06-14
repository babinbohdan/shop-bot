"""
utils/logger.py — централізоване налаштування логування.
Імпортуйте get_logger() замість стандартного logging.getLogger().
"""

import logging
import sys
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)


def setup_logging(level: int = logging.INFO) -> None:
    """
    Налаштовує root logger:
      - Виводить у консоль (stdout)
      - Пише у файл logs/bot.log (з ротацією)
    Викликати один раз на старті з main.py.
    """
    from logging.handlers import RotatingFileHandler

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)-8s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # ── Консоль ───────────────────────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(fmt)
    console_handler.setLevel(level)

    # ── Файл (макс. 5 МБ, 3 резервні копії) ──────────────────────────────────
    file_handler = RotatingFileHandler(
        LOG_DIR / "bot.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(fmt)
    file_handler.setLevel(level)

    # ── Окремий файл для помилок ──────────────────────────────────────────────
    error_handler = RotatingFileHandler(
        LOG_DIR / "errors.log",
        maxBytes=2 * 1024 * 1024,
        backupCount=2,
        encoding="utf-8",
    )
    error_handler.setFormatter(fmt)
    error_handler.setLevel(logging.ERROR)

    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(console_handler)
    root.addHandler(file_handler)
    root.addHandler(error_handler)

    # Знижуємо вербозність сторонніх бібліотек
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
