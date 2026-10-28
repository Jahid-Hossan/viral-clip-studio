# 🎬 ViralClip Studio (AI Video Repurposing & Virality Engine)

**ViralClip Studio** is a standalone AI video repurposing application inspired by and reverse-engineered from **Opus.pro / OpusClip** using **REA (Reverse Engineering Assistant)**, built with **React 19, Vite, Tailwind CSS, Express, and Google Gemini 2.5 Flash**.

---

## 🔍 How It Works (REA Reverse-Engineered Architecture)

During the analysis of `https://www.opus.pro/` and its core engine `https://clip.opus.pro/`, REA inspected the runtime DOM and unpacked Next.js/Turbopack chunks (`3bfl9ppxgmb37.js`, `2omaymg5hc_01.js`, `16rfuwyeb5ojl.js`), uncovering:

### 1. The Multi-Metric Virality Judge (`judgeResult`)
OpusClip evaluates clips using six distinct viral metrics:
* **`score` (0-100)**: Overall virality rating combining retention probability and shareability.
* **`hookScore` (0-100)**: Strength and arresting impact of the first 3-5 seconds.
* **`coherenceScore` (0-100)**: Narrative completeness (whether the clip functions as a self-contained story without missing context).
* **`connectionScore` (0-100)**: Emotional resonance and audience relatability.
* **`trendScore` (0-100)**: Social media algorithmic fit (TikTok, Reels, Shorts).
* **`sponsorshipScore` (0-100)**: Brand safety and monetization readiness.

### 2. AI Curation Parameters (`curationPref`)
* **Custom AI Prompt**: Steering the AI to find specific moments (e.g., jokes, debates, frameworks).
* **Virality Profiles**: High-Energy TikTok, Podcast Storytelling, Educational/Tech, Comedy Punchline.
* **Duration Brackets**: `<30s`, `30-60s`, `60-90s`.

### 3. Dynamic Smart Reframing & Framing Layouts
* **Speaker Center**: Auto-crops 16:9 to 9:16 centered on active speaker face coordinates.
* **Stacked Split Screen**: Auto-stacks two speakers vertically for podcast conversations and interviews.
* **Blurred Backdrop Fit**: Displays the original 16:9 video centered with a Gaussian-blurred backdrop filling the 9:16 frame.

### 4. Dynamic Subtitles & Multi-Format NLE Export
* **Word-Level Karaoke Timing**: Word-by-word active highlight (Hormozi, MrBeast, Cyberpunk presets).
* **Adobe Premiere Pro XML (`renderAsAdobeXml`)**: Direct export to `.xml` (xmeml v4) preserving in/out points, subtitle markers, and audio tracks.
* **In-Browser Video Exporter**: Canvas-based recorder rendering 9:16 video clips with subtitles directly to `.webm` / `.mp4`.

---

## 🚀 Running the App

The app is already running locally at:
👉 **[http://localhost:3005](http://localhost:3005)**

To restart manually:
```bash
cd c:\Users\Jahid\Desktop\ANTIGRAVITY\viral-clip-studio
npm run dev
```

---

## 🛠️ Tech Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
* **Backend**: Node.js, Express, Multer
* **AI Model**: Google Gemini 2.5 Flash (`@google/genai`)
* **Video Engine**: HTML5 Canvas 2D + MediaRecorder API
* **NLE Export**: Adobe Premiere Pro Sequence XML (xmeml v4) & SubRip SRT
