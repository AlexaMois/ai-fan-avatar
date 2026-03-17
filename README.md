# Голографический AI-аватар для CREPESS300

**НейроРешения** — веб‑приложение для генерации коротких видеороликов с говорящим AI‑аватаром через HeyGen API v2. Видео предназначено для воспроизведения на голографическом вентиляторе **CREPESS300** (пропеллерный 3D‑дисплей).

## 🚀 Демо

Live: <https://ai-fan-avatar-production.up.railway.app>

## 🌟 Суть проекта

**Кейс использования:** промышленное предприятие / вахта.

1. Оператор вводит текст (например: «Добро пожаловать на смену!»).
2. Нажимает кнопку генерации.
3. HeyGen API создаёт видео с говорящим аватаром (1024×1024 px, круглая рамка).
4. Пользователь скачивает MP4.
5. Конвертирует в `.bin` через ПО вентилятора.
6. Запускает на голографическом дисплее CREPESS300.

## 🧪 Технический стек

| Компонент | Технология |
| --------- | ---------- |
| Бэкенд    | Node.js + Express |
| Фронтенд  | Vanilla HTML/CSS/JS (одна страница) |
| AI‑генерация | HeyGen API v2 |
| Хостинг   | Railway |
| Репозиторий | GitHub |
| Rate limiting | express‑rate‑limit |
| Переменные окружения | dotenv |

## 💽 Структура проекта

```
ai-fan-avatar/
├── index.html    — фронтенд (UI + JavaScript)
├── server.js     — бэкенд Node.js/Express
├── package.json  — зависимости
├── nginx.conf    — конфиг nginx (для HTTPS)
├── .env.example  — пример переменных окружения
└── README.md     — документация
```

## 🧱 Архитектура

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
  returns { data: { video_id: "…" } }
  ↓
Browser опрашивает статус → GET /api/status/:videoId (каждые 6 сек)
  ↓
HeyGen API → /v1/video_status.get
  status: processing → completed → video_url
  ↓
Browser показывает видео и кнопку скачивания
  ↓
GET /api/download?url=<CDN_URL>
  ↓
Express проксирует файл (решает CORS) → Browser скачивает MP4
```

## 🤩 Переменные окружения

В файле `.env` необходимо задать ключи:

```
HEYGEN_API_KEY=sk_...    # API‑ключ HeyGen
AVATAR_ID=b8702cda-44ca-4ac2-8558-962960925a2b    # ID выбранного аватара HeyGen
VOICE_ID=zyMUalnkbbh9kXJD64WH    # ID нужного голоса (Sasha Mois – Voice 1)
```

Переменную `PORT` задавать не нужно — Railway сам предоставит порт через `$PORT`. Ручное указание `PORT` приведёт к ошибке 502.

### Где взять ключи

1. **HEYGEN_API_KEY**  
   – Перейти в аккаунт HeyGen → *API* → *API Keys*.  
   – Создать новый ключ или скопировать существующий (формат `sk_V2_…`).

2. **AVATAR_ID**  
   – Перейти в [HeyGen Avatars](https://app.heygen.com/avatars).  
   – Выбрать нужный аватар.  
   – Скопировать ID из URL или через API (формат UUID).

3. **VOICE_ID**  
   – Перейти в [HeyGen Voices](https://app.heygen.com/voices).  
   – Найти голос *Sasha Mois – Voice 1* (ElevenLabs, Multilingual, Female).  
   – Скопировать Voice ID (`zyMUalnkbbh9kXJD64WH`) и записать в `.env`.

## 🏁 Быстрый старт (локально)

```bash
git clone https://github.com/AlexaMois/ai-fan-avatar.git
cd ai-fan-avatar
npm install
cp .env.example .env
# Заполнить переменные: HEYGEN_API_KEY, AVATAR_ID, VOICE_ID
node server.js
# Приложение будет доступно на http://localhost:3000
```
