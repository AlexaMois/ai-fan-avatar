const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

const API_KEY = process.env.HEYGEN_API_KEY || '';
const AVATAR_ID = process.env.AVATAR_ID || 'b8702cda44ca4a628558962969025a2b';

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy: генерация видео
app.post('/api/generate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Текст не передан' });

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
        voice_id: 'ru-RU-DmitryNeural'
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
      } catch(e) {
        res.status(500).json({ error: 'Ошибка парсинга ответа HeyGen', raw: data });
      }
    });
  });

  heygenReq.on('error', (e) => res.status(500).json({ error: e.message }));
  heygenReq.write(payload);
  heygenReq.end();
});

// Proxy: статус видео
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
      } catch(e) {
        res.status(500).json({ error: 'Ошибка парсинга', raw: data });
      }
    });
  });

  heygenReq.on('error', (e) => res.status(500).json({ error: e.message }));
  heygenReq.end();
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
