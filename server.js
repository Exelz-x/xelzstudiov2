require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');
const fs = require('fs');

const app = express();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ─── TEMP DIR ─────────────────────────────────────────────────────────────────
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Cleanup temp files older than 10 minutes
setInterval(() => {
  const now = Date.now();
  fs.readdirSync(TEMP_DIR).forEach(file => {
    const filePath = path.join(TEMP_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > 10 * 60 * 1000) fs.unlinkSync(filePath);
    } catch {}
  });
}, 5 * 60 * 1000);

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://img.youtube.com", "https://i.ytimg.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));

// ─── RATE LIMITING ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const convertLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Conversion limit reached. Maximum 10 conversions per hour.' },
  keyGenerator: (req) => req.ip,
});

app.use(globalLimiter);
app.use('/api/convert', convertLimiter);

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
}));

// ─── VALIDATE YOUTUBE URL ─────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9\s\-_]/g, '').substring(0, 50).trim() || 'audio';
}

// ─── API: GET VIDEO INFO ───────────────────────────────────────────────────────
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;
    const videoId = extractYouTubeId(url);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL.' });

    const cached = cache.get(`info_${videoId}`);
    if (cached) return res.json(cached);

    const ytdl = require('ytdl-core');
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const details = {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails.slice(-1)[0]?.url || '',
      videoId,
    };

    if (details.duration > 600) {
      return res.status(400).json({ error: 'Video too long. Maximum duration is 10 minutes.' });
    }

    cache.set(`info_${videoId}`, details);
    res.json(details);
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video info. Check URL and try again.' });
  }
});

// ─── API: CONVERT ─────────────────────────────────────────────────────────────
app.post('/api/convert', async (req, res) => {
  const jobId = uuidv4();
  const rawPath = path.join(TEMP_DIR, `${jobId}_raw.webm`);
  const outPath = path.join(TEMP_DIR, `${jobId}_converted.mp3`);

  try {
    const { url } = req.body;
    const videoId = extractYouTubeId(url);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL.' });

    const ytdl = require('ytdl-core');
    const ffmpeg = require('fluent-ffmpeg');

    // Verify video exists and check duration
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const duration = parseInt(info.videoDetails.lengthSeconds);
    if (duration > 600) return res.status(400).json({ error: 'Video too long. Max 10 minutes.' });

    const safeTitle = sanitizeFilename(info.videoDetails.title);

    // Download audio stream
    await new Promise((resolve, reject) => {
      const stream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });
      const writeStream = fs.createWriteStream(rawPath);
      stream.pipe(writeStream);
      stream.on('error', reject);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // NOTE: Speed is handled server-side with proprietary processing.
    // The exact speed multiplier is not exposed to the client.
    const SPEED_FACTOR = 2.303; // Roblox audio speed constant - CONFIDENTIAL
    const atempo = Math.min(Math.max(SPEED_FACTOR, 0.5), 2.0); // ffmpeg clamp
    // For values > 2.0, chain two atempo filters
    let atempoFilters;
    if (SPEED_FACTOR > 2.0) {
      const stage1 = 2.0;
      const stage2 = SPEED_FACTOR / 2.0;
      atempoFilters = [`atempo=${stage1}`, `atempo=${stage2}`];
    } else {
      atempoFilters = [`atempo=${SPEED_FACTOR}`];
    }

    await new Promise((resolve, reject) => {
      ffmpeg(rawPath)
        .audioFilters(atempoFilters) // Speed+Pitch+Tempo simultaneously (like Audacity Speed)
        .audioCodec('libmp3lame')
        .audioBitrate(192)
        .audioChannels(2)
        .audioFrequency(44100)
        .output(outPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Clean raw file
    try { fs.unlinkSync(rawPath); } catch {}

    // Stream the file to user
    const stat = fs.statSync(outPath);
    const filename = `${safeTitle}_XelzStudio.mp3`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('X-Powered-By', 'XelzStudio');

    const readStream = fs.createReadStream(outPath);
    readStream.pipe(res);
    readStream.on('end', () => {
      try { fs.unlinkSync(outPath); } catch {}
    });
    readStream.on('error', () => {
      try { fs.unlinkSync(outPath); } catch {}
      res.end();
    });

  } catch (err) {
    console.error('Convert error:', err.message);
    try { fs.unlinkSync(rawPath); } catch {}
    try { fs.unlinkSync(outPath); } catch {}
    if (!res.headersSent) {
      res.status(500).json({ error: 'Conversion failed. Please try again.' });
    }
  }
});

// ─── PAGES ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`XelzStudio running on port ${PORT}`));