# 🌀 Голографический AI-аватар для CREPESS300

**НейроРешения** — веб-приложение для генерации видеороликов с говорящим AI-аватаром через HeyGen API.

Видео предназначено для воспроизведения на голографическом вентиляторе **CREPESS300** (пропеллерный 3D-дисплей).

---

## 🚀 Демо

**Live:** https://ai-fan-avatar-production.up.railway.app

---

## 📋 Суть проекта

**Кейс использования:** промышленное предприятие / вахта.

1. Оператор вводит текст (например: "Добро пожаловать на смену!")
2. Нажимает кнопку генерации
3. HeyGen API создаёт видео с говорящим аватаром (1024×1024px, круглое)
4. Пользователь скачивает MP4
5. Конвертирует в `.bin` через ПО вентилятора
6. Запускает на голографическом дисплее CREPESS300

---

## 🏗️ Технический стек

| Компонент | Технология |
|---|---|
| Бэкенд | Node.js + Express |
| Фронтенд | Vanilla HTML/CSS/JS |
| AI-генерация | HeyGen API v2 |
| Хостинг | Railway |
| Репозиторий | GitHub |
| Rate Limiting | express-rate-limit |

---

## 📁 Структура проекта

```
ai-fan-avatar/
├── index.html       — фронтенд (UI + JavaScript)
├── server.js        — бэкенд Node.js/Express
├── package.json     — зависимости
├── nginx.conf       — конфиг nginx (для HTTPS)
├── .env.example     — пример переменных окружения
└── README.md
```

---

## ⚙️ Архитектура

```
Browser (index.html)
     ↓
     POST /api/generate { text: "..." }
     ↓
Express Server (server.js)
     ↓
     HTTPS → api.heygen.com/v2/video/generate
     ↓
HeyGen API
     ↓
     returns { data: { video_id: "..." } }
     ↓
Polling GET /api/status/:videoId (каждые 6 сек)
     ↓
HeyGen API → /v1/video_status.get
     ↓
     status: processing → completed → video_url
     ↓
Browser показывает видео + кнопка скачивания
     ↓
     GET /api/download?url=<CDN_URL>
     ↓
Express проксирует файл (решает CORS) → Browser скачивает MP4
```

---

## 🔑 Переменные окружения

### `.env.example`:
```bash
HEYGEN_API_KEY=your_heygen_api_key_here
AVATAR_ID=your_avatar_id_here
VOICE_ID=your_voice_id_here
PORT=3000
```

### Где взять ключи:

1. **HEYGEN_API_KEY**
   - Зайти в https://app.heygen.com
   - Перейти в раздел **API** → **API Keys**
   - Создать новый ключ или скопировать существующий
   - Формат: `sk_V2_...`

2. **AVATAR_ID**
   - Перейти в https://app.heygen.com/avatars
   - Выбрать нужный аватар
   - Скопировать ID из URL или через API
   - Формат: UUID (например: `b8702cda-44ca-4a62-8558-962960925a2b`)

3. **VOICE_ID**
   - Перейти в https://app.heygen.com/voices
   - Выбрать нужный голос (русский или другой язык)
   - Скопировать Voice ID
   - Формат: UUID (например: `00e8bacc-0900-4f84-a01c-97c33f53e0b4`)

> ⚠️ **ВАЖНО:** `PORT` НЕ нужно устанавливать в Railway — Railway сам предоставляет `$PORT`. Установка вручную вызовет 502 ошибку.

---

## 🚀 Быстрый старт (локально)

```bash
git clone https://github.com/AlexaMois/ai-fan-avatar
cd ai-fan-avatar
npm install
cp .env.example .env
# Заполнить .env: HEYGEN_API_KEY, AVATAR_ID, VOICE_ID
node server.js
# Открыть http://localhost:3000
```

---

## 📡 API Эндпоинты

### `GET /`
Отдаёт `index.html`

### `POST /api/generate`
- Принимает `{ text: string }`
- Валидация: текст обязателен, максимум **4000 символов**
- Rate limit: **10 запросов в час с одного IP**
- Отправляет запрос в HeyGen API для генерации видео
- Возвращает `{ data: { video_id: "..." } }`

### `GET /api/status/:videoId`
- Проверяет статус генерации видео
- Возвращает: `processing` / `completed` / `failed`
- При `completed` содержит `data.video_url`

