// ТЗ Генератор — Інтернет-магазин дитячих товарів
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Header, Footer, PageNumber, TableOfContents,
  ExternalHyperlink,
} = require("docx");
const fs = require("fs");

// ─── helpers ────────────────────────────────────────────────────────────────
const B  = (t, sz = 24) => new TextRun({ text: t, bold: true, size: sz });
const R  = (t, sz = 24) => new TextRun({ text: t, size: sz });
const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, bold: true, size: 32, color: "1E3A5F" })],
  spacing: { before: 360, after: 180 },
  pageBreakBefore: true,
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, bold: true, size: 28, color: "2E5FA3" })],
  spacing: { before: 280, after: 120 },
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, bold: true, size: 26, color: "3A7BD5" })],
  spacing: { before: 200, after: 80 },
});
const P  = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 24, ...opts })],
  spacing: { before: 60, after: 60 },
});
const SPACE = () => new Paragraph({ children: [new TextRun({ text: "", size: 24 })], spacing: { before: 40, after: 40 } });

const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border };
const hdrBorder = { style: BorderStyle.SINGLE, size: 4, color: "2E5FA3" };
const hdrBorders = { top: hdrBorder, bottom: hdrBorder, left: hdrBorder, right: hdrBorder };
const cellMargins = { top: 100, bottom: 100, left: 150, right: 150 };

function bullet(text, sub = false) {
  return new Paragraph({
    numbering: { reference: sub ? "sub-bullets" : "bullets", level: 0 },
    children: [new TextRun({ text, size: 24 })],
    spacing: { before: 40, after: 40 },
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, size: 24 })],
    spacing: { before: 60, after: 60 },
  });
}

function hdrRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) => new TableCell({
      borders: hdrBorders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })], alignment: AlignmentType.CENTER })],
    })),
  });
}

function dataRow(cells, widths, shaded = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shaded ? "F0F4FA" : "FFFFFF", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { before: 40, after: 40 } })],
    })),
  });
}

function table2(rows, w1 = 3000, w2 = 6360) {
  const total = w1 + w2;
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: [w1, w2],
    rows,
  });
}

function table3(rows, w1 = 2500, w2 = 3000, w3 = 3860) {
  const total = w1 + w2 + w3;
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: [w1, w2, w3],
    rows,
  });
}

