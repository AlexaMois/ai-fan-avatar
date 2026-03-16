require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Конфиг из env-переменных — никаких значений по умолчанию
const API_KEY   = process.env.HEYGEN_API_KEY;
const AVATAR_ID = process.env.AVATAR_ID;
const VOICE_ID  = process.env.VOICE_ID;

if (!API_KEY || !AVATAR_ID || !VOICE_ID) {
  console.error('ERROR: Не заданы HEYGEN_API_KEY, AVATAR_ID или VOICE_ID в .env');
  process.exit(1);
}

// Rate limit: не более 10 запросов в час с одного IP на /api/generate
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Слишком много запросов. Попробуйте через час.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Генерация видео
app.post('/api/generate', generateLimiter, async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Текст не передан' });
  }

  // Валидация длины (HeyGen лимит ~5000 символов, берём с запасом)
  if (text.length > 4000) {
    return res.status(400).json({
      error: `Текст слишком длинный: ${text.length} символов. Максимум — 4000.`
    });
  }

  const payload = JSON.stringify({
    video_inputs: [{
      character: {
        type: 'avatar',
        avatar_id: AVATAR_ID,
        avatar_style: 'normal'
      },
      voice: {
        type: 'text',
        input_text: text,
        voice_id: VOICE_ID
      }
    }],
    dimension: { width: 1024, height: 1024 }
  });

  const options = {
    hostname: 'api.heygen.com',
    path: '/v2/video/generate',
    method: 'POST',
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const heygenReq = https.request(options, (heygenRes) => {
    let data = '';
    heygenRes.on('data', chunk => data += chunk);
    heygenRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Ошибка парсинга ответа HeyGen', raw: data });
      }
    });
  });

  heygenReq.on('error', (e) => res.status(500).json({ error: e.message }));
  heygenReq.write(payload);
  heygenReq.end();
});

// Статус видео
app.get('/api/status/:videoId', (req, res) => {
  const { videoId } = req.params;

  const options = {
    hostname: 'api.heygen.com',
    path: `/v1/video_status.get?video_id=${videoId}`,
    method: 'GET',
    headers: { 'X-Api-Key': API_KEY }
  };

  const heygenReq = https.request(options, (heygenRes) => {
    let data = '';
    heygenRes.on('data', chunk => data += chunk);
    heygenRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Ошибка парсинга', raw: data });
      }
    });
  });

  heygenReq.on('error', (e) => res.status(500).json({ error: e.message }));
  heygenReq.end();
});

// Проксирование скачивания — решает CORS-проблему в браузерах
app.get('/api/download', (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Некорректный URL' });
  }

  // Разрешаем только домены HeyGen CDN
  const allowed = [
    'heygen-studio.s3.amazonaws.com',
    'files.heygen.ai',
    'resource.heygen.ai',
    'storage.googleapis.com'
  ];

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return res.status(400).json({ error: 'Невалидный URL' });
  }

  if (!allowed.some(d => hostname.endsWith(d))) {
    return res.status(403).json({ error: 'Домен не разрешён для скачивания' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="avatar_${Date.now()}.mp4"`);
  res.setHeader('Content-Type', 'video/mp4');

  https.get(url, (fileRes) => {
    fileRes.pipe(res);
  }).on('error', (e) => {
    res.status(500).json({ error: 'Ошибка скачивания: ' + e.message });
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});