### `GET /api/download?url=<CDN_URL>`
- Проксирует скачивание с CDN HeyGen (решает CORS)
- Whitelist доменов:
  - `heygen-studio.s3.amazonaws.com`
  - `files.heygen.ai`
  - `resource.heygen.ai`
  - `storage.googleapis.com`

---

## 🛡️ Безопасность и надёжность

| Проблема | Решение |
|---|---|
| Нет rate limiting | Добавлен `express-rate-limit` (10 req/час/IP) |
| Нет валидации длины текста | Проверка: максимум 4000 символов (клиент + сервер) |
| Бесконечный поллинг | `MAX_POLL_ATTEMPTS = 10` (~60 секунд) |
| Download CORS | Прокси `/api/download` с whitelist доменов |
| Захардкоженные ID | Вынесены в переменные окружения |

---

## 🐛 Известные проблемы

### `TTS_VOICE_UNAVAILABLE_ERR`

Если при генерации видео появляется ошибка:
```json
{
  "code": "TTS_VOICE_UNAVAILABLE_ERR",
  "message": "Voice validation failed for 1 voice(s)"
}
```

**Причина:** `VOICE_ID` не существует в вашем HeyGen аккаунте.

**Решение:**
1. Зайти в https://app.heygen.com/voices
2. Выбрать нужный голос (русский или другой язык)
3. Скопировать корректный Voice ID
4. Обновить переменную `VOICE_ID` в Railway или `.env`

---

## 🚢 Деплой на Railway

1. Зарегистрироваться на https://railway.app
2. Создать новый проект → **Deploy from GitHub repo**
3. Выбрать репозиторий `AlexaMois/ai-fan-avatar`
4. Добавить переменные окружения:
   - `HEYGEN_API_KEY`
   - `AVATAR_ID`
   - `VOICE_ID`
5. Railway автоматически развернёт приложение
6. Получить публичный URL в разделе **Settings → Networking → Generate Domain**

**CI/CD:** При каждом `push` в ветку `main` Railway автоматически запускает новый деплой.

---

## 📚 Документация HeyGen API

- **Официальная документация:** https://docs.heygen.com
- **Generate Video API:** https://docs.heygen.com/reference/create-an-avatar-video-v2
- **Video Status API:** https://docs.heygen.com/reference/video-status

---

## 🔧 Технические детали

### Payload для генерации видео:
```json
{
  "video_inputs": [{
    "character": {
      "type": "avatar",
      "avatar_id": "<AVATAR_ID>",
      "avatar_style": "normal"
    },
    "voice": {
      "type": "text",
      "input_text": "<текст>",
      "voice_id": "<VOICE_ID>"
    }
  }],
  "dimension": { "width": 1024, "height": 1024 }
}
```

### Разрешение видео:
- **1024×1024px** — оптимально для CREPESS300 (экран 1024×600)
- Видео генерируется в круглой форме для голографического отображения

### Поллинг статуса:
- Интервал: **6 секунд**
- Максимальное количество попыток: **10** (~60 секунд)
- При превышении времени → пользователь получает уведомление

---

## 📝 Changelog

### v1.2.0 — 2026-03-17
- ✅ Исправлена ошибка `[object Object]` в сообщениях об ошибках HeyGen API
- ✅ Добавлена проверка типа для объектов ошибок + JSON.stringify

### v1.1.0 — 2026-03-16
- ✅ Исправлена синтаксическая ошибка в `pollStatus` вызове
- ✅ Добавлен таймаут поллинга (10 попыток)
- ✅ Добавлен rate limiting (10 req/час/IP)
- ✅ Добавлена валидация длины текста (4000 символов)
- ✅ Вынесены `AVATAR_ID` и `VOICE_ID` в переменные окружения
- ✅ Добавлен прокси для скачивания файлов (решение CORS)

### v1.0.0 — MVP
- ✅ Базовая генерация видео через HeyGen API
- ✅ Простой UI с готовыми фразами
- ✅ Круглый превью для имитации голографического дисплея

---

## 📄 Лицензия

MIT License

---

## 🤝 Контакты

Репозиторий: https://github.com/AlexaMois/ai-fan-avatar  
Issues: https://github.com/AlexaMois/ai-fan-avatar/issues
