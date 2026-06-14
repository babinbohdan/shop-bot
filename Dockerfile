FROM python:3.11-slim

# Системні залежності для lxml та aiohttp
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libxml2-dev libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Спочатку копіюємо лише requirements — щоб Docker кешував шар
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо решту коду
COPY . .

# Директорія для логів
RUN mkdir -p logs

CMD ["python", "run_all.py"]