function table4(rows, widths) {
  return new Table({
    width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "sub-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 24, color: "1A1A2E" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E5FA3" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "3A7BD5" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    // ═══════════════════════════ TITLE PAGE ═══════════════════════════════
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "ТЕХНІЧНЕ ЗАВДАННЯ | Інтернет-магазин дитячих товарів", size: 18, color: "6B7280" }),
              new TextRun({ text: "\t", size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "6B7280" }),
            ],
            tabStops: [{ type: "right", position: 9026 }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ text: "Конфіденційно. Всі права захищено. " + new Date().getFullYear(), size: 18, color: "9CA3AF" })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [
        SPACE(), SPACE(), SPACE(), SPACE(),
        new Paragraph({
          children: [new TextRun({ text: "ТЕХНІЧНЕ ЗАВДАННЯ", bold: true, size: 52, color: "1E3A5F" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Сучасний інтернет-магазин дитячих товарів", size: 36, color: "2E5FA3" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Іграшки • Транспорт • Розвиваючі ігри • Дитячий одяг", size: 24, color: "64748B" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
        }),
        SPACE(), SPACE(),
        new Paragraph({
          children: [new TextRun({ text: "Версія: 1.0", size: 22, color: "6B7280" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Статус: DRAFT", size: 22, color: "EF4444", bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Дата: " + new Date().toLocaleDateString("uk-UA", { year: "numeric", month: "long", day: "numeric" }), size: 22, color: "6B7280" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
        }),
        SPACE(), SPACE(), SPACE(),
        new Paragraph({
          children: [new TextRun({ text: "Розроблено на основі наявного Telegram-бота магазину іграшок.", size: 22, color: "9CA3AF", italics: true })],
          alignment: AlignmentType.CENTER,
        }),

        // TOC
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          children: [new TextRun({ text: "ЗМІСТ", bold: true, size: 36, color: "1E3A5F" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 360 },
        }),
        new TableOfContents("Зміст", { hyperlink: true, headingStyleRange: "1-3" }),
      ],
    },

    // ═══════════════════════════ CONTENT SECTION ══════════════════════════
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "ТЕХНІЧНЕ ЗАВДАННЯ | Інтернет-магазин дитячих товарів", size: 18, color: "6B7280" }),
              new TextRun({ text: "\t", size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "6B7280" }),
            ],
            tabStops: [{ type: "right", position: 9026 }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ text: "Конфіденційно. Всі права захищено. " + new Date().getFullYear(), size: 18, color: "9CA3AF" })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [

        // ═══════════════ 1. ОГЛЯД ПРОЄКТУ ═══════════════
        H1("1. ОГЛЯД ПРОЄКТУ"),
        P("Цей документ описує технічне завдання для розробки сучасного e-commerce рішення у ніші дитячих товарів. Проєкт є логічним розширенням існуючого Telegram-бота магазину іграшок, що вже включає каталог товарів, кошик, оформлення замовлень, вішліст, промокоди та автоматизовані повідомлення."),
        P("Мета — створити повноцінний веб-магазин, що перевершує конкурентів (зокрема igrushki7) за зручністю, функціоналом та рівнем автоматизації."),
        SPACE(),
        H2("1.1. Цільова аудиторія"),
        bullet("Батьки дітей від 0 до 14 років"),
        bullet("Бабусі та дідусі, які обирають подарунки"),
        bullet("Вихователі та педагоги дошкільних закладів"),
        bullet("Корпоративні клієнти (дитячі садочки, школи, організатори свят)"),
        SPACE(),
        H2("1.2. Ключові конкурентні переваги"),
        bullet("AI-пошук з розпізнаванням синонімів і помилок (\"лєго\" → \"LEGO\")"),
        bullet("Фільтрація за віком з точністю до місяців для немовлят"),
        bullet("Система бонусних \"монеток\" (гейміфікація лояльності)"),
        bullet("Двонапрямна інтеграція з Telegram-ботом"),
        bullet("360° перегляд товарів та відеоогляди"),
        bullet("One-page checkout з Apple Pay / Google Pay / Нова Пошта"),

        // ═══════════════ 2. СТЕК ТЕХНОЛОГІЙ ═══════════════
        H1("2. СТЕК ТЕХНОЛОГІЙ"),
        P("Стек обрано з урахуванням масштабованості, продуктивності під великим навантаженням (50 000+ товарів, 10 000+ одночасних користувачів) та швидкості розробки."),
        SPACE(),

        H2("2.1. Frontend"),
        table2([
          hdrRow(["Категорія", "Технологія / Бібліотека"], [2800, 6560]),
          dataRow(["Фреймворк", "Next.js 14 (App Router) — SSR + SSG + ISR для SEO"], [2800, 6560]),
          dataRow(["Мова", "TypeScript 5 — типобезпека, автодоповнення, менше помилок"], [2800, 6560], true),
          dataRow(["UI компоненти", "shadcn/ui + Tailwind CSS 3 — доступні, кастомізовані компоненти"], [2800, 6560]),
          dataRow(["Анімації", "Framer Motion — плавні переходи, мікро-анімації, 3D-ефекти"], [2800, 6560], true),
          dataRow(["Стан", "Zustand (глобальний) + React Query / TanStack Query (серверний)"], [2800, 6560]),
          dataRow(["3D/360°", "Three.js + React Three Fiber — перегляд товарів у 3D"], [2800, 6560], true),
          dataRow(["Форми", "React Hook Form + Zod — валідація на клієнті"], [2800, 6560]),
          dataRow(["Пошук", "Algolia InstantSearch React — миттєвий AI-пошук"], [2800, 6560], true),
          dataRow(["Тести", "Vitest + Playwright (E2E)"], [2800, 6560]),
          dataRow(["i18n", "next-intl — українська / російська / англійська"], [2800, 6560], true),
        ], 2800, 6560),
        SPACE(),

        H2("2.2. Backend"),
        table2([
          hdrRow(["Категорія", "Технологія"], [2800, 6560]),
          dataRow(["Runtime", "Node.js 20 LTS + Fastify 4 (вдвічі швидше Express)"], [2800, 6560]),
          dataRow(["API", "REST API + GraphQL (Apollo Server) для складних запитів"], [2800, 6560], true),
          dataRow(["ORM", "Prisma 5 — типобезпечні запити, міграції, сидування"], [2800, 6560]),
          dataRow(["Черги", "BullMQ (Redis-based) — обробка замовлень, email, push"], [2800, 6560], true),
          dataRow(["Пошук", "Elasticsearch 8 / Algolia — повнотекстовий AI-пошук"], [2800, 6560]),
          dataRow(["Кеш", "Redis 7 — сесії, кешування категорій, rate limiting"], [2800, 6560], true),
          dataRow(["Auth", "NextAuth.js + JWT + OAuth (Google, Apple, Facebook)"], [2800, 6560]),
          dataRow(["Telegram Bot", "aiogram 3.x (Python) — наявний бот, розширений API"], [2800, 6560], true),
          dataRow(["Email", "Resend + React Email — транзакційні листи"], [2800, 6560]),
          dataRow(["Файли", "AWS S3 / Cloudflare R2 + CloudFront CDN"], [2800, 6560], true),
          dataRow(["Тести", "Jest + Supertest (integration)"], [2800, 6560]),
        ], 2800, 6560),
        SPACE(),

        H2("2.3. База даних"),
        table2([
          hdrRow(["База даних", "Призначення"], [2800, 6560]),
          dataRow(["PostgreSQL 16", "Основна реляційна БД — товари, замовлення, користувачі"], [2800, 6560]),
          dataRow(["Redis 7", "Кеш, сесії, чорги, pub/sub для real-time оновлень"], [2800, 6560], true),
          dataRow(["Elasticsearch 8", "Повнотекстовий пошук, фасетна фільтрація, синоніми"], [2800, 6560]),
          dataRow(["MongoDB", "Логи, аналітика подій, A/B тести, відгуки (semi-structured)"], [2800, 6560], true),
          dataRow(["ClickHouse", "OLAP аналітика — конверсії, воронка продажів, когорти"], [2800, 6560]),
        ], 2800, 6560),
        SPACE(),

        H2("2.4. Інфраструктура та DevOps"),
        table2([
          hdrRow(["Компонент", "Рішення"], [2800, 6560]),
          dataRow(["Хостинг Backend", "Railway.app / AWS ECS Fargate (auto-scaling)"], [2800, 6560]),
          dataRow(["Хостинг Frontend", "Vercel (Next.js native) — Edge Network, ISR"], [2800, 6560], true),
          dataRow(["CDN", "Cloudflare — статика, DDoS захист, WAF"], [2800, 6560]),
          dataRow(["Контейнери", "Docker + Docker Compose (dev) / Kubernetes (prod)"], [2800, 6560], true),
          dataRow(["CI/CD", "GitHub Actions — тести, build, deploy при push"], [2800, 6560]),
          dataRow(["Моніторинг", "Sentry (помилки) + Grafana + Prometheus (метрики)"], [2800, 6560], true),
          dataRow(["Логи", "Axiom / Loki — централізовані логи"], [2800, 6560]),
          dataRow(["Secrets", "Doppler / AWS Secrets Manager"], [2800, 6560], true),
        ], 2800, 6560),

        // ═══════════════ 3. СТРУКТУРА БАЗИ ДАНИХ ═══════════════
        H1("3. СТРУКТУРА БАЗИ ДАНИХ"),
        P("Нижче описані ключові таблиці PostgreSQL та їхні зв'язки. Використовується Prisma ORM з підтримкою міграцій."),
        SPACE(),

        H2("3.1. Таблиця: users (Користувачі)"),
        table4([
          hdrRow(["Поле", "Тип", "Опис"], [2200, 2000, 5160]),
          dataRow(["id", "UUID PK", "Унікальний ідентифікатор"], [2200, 2000, 5160]),
          dataRow(["telegram_id", "BIGINT UNIQUE", "ID у Telegram (синхронізація з ботом)"], [2200, 2000, 5160], true),
          dataRow(["email", "VARCHAR(255) UNIQUE", "Email для авторизації"], [2200, 2000, 5160]),
          dataRow(["phone", "VARCHAR(20)", "Телефон (підтверджений через SMS/Telegram)"], [2200, 2000, 5160], true),
          dataRow(["full_name", "VARCHAR(120)", "ПІБ користувача"], [2200, 2000, 5160]),
          dataRow(["city", "VARCHAR(80)", "Місто доставки за замовчуванням"], [2200, 2000, 5160], true),
          dataRow(["delivery_type", "ENUM", "nova_poshta / ukrposhta / courier / pickup"], [2200, 2000, 5160]),
          dataRow(["role", "ENUM", "customer / admin / manager / support"], [2200, 2000, 5160], true),
          dataRow(["bonus_coins", "INTEGER DEFAULT 0", "Накопичені бонусні монетки"], [2200, 2000, 5160]),
          dataRow(["birthday", "DATE", "День народження (для персональних знижок)"], [2200, 2000, 5160], true),
          dataRow(["children_birthdates", "DATE[]", "Дні народження дітей (нагадування)"], [2200, 2000, 5160]),
          dataRow(["is_registered", "BOOLEAN DEFAULT false", "Завершив реєстрацію в боті"], [2200, 2000, 5160], true),
          dataRow(["is_blocked", "BOOLEAN DEFAULT false", "Заблокований"], [2200, 2000, 5160]),
          dataRow(["oauth_provider", "VARCHAR(30)", "google / apple / facebook"], [2200, 2000, 5160], true),
          dataRow(["created_at", "TIMESTAMPTZ", "Дата реєстрації"], [2200, 2000, 5160]),
          dataRow(["updated_at", "TIMESTAMPTZ", "Дата оновлення"], [2200, 2000, 5160], true),
        ], [2200, 2000, 5160]),
        SPACE(),

        H2("3.2. Таблиця: categories (Категорії)"),
        table4([
          hdrRow(["Поле", "Тип", "Опис"], [2200, 2000, 5160]),
          dataRow(["id", "INTEGER PK", "Ідентифікатор категорії"], [2200, 2000, 5160]),
          dataRow(["parent_id", "INTEGER FK → categories", "Батьківська категорія (дерево)"], [2200, 2000, 5160], true),
          dataRow(["slug", "VARCHAR(120) UNIQUE", "SEO-URL: /catalog/igrushki"], [2200, 2000, 5160]),
          dataRow(["name_uk / name_ru", "VARCHAR(120)", "Назва українською / російською"], [2200, 2000, 5160], true),
          dataRow(["description", "TEXT", "Опис категорії для SEO"], [2200, 2000, 5160]),
          dataRow(["image_url", "VARCHAR(500)", "Зображення категорії"], [2200, 2000, 5160], true),
          dataRow(["icon", "VARCHAR(50)", "Emoji або код іконки"], [2200, 2000, 5160]),
          dataRow(["supplier_group_id", "INTEGER", "ID групи у постачальника (синхронізація)"], [2200, 2000, 5160], true),
          dataRow(["meta_title / meta_desc", "TEXT", "SEO мета-теги"], [2200, 2000, 5160]),
          dataRow(["sort_order", "INTEGER DEFAULT 0", "Порядок відображення"], [2200, 2000, 5160], true),
          dataRow(["is_active", "BOOLEAN DEFAULT true", "Видима у каталозі"], [2200, 2000, 5160]),
        ], [2200, 2000, 5160]),
        SPACE(),

        H2("3.3. Таблиця: products (Товари)"),
        table4([
          hdrRow(["Поле", "Тип", "Опис"], [2200, 2000, 5160]),
          dataRow(["id", "INTEGER PK", "Ідентифікатор товару"], [2200, 2000, 5160]),
          dataRow(["category_id", "INTEGER FK → categories", "Категорія товару"], [2200, 2000, 5160], true),
          dataRow(["supplier_id", "INTEGER UNIQUE", "ID товару у постачальника"], [2200, 2000, 5160]),
          dataRow(["slug", "VARCHAR(300) UNIQUE", "SEO-URL товару"], [2200, 2000, 5160], true),
          dataRow(["name_uk / name_ru", "VARCHAR(300)", "Назва товару"], [2200, 2000, 5160]),
          dataRow(["description", "TEXT", "Детальний опис"], [2200, 2000, 5160], true),
          dataRow(["price / old_price", "NUMERIC(10,2)", "Ціна поточна / стара (для знижки)"], [2200, 2000, 5160]),
          dataRow(["supplier_price", "NUMERIC(10,2)", "Собівартість (прихована)"], [2200, 2000, 5160], true),
          dataRow(["currency", "CHAR(3) DEFAULT 'UAH'", "Валюта ціни"], [2200, 2000, 5160]),
          dataRow(["images", "JSONB", "[{url, alt, order, is_3d}] масив фото"], [2200, 2000, 5160], true),
          dataRow(["video_url", "VARCHAR(500)", "Посилання на відеоогляд YouTube/Vimeo"], [2200, 2000, 5160]),
          dataRow(["model_3d_url", "VARCHAR(500)", "URL для 3D-моделі (.glb/.gltf)"], [2200, 2000, 5160], true),
          dataRow(["vendor / brand", "VARCHAR(100)", "Виробник / бренд"], [2200, 2000, 5160]),
          dataRow(["barcode / sku", "VARCHAR(100)", "Штрихкод / артикул"], [2200, 2000, 5160], true),
          dataRow(["weight_kg / dimensions", "NUMERIC / JSONB", "Вага та розміри (для доставки)"], [2200, 2000, 5160]),
          dataRow(["in_stock", "BOOLEAN DEFAULT true", "Наявність на складі"], [2200, 2000, 5160], true),
          dataRow(["stock_quantity", "INTEGER DEFAULT 0", "Кількість одиниць на складі"], [2200, 2000, 5160]),
          dataRow(["meta_title / meta_desc", "TEXT", "SEO мета-теги"], [2200, 2000, 5160], true),
          dataRow(["avg_rating", "NUMERIC(3,2)", "Середній рейтинг (кешований)"], [2200, 2000, 5160]),
          dataRow(["reviews_count", "INTEGER DEFAULT 0", "Кількість відгуків (кешована)"], [2200, 2000, 5160], true),
          dataRow(["sales_count", "INTEGER DEFAULT 0", "Кількість продажів (для топ-товарів)"], [2200, 2000, 5160]),
          dataRow(["is_active / is_featured", "BOOLEAN", "Активний / Рекомендований"], [2200, 2000, 5160], true),
          dataRow(["created_at / updated_at", "TIMESTAMPTZ", "Дати створення та оновлення"], [2200, 2000, 5160]),
        ], [2200, 2000, 5160]),
        SPACE(),

        H2("3.4. Таблиця: product_attributes (Атрибути товару — фільтри)"),
        table4([
          hdrRow(["Поле", "Тип", "Опис"], [2200, 2000, 5160]),
          dataRow(["product_id", "INTEGER FK", "Товар"], [2200, 2000, 5160]),
          dataRow(["age_min_months", "SMALLINT", "Мінімальний вік у місяцях (0 = 0+)"], [2200, 2000, 5160], true),
          dataRow(["age_max_months", "SMALLINT", "Максимальний вік у місяцях"], [2200, 2000, 5160]),
          dataRow(["gender", "ENUM", "boy / girl / unisex"], [2200, 2000, 5160], true),
          dataRow(["material", "VARCHAR[]", "eco / wood / plastic / metal / fabric"], [2200, 2000, 5160]),
          dataRow(["skills", "VARCHAR[]", "logic / motor / creativity / social / stem"], [2200, 2000, 5160], true),
          dataRow(["color", "VARCHAR[]", "Масив кольорів"], [2200, 2000, 5160]),
          dataRow(["country_of_origin", "CHAR(2)", "UA / PL / CN / DE тощо"], [2200, 2000, 5160], true),
          dataRow(["certificate", "VARCHAR[]", "CE / EN71 / ASTM сертифікати"], [2200, 2000, 5160]),
          dataRow(["battery_required", "BOOLEAN", "Чи потрібні батарейки"], [2200, 2000, 5160], true),
        ], [2200, 2000, 5160]),
        SPACE(),

        H2("3.5. Таблиця: orders (Замовлення)"),
        table4([
          hdrRow(["Поле", "Тип", "Опис"], [2200, 2000, 5160]),
          dataRow(["id", "UUID PK", "Ідентифікатор замовлення"], [2200, 2000, 5160]),
          dataRow(["order_number", "VARCHAR(20) UNIQUE", "Номер замовлення: #UA-2024-00001"], [2200, 2000, 5160], true),
          dataRow(["user_id", "UUID FK → users", "Покупець"], [2200, 2000, 5160]),
          dataRow(["status", "ENUM", "new / confirmed / paid / packed / shipped / delivered / cancelled"], [2200, 2000, 5160], true),
          dataRow(["payment_status", "ENUM", "pending / paid / refunded / failed"], [2200, 2000, 5160]),
          dataRow(["payment_method", "ENUM", "card / apple_pay / google_pay / liqpay / cod"], [2200, 2000, 5160], true),
          dataRow(["delivery_method", "ENUM", "nova_poshta / ukrposhta / courier / pickup"], [2200, 2000, 5160]),
          dataRow(["delivery_address", "JSONB", "{city, street, department_number, tracking_id}"], [2200, 2000, 5160], true),
          dataRow(["subtotal / discount", "NUMERIC(12,2)", "Сума товарів / знижка"], [2200, 2000, 5160]),
          dataRow(["delivery_cost", "NUMERIC(8,2)", "Вартість доставки"], [2200, 2000, 5160], true),
          dataRow(["total_price", "NUMERIC(12,2)", "Фінальна сума"], [2200, 2000, 5160]),
          dataRow(["promo_code_id", "INTEGER FK", "Застосований промокод"], [2200, 2000, 5160], true),
          dataRow(["coins_used / coins_earned", "INTEGER", "Монетки витрачені / нараховані"], [2200, 2000, 5160]),
          dataRow(["comment", "TEXT", "Коментар до замовлення"], [2200, 2000, 5160], true),
          dataRow(["source", "ENUM", "web / telegram_bot / telegram_webapp / mobile"], [2200, 2000, 5160]),
          dataRow(["tracking_number", "VARCHAR(50)", "Номер відстеження посилки"], [2200, 2000, 5160], true),
          dataRow(["created_at / updated_at", "TIMESTAMPTZ", "Дати"], [2200, 2000, 5160]),
        ], [2200, 2000, 5160]),
        SPACE(),

        H2("3.6. Додаткові таблиці"),
        table3([
          hdrRow(["Таблиця", "Призначення", "Ключові поля"], [2200, 3000, 4160]),
          dataRow(["order_items", "Позиції замовлення", "order_id, product_id, qty, price_at_order"], [2200, 3000, 4160]),
          dataRow(["cart_items", "Кошик (persistent)", "user_id, product_id, quantity, added_at"], [2200, 3000, 4160], true),
          dataRow(["wishlist_items", "Список бажань", "user_id, product_id, added_at"], [2200, 3000, 4160]),
          dataRow(["reviews", "Відгуки та рейтинги", "user_id, product_id, rating 1-5, text, photos[], is_verified"], [2200, 3000, 4160], true),
          dataRow(["promo_codes", "Промокоди", "code, type, value, max_uses, expires_at"], [2200, 3000, 4160]),
          dataRow(["bonus_transactions", "Рух монеток", "user_id, amount, type, order_id, description"], [2200, 3000, 4160], true),
          dataRow(["product_tags", "Теги товарів", "product_id, tag (хіт/новинка/акція/ексклюзив)"], [2200, 3000, 4160]),
          dataRow(["product_bundles", "Комплекти \"купують разом\"", "product_id, related_product_id, frequency"], [2200, 3000, 4160], true),
          dataRow(["notifications", "Push/email черга", "user_id, type, payload, sent_at, status"], [2200, 3000, 4160]),
          dataRow(["children_profiles", "Профілі дітей", "user_id, name, birthdate, gender"], [2200, 3000, 4160], true),
          dataRow(["suppliers", "Постачальники", "name, api_url, sync_interval, last_synced_at"], [2200, 3000, 4160]),
          dataRow(["price_history", "Історія цін", "product_id, price, recorded_at"], [2200, 3000, 4160], true),
        ], 2200, 3000, 4160),

        // ═══════════════ 4. ДИЗАЙН ТА UI/UX ═══════════════
        H1("4. ДИЗАЙН ТА UI/UX"),
        SPACE(),

        H2("4.1. Дизайн-система"),
        table2([
          hdrRow(["Параметр", "Значення"], [2800, 6560]),
          dataRow(["Стиль", "Squishy Minimalism — мінімалізм з м'якими, теплими акцентами"], [2800, 6560]),
          dataRow(["Основний колір", "#2481CC (Telegram Blue) + #FFD166 (акцент — дитяча жовта)"], [2800, 6560], true),
          dataRow(["Фоновий колір", "#FAFBFF — дуже м'який холодний білий"], [2800, 6560]),
          dataRow(["Небезпека / акції", "#FF6B6B (коралово-червоний) — приємніший за різкий червоний"], [2800, 6560], true),
          dataRow(["Успіх", "#43A047 (зелений) — підтвердження дій"], [2800, 6560]),
          dataRow(["Шрифт заголовків", "Nunito (Google Fonts) — заокруглений, дружній, читабельний"], [2800, 6560], true),
          dataRow(["Шрифт тексту", "Inter (Google Fonts) — сучасний, нейтральний, пара з Nunito"], [2800, 6560]),
          dataRow(["Заокруглення", "12px (картки) / 8px (кнопки) / 999px (chips/pill-теги)"], [2800, 6560], true),
          dataRow(["Тіні", "Soft shadows: box-shadow: 0 4px 20px rgba(0,0,0,0.08)"], [2800, 6560]),
          dataRow(["Анімації", "Framer Motion — ease-out 300-400ms, spring physics для drag"], [2800, 6560], true),
          dataRow(["Іконки", "Lucide React — outline стиль, 24px grid"], [2800, 6560]),
        ], 2800, 6560),
        SPACE(),

        H2("4.2. Гейміфікація — система \"Монеток\""),
        bullet("За кожну гривню покупки нараховується 1 монетка (1 UAH = 1 coin)"),
        bullet("100 монеток = 5 UAH знижки на наступне замовлення"),
        bullet("Бонуси за першу покупку: +200 монеток"),
        bullet("Бонуси за день народження: +500 монеток у місяць народження"),
        bullet("Бонуси за відгук із фото: +100 монеток"),
        bullet("Бонуси за запрошення друга: +300 монеток (після його першого замовлення)"),
        bullet("Монетки згорають через 12 місяців бездіяльності"),
        SPACE(),
        P("Відображення: прогрес-бар в особистому кабінеті, анімація нарахування монеток після замовлення, push-нагадування \"У вас 450 монеток! Ще 50 до знижки 25 грн\"."),

        // ═══════════════ 5. АРХІТЕКТУРА ГОЛОВНОЇ СТОРІНКИ ═══════════════
        H1("5. АРХІТЕКТУРА ГОЛОВНОЇ СТОРІНКИ"),
        P("Головна сторінка складається з 10 блоків, що будуються за принципом \"від уваги до конверсії\". Кожен блок SSG/ISR рендериться на сервері для максимального SEO та швидкості завантаження."),
        SPACE(),

        H2("Блок 1: Header (Шапка) — Sticky при скролі"),
        bullet("Логотип + назва магазину (SVG, анімований при hover)"),
        bullet("AI-рядок пошуку: автодоповнення, розпізнавання синонімів, зображення у результатах"),
        bullet("Іконки: Кошик (badge з кількістю) / Вішліст (badge) / Особистий кабінет / Мова"),
        bullet("Мега-меню при hover на \"Каталог\" — всі категорії з зображеннями та популярними підкатегоріями"),
        bullet("Мобільний: hamburger → bottom sheet з меню"),
        SPACE(),

        H2("Блок 2: Hero Banner — Каруселна з автоплеєм"),
        bullet("Повноширинний слайдер (до 5 слайдів): акція / сезонна кампанія / новинки"),
        bullet("Кожен слайд: фото/відео фон, заголовок, підзаголовок, CTA кнопка"),
        bullet("Bullet навігація, swipe на мобільному, lazy load зображень"),
        bullet("Lazy автопрогравання з паузою при hover"),
        SPACE(),

        H2("Блок 3: Топ-категорії — Quick Access Grid"),
        bullet("8-12 категорій у вигляді кольорових карток з emoji/ілюстрацією та назвою"),
        bullet("Горизонтальний скрол на мобільному (snap scrolling)"),
        bullet("Hover: легке збільшення картки (scale 1.05) + тінь"),
        SPACE(),

        H2("Блок 4: Промо-стрічка (Marquee)"),
        bullet("Нескінченно прокручуваний рядок: \"🚚 Безкоштовна доставка від 500 грн\" / \"🎁 Подарунок при замовленні від 1000 грн\""),
        bullet("Пауза при hover, анімація Framer Motion"),
        SPACE(),

        H2("Блок 5: Рекомендовані товари — Персоналізована добірка"),
        bullet("Горизонтальний скрол з картками товарів (responsive grid на desktop)"),
        bullet("Для авторизованих: AI-рекомендації на основі переглядів та покупок"),
        bullet("Для гостей: Хіти продажів та Новинки"),
        bullet("Кожна картка: фото, назва, ціна, badge знижки, кнопки кошик + вішліст, рейтинг"),
        SPACE(),

        H2("Блок 6: Банер \"Бонусна програма\" (CTA)"),
        bullet("Яскравий банер з ілюстрацією монеток, опис системи лояльності"),
        bullet("CTA: \"Зареєструйтесь і отримайте 200 монеток\" (для гостей)"),
        bullet("Для авторизованих: \"У вас 340 монеток — використати?\""),
        SPACE(),

        H2("Блок 7: Підбірки за категоріями"),
        bullet("3-4 секції: \"Для малюків до 1 року\", \"Конструктори та STEM\", \"Творчість та малювання\", \"Активні ігри надворі\""),
        bullet("Кожна секція: заголовок + 4 товари + кнопка \"Дивитись всі\""),
        SPACE(),

        H2("Блок 8: Відгуки покупців (Social Proof)"),
        bullet("Каруселна з відгуками: фото покупця, текст, рейтинг, фото товару"),
        bullet("Загальний рейтинг магазину + кількість відгуків"),
        bullet("Відгуки з Rozetka / Google Maps (через API) якщо є"),
        SPACE(),

        H2("Блок 9: Переваги магазину (Trust-блок)"),
        bullet("4 іконки: \"Оригінальні товари\" / \"Гарантія якості\" / \"Швидка доставка\" / \"Легке повернення\""),
        SPACE(),

        H2("Блок 10: Footer"),
        bullet("Навігація: Каталог / Про нас / Доставка і оплата / Повернення / Блог / Контакти"),
        bullet("Соцмережі + кнопка Telegram-бота"),
        bullet("Блок підписки на розсилку (email + знижка 10% за підписку)"),
        bullet("Юридичні посилання: Політика конфіденційності / Публічна оферта"),
        bullet("Платіжні логотипи: Visa / Mastercard / Apple Pay / Google Pay"),

        // ═══════════════ 6. СТОРІНКА ТОВАРУ ═══════════════
        H1("6. СТОРІНКА ТОВАРУ — КАРТКА"),
        SPACE(),

        H2("6.1. Галерея зображень"),
        bullet("Головне фото: 600×600px мінімум, zoom при hover, fullscreen lightbox"),
        bullet("Мініатюри: горизонтальний скрол, клік для зміни головного"),
        bullet("Кнопка 360°: запускає Three.js viewer з обертанням мишею/touch"),
        bullet("Відеоогляд: embedded YouTube/Vimeo або власний відеоплеєр"),
        SPACE(),

        H2("6.2. Інформаційний блок"),
        bullet("Назва, бренд, рейтинг (з посиланням на відгуки), артикул"),
        bullet("Ціна (велика) + стара ціна перекресленою + badge відсотку знижки"),
        bullet("Наявність: зелений \"Є в наявності\" / помаранчевий \"Закінчується\" / червоний \"Немає\""),
        bullet("Лічильник кількості + кнопка \"В кошик\" (яскрава CTA)"),
        bullet("Кнопка вішліст ♡, кнопка порівняння, кнопка \"Поділитись\""),
        bullet("Інформація про нарахування монеток за цю покупку"),
        SPACE(),

        H2("6.3. Атрибути та характеристики"),
        bullet("Вік: \"Від 3 до 7 років\" (з поясненням підбору за віком)"),
        bullet("Стать: хлопчик / дівчинка / унісекс"),
        bullet("Матеріал, колір, країна виробника, сертифікати (CE, EN71)"),
        bullet("Навички, які розвиває: іконки логіки / моторики / творчості"),
        bullet("Вага і розміри (для розрахунку доставки)"),
        SPACE(),

        H2("6.4. Блоки \"Разом купують\" та \"Схожі товари\""),
        bullet("\"З цим товаром купують\" — алгоритм collaborative filtering (дані з order_items)"),
        bullet("\"Схожі іграшки\" — товари тієї ж категорії та вікової групи"),
        bullet("Горизонтальний скрол, до 8 позицій, можна одразу додати до кошика"),
        SPACE(),

        H2("6.5. Відгуки та рейтинг"),
        bullet("Зіркова шкала 1-5 з розбивкою (гістограма по зірках)"),
        bullet("Фільтр: Найкорисніші / Найновіші / З фото"),
        bullet("Кожен відгук: аватар, ім'я, дата, текст, фото, мітка \"Verified Purchase\""),
        bullet("CTA для написання відгуку (доступно лише після покупки товару)"),

        // ═══════════════ 7. КАТАЛОГ ТА ФІЛЬТРАЦІЯ ═══════════════
        H1("7. КАТАЛОГ ТА СИСТЕМА ФІЛЬТРАЦІЇ"),
        SPACE(),

        H2("7.1. Фільтри (AJAX, без перезавантаження)"),
        table2([
          hdrRow(["Фільтр", "Опис реалізації"], [2800, 6560]),
          dataRow(["Ціновий діапазон", "Dual-range slider + числові поля, debounce 400ms"], [2800, 6560]),
          dataRow(["Вік", "Chips-кнопки: 0-6м / 6-12м / 1-2р / 2-3р / 3-6р / 6-9р / 9-12р / 12+р"], [2800, 6560], true),
          dataRow(["Стать", "Хлопчик / Дівчинка / Унісекс (multi-select)"], [2800, 6560]),
          dataRow(["Матеріал", "Еко / Дерево / Пластик / Метал / Тканина (multi-select)"], [2800, 6560], true),
          dataRow(["Навички", "Логіка / Моторика / Творчість / STEM / Соціальні (multi-select)"], [2800, 6560]),
          dataRow(["Бренд", "Чекбокс-список з пошуком, top-10 + \"Показати всі\""], [2800, 6560], true),
          dataRow(["Наявність", "Тогл: тільки в наявності"], [2800, 6560]),
          dataRow(["Знижка", "Тогл: тільки зі знижкою"], [2800, 6560], true),
          dataRow(["Рейтинг", "4★ і вище / 3★ і вище"], [2800, 6560]),
          dataRow(["Матеріал безпеки", "Чекбокси: CE / EN71 / ASTM (сертифіковані)"], [2800, 6560], true),
        ], 2800, 6560),
        SPACE(),

        H2("7.2. Сортування"),
        bullet("Популярні (default) — алгоритм: продажі + переглядам + рейтинг"),
        bullet("Нові надходження (created_at DESC)"),
        bullet("Ціна: дешевші / дорожчі"),
        bullet("Рейтинг: спочатку найкращі"),
        bullet("Знижка: найбільша знижка"),
        SPACE(),

        H2("7.3. Відображення каталогу"),
        bullet("Перемикач: сітка (2 col mobile / 3-4 desktop) vs список (більше тексту)"),
        bullet("Infinite scroll з IntersectionObserver (завантаження по 20 товарів)"),
        bullet("Skeleton loaders для товарів, що завантажуються"),
        bullet("\"Знайдено 2,847 товарів\" + активні теги фільтрів з × для швидкого видалення"),

        // ═══════════════ 8. CHECKOUT ═══════════════
        H1("8. ОФОРМЛЕННЯ ЗАМОВЛЕННЯ (ONE-PAGE CHECKOUT)"),
        SPACE(),

        H2("8.1. Структура сторінки checkout"),
        numbered("Перевірка кошика — список товарів, кількість, ціни, редагування"),
        numbered("Контактні дані — ім'я, телефон, email (авто-заповнення для авторизованих)"),
        numbered("Доставка — Нова Пошта (відділення або адресна), Укрпошта, Самовивіз"),
        numbered("Промокод / Монетки — поле вводу + відображення знижки"),
        numbered("Оплата — картка / Apple Pay / Google Pay / LiqPay / Накладений платіж"),
        numbered("Підсумок — товари + доставка + знижка = загальна сума"),
        numbered("Підтвердження — кнопка \"Оформити замовлення\" + checkbox згоди"),
        SPACE(),

        H2("8.2. Інтеграції для доставки"),
        bullet("Nova Poshta API v2: автодоповнення міста, вибір відділення з картою"),
        bullet("Ukrposhta API: адресна доставка, розрахунок вартості"),
        bullet("Автоматичний розрахунок вартості доставки на основі ваги товарів"),
        bullet("Збереження адреси в профілі для швидкого оформлення наступних замовлень"),
        SPACE(),

        H2("8.3. Інтеграції для оплати"),
        bullet("LiqPay SDK — картки Visa/Mastercard, Apple Pay, Google Pay, Pay Later"),
        bullet("WayForPay — альтернативний еквайринг (failover)"),
        bullet("Накладений платіж — без онлайн-оплати, оплата при отриманні"),
        bullet("Після оплати: webhook підтвердження → оновлення статусу в БД → push сповіщення"),

        // ═══════════════ 9. TELEGRAM ІНТЕГРАЦІЯ ═══════════════
        H1("9. TELEGRAM ІНТЕГРАЦІЯ"),
        SPACE(),

        H2("9.1. Наявний Telegram-бот (базові функції)"),
        P("Існуючий бот (aiogram 3.7, Python) вже реалізує:"),
        bullet("Реєстрацію користувачів через FSM (телефон → ПІБ → місто → доставка)"),
        bullet("Telegram Mini App (React) — каталог, кошик, пошук, вішліст, замовлення"),
        bullet("Push-нагадування про кинутий кошик (APScheduler)"),
        bullet("Промокоди з HMAC-валідацією"),
        bullet("Щоденна публікація товарів у канал"),
        SPACE(),

        H2("9.2. Розширення для веб-магазину"),
        bullet("Webhooks у обох напрямках: веб-замовлення → бот → push покупцю"),
        bullet("Авторизація на сайті через Telegram Login Widget (OAuth)"),
        bullet("Синхронізація вішліста: додав на сайті → з'явився у боті і навпаки"),
        bullet("Сповіщення про зміну ціни: якщо товар у вішлісті подешевшав — push у Telegram"),
        bullet("Трекінг замовлення через бота: /status → останній статус"),
        bullet("Адмін-панель у Telegram для операторів: швидке підтвердження, зміна статусів"),

        // ═══════════════ 10. ОСОБИСТИЙ КАБІНЕТ ═══════════════
        H1("10. ОСОБИСТИЙ КАБІНЕТ"),
        SPACE(),

        H2("10.1. Розділи кабінету"),
        table2([
          hdrRow(["Розділ", "Функціонал"], [2800, 6560]),
          dataRow(["Мої замовлення", "Список з фільтром статусу, детальна картка, статус у реальному часі"], [2800, 6560]),
          dataRow(["Відстеження", "Інтеграція з НП / Укрпошта — трекінг безпосередньо в кабінеті"], [2800, 6560], true),
          dataRow(["Список бажань", "Вішліст з можливістю ділитись посиланням (до Нового Року і т.д.)"], [2800, 6560]),
          dataRow(["Мої монетки", "Баланс, історія нарахувань/витрат, прогрес до наступної знижки"], [2800, 6560], true),
          dataRow(["Профілі дітей", "Ім'я, вік, стать кожної дитини — для персоналізованих рекомендацій"], [2800, 6560]),
          dataRow(["Нагадування", "День народження дитини: нагадування за 14/7/1 день + пропозиції подарунків"], [2800, 6560], true),
          dataRow(["Мої відгуки", "Написані відгуки, відгуки очікують (pending after order)"], [2800, 6560]),
          dataRow(["Налаштування", "Email/SMS сповіщення, мова, пароль, прив'язка Telegram"], [2800, 6560], true),
          dataRow(["Адреси доставки", "Збережені адреси: додати / редагувати / видалити"], [2800, 6560]),
        ], 2800, 6560),

        // ═══════════════ 11. AI-ПОШУК ═══════════════
        H1("11. AI-ПОШУК ТА РЕКОМЕНДАЦІЇ"),
        SPACE(),

        H2("11.1. Повнотекстовий AI-пошук"),
        bullet("Движок: Elasticsearch 8 з Ukrainian analyzer (морфологія, стемінг)"),
        bullet("Синоніми: лєго → LEGO, конструктор → lego, машинка → автомобіль іграшка"),
        bullet("Виправлення помилок: fuzzy search з max_edits: 2"),
        bullet("Автодоповнення (suggest): починає підказувати з 2 символів, debounce 200ms"),
        bullet("Пошук по: назві, опису, бренду, артикулу, тегах"),
        bullet("Результати в пошуку: назва товару + фото + ціна (instant search)"),
        bullet("Підсвічування термінів пошуку в результатах"),
        bullet("\"Не знайдено\" → пропозиції: схожі запити, популярні категорії"),
        SPACE(),

        H2("11.2. Алгоритми рекомендацій"),
        table2([
          hdrRow(["Алгоритм", "Реалізація"], [2800, 6560]),
          dataRow(["Collaborative Filtering", "\"З цим купують\" — матриця order_items, cosine similarity"], [2800, 6560]),
          dataRow(["Content-Based", "Схожі товари — category + age_group + price_range + skills"], [2800, 6560], true),
          dataRow(["Popularity", "Хіти — sales_count × recency_weight (згасає за 30 днів)"], [2800, 6560]),
          dataRow(["Personalized", "Авторизовані — history + wishlist + дані дітей з профілю"], [2800, 6560], true),
          dataRow(["Price drop alert", "Якщо товар у вішлісті -10% — push/email сповіщення"], [2800, 6560]),
        ], 2800, 6560),

        // ═══════════════ 12. API ═══════════════
        H1("12. REST API — ОСНОВНІ ЕНДПОІНТИ"),
        SPACE(),

        H2("12.1. Публічні ендпоінти (без авторизації)"),
        table3([
          hdrRow(["Метод + URL", "Опис", "Параметри"], [2500, 3000, 3860]),
          dataRow(["GET /api/categories", "Дерево категорій", "?include_counts=true"], [2500, 3000, 3860]),
          dataRow(["GET /api/products", "Список товарів", "?cat_id, filters, sort, page, per_page"], [2500, 3000, 3860], true),
          dataRow(["GET /api/products/:id", "Картка товару", "—"], [2500, 3000, 3860]),
          dataRow(["GET /api/products/:id/similar", "Схожі товари", "?limit=8"], [2500, 3000, 3860], true),
          dataRow(["GET /api/products/:id/bundles", "\"Купують разом\"", "?limit=8"], [2500, 3000, 3860]),
          dataRow(["GET /api/search", "Пошук товарів", "?q, page, sort, filters"], [2500, 3000, 3860], true),
          dataRow(["GET /api/search/suggest", "Автодоповнення", "?q&limit=5"], [2500, 3000, 3860]),
          dataRow(["GET /api/reviews/:product_id", "Відгуки товару", "?sort, page, with_photo"], [2500, 3000, 3860], true),
        ], 2500, 3000, 3860),
        SPACE(),

        H2("12.2. Захищені ендпоінти (Bearer JWT / x-telegram-init-data)"),
        table3([
          hdrRow(["Метод + URL", "Опис", "Параметри"], [2500, 3000, 3860]),
          dataRow(["GET /api/cart", "Кошик користувача", "—"], [2500, 3000, 3860]),
          dataRow(["POST /api/cart/:product_id", "Додати у кошик", "body: {quantity}"], [2500, 3000, 3860], true),
          dataRow(["GET/POST/DELETE /api/wishlist", "Вішліст (CRUD)", "—"], [2500, 3000, 3860]),
          dataRow(["POST /api/orders", "Оформити замовлення", "body: OrderIn schema"], [2500, 3000, 3860], true),
          dataRow(["GET /api/orders/history", "Мої замовлення", "?status, page"], [2500, 3000, 3860]),
          dataRow(["POST /api/promo/validate", "Перевірити промокод", "body: {code, order_total}"], [2500, 3000, 3860], true),
          dataRow(["GET /api/me/coins", "Баланс монеток", "—"], [2500, 3000, 3860]),
          dataRow(["POST /api/reviews", "Написати відгук", "body: {product_id, rating, text, photos}"], [2500, 3000, 3860], true),
        ], 2500, 3000, 3860),

        // ═══════════════ 13. ПЛАН РОЗРОБКИ ═══════════════
        H1("13. ПЛАН РОЗРОБКИ — ROADMAP"),
        P("Розробка ведеться ітеративно. Кожна фаза закінчується робочою версією, яку можна тестувати."),
        SPACE(),

        H2("Фаза 1: MVP — Базовий магазин (6-8 тижнів)"),
        P("Мета: Перший продаж через веб. Базовий функціонал без AI та гейміфікації.", { bold: true }),
        SPACE(),
        table2([
          hdrRow(["Завдання", "Деталі"], [2800, 6560]),
          dataRow(["Дизайн-система", "Tailwind конфіг, компоненти кнопок/карток/форм, Storybook"], [2800, 6560]),
          dataRow(["БД та схема", "PostgreSQL + Prisma: users, categories, products, orders, cart"], [2800, 6560], true),
          dataRow(["API (core)", "CRUD товарів, категорії, замовлення, авторизація JWT"], [2800, 6560]),
          dataRow(["Імпорт товарів", "Скрипт міграції з Telegram-бота (products, categories з БД)"], [2800, 6560], true),
          dataRow(["Каталог", "Список товарів, пагінація, базові фільтри ціна+категорія"], [2800, 6560]),
          dataRow(["Картка товару", "Галерея фото, опис, ціна, кнопка кошика, схожі товари"], [2800, 6560], true),
          dataRow(["Кошик", "Додавання, редагування, видалення, кешування localStorage"], [2800, 6560]),
          dataRow(["Checkout (v1)", "Контакти + НП відділення + LiqPay картка"], [2800, 6560], true),
          dataRow(["Авторизація", "Email/пароль + OAuth Google + Telegram Login Widget"], [2800, 6560]),
          dataRow(["Deploy", "Vercel (frontend) + Railway (backend) + GitHub Actions CI/CD"], [2800, 6560], true),
        ], 2800, 6560),
        SPACE(),

        H2("Фаза 2: Enhanced — Ключові функції (8-10 тижнів)"),
        P("Мета: Повноцінний конкурентний магазин з просунутим UX.", { bold: true }),
        SPACE(),
        table2([
          hdrRow(["Завдання", "Деталі"], [2800, 6560]),
          dataRow(["AI-пошук", "Elasticsearch + синоніми + fuzzy + autocomplete + highlight"], [2800, 6560]),
          dataRow(["Розширені фільтри", "Вік (місяці), стать, матеріал, навички, AJAX без перезавантаження"], [2800, 6560], true),
          dataRow(["Особистий кабінет", "Замовлення, вішліст, адреси, налаштування, відгуки"], [2800, 6560]),
          dataRow(["Відгуки", "Написання (після покупки), фото, рейтинг, verified badge"], [2800, 6560], true),
          dataRow(["Промокоди", "Система промокодів з обмеженнями, відображення знижки у чекаут"], [2800, 6560]),
          dataRow(["Telegram інтеграція v2", "Синхронізація замовлень web→bot, трекінг у боті"], [2800, 6560], true),
          dataRow(["SEO", "SSG для категорій/товарів, sitemap.xml, OpenGraph, JSON-LD"], [2800, 6560]),
          dataRow(["Email сповіщення", "Підтвердження замовлення, статуси, відновлення паролю"], [2800, 6560], true),
          dataRow(["Адмін-панель v1", "Управління товарами, замовленнями, категоріями (Next.js admin)"], [2800, 6560]),
          dataRow(["Nova Poshta API", "Автодоповнення міста + відділення, розрахунок вартості"], [2800, 6560], true),
        ], 2800, 6560),
        SPACE(),

        H2("Фаза 3: Advanced — Диференціатори (8-10 тижнів)"),
        P("Мета: Функції, яких немає у конкурентів. Гейміфікація, 3D, персоналізація.", { bold: true }),
        SPACE(),
        table2([
          hdrRow(["Завдання", "Деталі"], [2800, 6560]),
          dataRow(["Монетки (гейміфікація)", "Нарахування, витрачання, анімації, push-нагадування"], [2800, 6560]),
          dataRow(["3D / 360° перегляд", "Three.js viewer, завантаження .glb моделей для топ-товарів"], [2800, 6560], true),
          dataRow(["Відеоогляди", "Вбудований YouTube/Vimeo плеєр + автоплей preview при hover"], [2800, 6560]),
          dataRow(["Персоналізація", "Рекомендації на основі профілів дітей + collaborative filtering"], [2800, 6560], true),
          dataRow(["Профілі дітей", "Додати дітей → автоматична адаптація каталогу та фільтрів"], [2800, 6560]),
          dataRow(["Нагадування ДН", "Push/email за 14/7/1 день до дня народження з рекомендаціями"], [2800, 6560], true),
          dataRow(["Price drop alerts", "Моніторинг цін у вішлісті → push при зниженні ≥10%"], [2800, 6560]),
          dataRow(["Apple Pay / G Pay", "LiqPay Payment Request API інтеграція"], [2800, 6560], true),
          dataRow(["Порівняння товарів", "До 4 товарів паралельно, таблиця атрибутів"], [2800, 6560]),
          dataRow(["Аналітика", "ClickHouse + Grafana: конверсія, воронка, LTV, cohorts"], [2800, 6560], true),
        ], 2800, 6560),
        SPACE(),

        H2("Фаза 4: Scale & Optimize (4-6 тижнів)"),
        bullet("Performance: CDN для зображень, WebP/AVIF, lazy loading, Core Web Vitals ≥90"),
        bullet("Load testing: k6 / Locust — симуляція 10 000 одночасних користувачів"),
        bullet("A/B тести: Vercel Edge Config — різні CTA, ціни, розміщення блоків"),
        bullet("PWA: Service Worker, офлайн-перегляд каталогу, push-сповіщення у браузері"),
        bullet("Mobile App: React Native (Expo) — iOS + Android (спільний API з веб)"),
        bullet("B2B-кабінет: оптові замовлення, рахунки-фактури для ФОП/ТОВ"),

        // ═══════════════ 14. БЕЗПЕКА ═══════════════
        H1("14. БЕЗПЕКА ТА ВІДПОВІДНІСТЬ"),
        SPACE(),

        H2("14.1. Безпека API"),
        bullet("HMAC-SHA256 валідація Telegram initData (вже реалізовано в боті)"),
        bullet("JWT з коротким TTL (15 хв) + Refresh Token (7 днів) у HttpOnly Cookie"),
        bullet("Rate Limiting: 100 req/хв на IP (Redis), 10 req/хв для auth ендпоінтів"),
        bullet("CORS: whitelist тільки довірених origin (vercel.app + власний домен)"),
        bullet("SQL Injection: Prisma parameterized queries (захищено за замовчуванням)"),
        bullet("XSS: CSP headers через Next.js middleware, DOMPurify для user content"),
        bullet("CSRF: SameSite=Strict cookies + CSRF token для мутуючих запитів"),
        SPACE(),

        H2("14.2. Захист даних"),
        bullet("Паролі: bcrypt з cost factor 12"),
        bullet("PII шифрування: телефони та email шифруються AES-256 у БД"),
        bullet("GDPR-сумісність: right to erasure, data export, consent management"),
        bullet("Логи: не зберігати PII у логах, маскування карткових номерів"),
        bullet("SSL/TLS: Cloudflare → HTTPS скрізь, HSTS header"),

        // ═══════════════ 15. МЕТРИКИ ═══════════════
        H1("15. КЛЮЧОВІ МЕТРИКИ УСПІХУ (KPIs)"),
        SPACE(),

        table3([
          hdrRow(["Метрика", "Ціль MVP", "Ціль 12 місяців"], [2400, 2400, 4560]),
          dataRow(["Конверсія (CR)", "≥ 1.5%", "≥ 3.5%"], [2400, 2400, 4560]),
          dataRow(["Середній чек (AOV)", "≥ 450 UAH", "≥ 650 UAH"], [2400, 2400, 4560], true),
          dataRow(["Core Web Vitals LCP", "< 2.5s", "< 1.5s"], [2400, 2400, 4560]),
          dataRow(["Core Web Vitals CLS", "< 0.1", "< 0.05"], [2400, 2400, 4560], true),
          dataRow(["Bounce Rate", "< 55%", "< 40%"], [2400, 2400, 4560]),
          dataRow(["Cart Abandonment", "< 75%", "< 60%"], [2400, 2400, 4560], true),
          dataRow(["Email open rate", "≥ 25%", "≥ 35%"], [2400, 2400, 4560]),
          dataRow(["Telegram push CTR", "≥ 15%", "≥ 25%"], [2400, 2400, 4560], true),
          dataRow(["NPS", "≥ 40", "≥ 60"], [2400, 2400, 4560]),
          dataRow(["Uptime", "≥ 99.5%", "≥ 99.9%"], [2400, 2400, 4560], true),
        ], 2400, 2400, 4560),

        // ═══════════════ 16. БЮДЖЕТ ═══════════════
        H1("16. ОРІЄНТОВНИЙ БЮДЖЕТ ТА ЧАСОВІ РАМКИ"),
        SPACE(),

        table3([
          hdrRow(["Складова", "Фаза 1 (MVP)", "Фази 2-3"], [2600, 2400, 4360]),
          dataRow(["Frontend розробка", "120-160 год", "200-280 год"], [2600, 2400, 4360]),
          dataRow(["Backend розробка", "100-140 год", "180-240 год"], [2600, 2400, 4360], true),
          dataRow(["Дизайн (UI/UX)", "60-80 год", "40-60 год"], [2600, 2400, 4360]),
          dataRow(["DevOps / Інфраструктура", "20-30 год", "20-30 год"], [2600, 2400, 4360], true),
          dataRow(["Тестування (QA)", "20-30 год", "30-40 год"], [2600, 2400, 4360]),
          dataRow(["Інфраструктура ($/міс)", "~$50-100", "~$150-300"], [2600, 2400, 4360], true),
          dataRow(["РАЗОМ (люд-год)", "320-440 год", "470-650 год"], [2600, 2400, 4360]),
        ], 2600, 2400, 4360),
        SPACE(),
        P("Примітка: Наявний Telegram-бот (Python/aiogram) суттєво скорочує витрати на Backend — вже є: авторизація, каталог API, кошик, промокоди, вішліст, планувальник. Ці модулі потребують лише адаптації та розширення, а не переписування з нуля.", { italics: true }),

        // ═══════════════ 17. ДОДАТОК ═══════════════
        H1("17. ДОДАТОК: ЗВ'ЯЗОК ЗА КОМПОНЕНТАМИ"),
        SPACE(),
        H2("17.1. Зв'язки між таблицями"),
        bullet("users (1) ⟷ (N) orders — один користувач може мати багато замовлень"),
        bullet("users (1) ⟷ (N) cart_items — персональний кошик"),
        bullet("users (1) ⟷ (N) wishlist_items — список бажань"),
        bullet("users (1) ⟷ (N) reviews — відгуки авторизованих користувачів"),
        bullet("users (1) ⟷ (N) bonus_transactions — рух монеток"),
        bullet("users (1) ⟷ (N) children_profiles — профілі дітей"),
        bullet("categories (1) ⟷ (N) categories — дерево (self-referential)"),
        bullet("categories (1) ⟷ (N) products — товари у категорії"),
        bullet("products (1) ⟷ (1) product_attributes — атрибути фільтрації"),
        bullet("products (N) ⟷ (N) products через product_bundles — комплекти"),
        bullet("orders (1) ⟷ (N) order_items — позиції замовлення"),
        bullet("orders (N) ⟷ (1) promo_codes — застосований промокод"),
        SPACE(),

        H2("17.2. Чеклист запуску (Go-Live)"),
        numbered("SSL-сертифікат та домен налаштовано, Cloudflare активовано"),
        numbered("Усі .env змінні задані в production (Railway + Vercel)"),
        numbered("БД seed-дані: категорії, товари (імпорт з бота або постачальника)"),
        numbered("LiqPay: production ключі, webhook URL зареєстровано"),
        numbered("Nova Poshta API: production токен, тест доставки"),
        numbered("Email (Resend): домен верифіковано, шаблони протестовано"),
        numbered("Telegram-бот: production BOT_TOKEN, webhook зареєстровано"),
        numbered("Google Search Console + Analytics підключено"),
        numbered("Sentry DSN налаштовано, тестова помилка перевірена"),
        numbered("Load test: 1000 req/s без деградації (k6)"),
        numbered("Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms"),
        numbered("Backup: автоматичний щоденний бекап PostgreSQL на S3"),

        // Footer note
        SPACE(), SPACE(),
        new Paragraph({
          children: [
            new TextRun({ text: "─".repeat(60), size: 18, color: "E2E8F0" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Документ підготовлено на основі діючого Telegram-бота магазину іграшок. Версія 1.0 — " + new Date().toLocaleDateString("uk-UA"), size: 18, color: "9CA3AF", italics: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 0 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("C:\\shop_bot\\ТЗ_Інтернет-магазин_дитячих_товарів.docx", buffer);
  console.log("✅ Документ створено: ТЗ_Інтернет-магазин_дитячих_товарів.docx");
}).catch((e) => {
  console.error("❌ Помилка:", e.message);
  process.exit(1);
});
