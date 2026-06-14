FROM python:3.11-slim

# Системні залежності + Node.js для збірки React
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libxml2-dev libxslt-dev curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python залежності
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код
COPY . .

# Збірка React Mini App
RUN cd mini_app && npm install && npm run build

# Директорія для логів
RUN mkdir -p logs

CMD ["python", "run_all.py"]
