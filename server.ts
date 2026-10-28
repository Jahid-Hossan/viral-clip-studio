import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// VTT Parser helper for extracted YouTube subtitles
function parseVttToCleanTranscript(vttPath: string): string {
  if (!fs.existsSync(vttPath)) return '';
  const content = fs.readFileSync(vttPath, 'utf8');
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('WEBVTT') || trimmed.includes('-->') || trimmed.startsWith('NOTE') || /^\d+$/.test(trimmed)) {
      continue;
    }
    const cleaned = trimmed.replace(/<[^>]+>/g, '').trim();
    if (cleaned && !textLines.includes(cleaned)) {
      textLines.push(cleaned);
    }
  }

  return textLines.join(' ');
}

// Multer storage for video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `video_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Initialize Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Upload Endpoint
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }
  const videoUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    videoUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// YouTube Ingestion Endpoint (Bypasses CORS by downloading and extracting subtitles server-side)
app.post('/api/ingest-youtube', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  console.log(`[YouTube Ingest] Fetching video metadata: ${url}`);

  try {
    // 1. Extract metadata via yt-dlp
    const metaJson = execSync(`yt-dlp --dump-json --no-warnings --skip-download "${url}"`, {
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024
    });
    const meta = JSON.parse(metaJson);

    const videoId = meta.id;
    const title = meta.title || 'YouTube Video';
    const duration = meta.duration || 60;
    const cleanFilename = `yt_${videoId}.mp4`;
    const targetVideoPath = path.join(uploadsDir, cleanFilename);

    // 2. Extract Subtitles / Transcript
    const vttFile = path.join(uploadsDir, `${videoId}.en.vtt`);
    if (!fs.existsSync(vttFile)) {
      try {
        console.log(`[YouTube Ingest] Extracting auto-subtitles for ${videoId}...`);
        execSync(`yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${uploadsDir}/%(id)s.%(ext)s" "${url}"`, {
          stdio: 'ignore'
        });
      } catch (subErr) {
        console.warn('Subtitles fetch non-fatal notice:', subErr);
      }
    }

    let transcriptText = '';
    if (fs.existsSync(vttFile)) {
      transcriptText = parseVttToCleanTranscript(vttFile);
    }

    // 3. Download MP4 stream if not already cached
    if (!fs.existsSync(targetVideoPath)) {
      console.log(`[YouTube Ingest] Downloading video stream to ${cleanFilename}...`);
      // Best 720p or 480p combined mp4 stream
      execSync(`yt-dlp -f "bv*[height<=720]+ba[ext=m4a]/b[height<=720]/bv*+ba/b" --merge-output-format mp4 -o "${targetVideoPath}" "${url}"`, {
        stdio: 'inherit'
      });
    }

    console.log(`[YouTube Ingest] Ingestion complete for: ${title}`);
    return res.json({
      success: true,
      videoUrl: `/uploads/${cleanFilename}`,
      title,
      duration,
      transcriptText: transcriptText.substring(0, 15000),
      videoId
    });
  } catch (err: any) {
    console.error('[YouTube Ingest Error]:', err);
    res.status(500).json({
      error: 'Failed to ingest YouTube video: ' + (err.message || 'yt-dlp error')
    });
  }
});

// AI Virality Judge Analysis Endpoint
app.post('/api/analyze-video', async (req, res) => {
  try {
    const { videoUrl, customPrompt, viralityProfile, targetDuration, transcriptText, providerConfig } = req.body;

    const activeProvider = providerConfig?.provider || 'gemini';
    const activeModel = providerConfig?.modelName || (activeProvider === 'gemini' ? 'gemini-3.8-flash' : 'default');

    console.log(`[AI Judge] Analyzing video. Provider: ${activeProvider}, Model: ${activeModel}, Profile: ${viralityProfile}`);

    const systemPrompt = `You are the lead AI Virality Judge & Video Repurposing Model inspired by OpusClip's proprietary evaluation framework.
Your mission is to find the most viral, captivating short clips (under ${targetDuration || '60s'}) from the provided video/transcript.

VIRALITY EVALUATION CRITERIA:
1. score (0-100): Overall virality potential based on hook, retention curve, and emotional punch.
2. hookScore (0-100): Impact of the first 3 seconds. Does it stop the viewer from scrolling?
3. coherenceScore (0-100): Complete thought arc. The clip must make total sense standalone without missing context.
4. connectionScore (0-100): Emotional relatability, shock, inspiration, or intense curiosity.
5. trendScore (0-100): Algorithmic suitability for TikTok, YouTube Shorts, and Instagram Reels.
6. sponsorshipScore (0-100): Brand safety and commercial value.

Target Virality Style: ${viralityProfile || 'podcast_story'}.
${customPrompt ? `User Custom Guidance: ${customPrompt}` : ''}

Output an array of 3 to 5 candidate clips in strict JSON format:
{
  "clips": [
    {
      "rank": 1,
      "title": "Compelling Click-Worthy Title",
      "hookHeadline": "EYE-CATCHING ALL CAPS HOOK FOR BANNER (max 8 words)",
      "startTime": 15.0,
      "endTime": 55.0,
      "duration": 40.0,
      "layoutType": "speaker_center" | "split_screen" | "blur_fit",
      "tags": ["#tag1", "#tag2", "#tag3"],
      "suggestedBrollKeywords": ["broll search query 1", "broll search query 2"],
      "judgeResult": {
        "score": 95,
        "hookScore": 97,
        "coherenceScore": 93,
        "connectionScore": 94,
        "trendScore": 98,
        "sponsorshipScore": 90,
        "hookExplanation": "Why the opening 3 seconds hooked the audience",
        "coherenceExplanation": "Why this snippet forms a complete idea",
        "viralReasoning": "Why this will perform well on social feeds"
      },
      "transcript": "Full text of this clip segment...",
      "words": [
        { "word": "Example", "start": 15.0, "end": 15.4 }
      ]
    }
  ]
}`;

    const userPrompt = transcriptText
      ? `Here is the transcript of the video:\n\n${transcriptText}\n\nAnalyze and extract the top viral clips with timestamps.`
      : `Analyze the video clip from: ${videoUrl || 'current project'}. Extract top viral short-form clips with high retention hooks.`;

    let responseText = '{}';

    if (activeProvider === 'gemini') {
      const client = providerConfig?.apiKey ? new GoogleGenAI({ apiKey: providerConfig.apiKey }) : ai;
      if (!client) {
        return res.status(500).json({ error: 'Gemini API Key is not configured. Please set GEMINI_API_KEY in settings or .env' });
      }

      let response: any;
      let attempts = 0;
      while (attempts < 3) {
        try {
          attempts++;
          response = await client.models.generateContent({
            model: activeModel || 'gemini-3.8-flash',
            contents: `${systemPrompt}\n\n${userPrompt}`,
            config: {
              responseMimeType: 'application/json'
            }
          });
          break;
        } catch (callErr: any) {
          console.warn(`[Gemini Attempt ${attempts} Warning]:`, callErr.message);
          if (attempts >= 3) throw callErr;
          await new Promise((r) => setTimeout(r, 1500 * attempts));
        }
      }
      responseText = response?.text || '{}';
    } else {
      // OpenAI-compatible endpoint (OpenRouter, OmniRoute, NVIDIA, OpenCode, Custom)
      const baseUrl = providerConfig?.baseUrl || 'https://openrouter.ai/api/v1';
      const targetUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const apiKey = providerConfig?.apiKey || '';

      console.log(`[OpenAI-Compatible Dispatch] POST ${targetUrl} (model: ${activeModel})`);

      const openAiRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' }
        })
      });

      if (!openAiRes.ok) {
        const errText = await openAiRes.text();
        throw new Error(`${activeProvider.toUpperCase()} API error (${openAiRes.status}): ${errText.substring(0, 300)}`);
      }

      const openAiData = await openAiRes.json();
      responseText = openAiData.choices?.[0]?.message?.content || '{}';
    }

    // Clean JSON response in case model wrapped it in markdown fences
    const cleanedJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    res.json({
      success: true,
      clips: parsedData.clips || []
    });
  } catch (err: any) {
    console.error('[AI Judge Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze video' });
  }
});

// Test Connection Endpoint for UI Settings
app.post('/api/test-provider', async (req, res) => {
  const { provider, apiKey, baseUrl, modelName } = req.body;
  const start = Date.now();

  try {
    if (provider === 'gemini') {
      const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;
      if (!client) throw new Error('No Gemini API Key provided');

      let testRes: any;
      let attempts = 0;
      while (attempts < 3) {
        try {
          attempts++;
          testRes = await client.models.generateContent({
            model: modelName || 'gemini-3.8-flash',
            contents: 'Respond with "OK"'
          });
          break;
        } catch (err: any) {
          if (attempts >= 3) throw err;
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      return res.json({
        success: true,
        latencyMs: Date.now() - start,
        model: modelName || 'gemini-3.8-flash',
        reply: testRes.text?.trim()
      });
    } else {
      const targetUrl = `${(baseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, '')}/chat/completions`;
      const testRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: 'Respond with "OK"' }],
          max_tokens: 10
        })
      });

      if (!testRes.ok) {
        const errText = await testRes.text();
        throw new Error(`HTTP ${testRes.status}: ${errText.substring(0, 200)}`);
      }

      const data = await testRes.json();
      return res.json({
        success: true,
        latencyMs: Date.now() - start,
        model: modelName,
        reply: data.choices?.[0]?.message?.content?.trim() || 'OK'
      });
    }
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Real Stock B-Roll Search Endpoint using Pexels / Pixabay
app.get('/api/broll-search', async (req, res) => {
  const query = (req.query.q as string) || 'technology';
  const pexelsKey = process.env.PEXELS_API_KEY;

  if (pexelsKey) {
    try {
      const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=6&orientation=portrait`, {
        headers: { Authorization: pexelsKey }
      });
      const data = await response.json();
      return res.json({
        provider: 'pexels',
        videos: (data.videos || []).map((v: any) => ({
          id: v.id,
          width: v.width,
          height: v.height,
          duration: v.duration,
          image: v.image,
          videoFiles: v.video_files
        }))
      });
    } catch (e) {
      console.warn('Pexels search failed, fallback:', e);
    }
  }

  res.json({ provider: 'none', videos: [] });
});

// Setup Vite development middleware & resilient port binding
async function startServer(initialPort: number = PORT) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = http.createServer(app);

  function tryListen(portToTry: number) {
    server.listen(portToTry, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 ViralClip Studio is live at http://localhost:${portToTry}`);
      console.log(`🎬 AI Virality Engine & REA Opus Architecture Ready`);
      console.log(`======================================================\n`);
    });

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Notice] Port ${portToTry} is occupied. Attempting port ${portToTry + 1}...`);
        tryListen(portToTry + 1);
      } else {
        console.error('[Server Error]:', err);
      }
    });
  }

  tryListen(initialPort);
}

startServer();
