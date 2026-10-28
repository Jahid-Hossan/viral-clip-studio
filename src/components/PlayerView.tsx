import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings2,
  Sliders,
  Crop,
  Layers,
  Sparkles,
  Type,
  Check,
  Film
} from 'lucide-react';
import { CuratedClip, FramingLayoutType, SubtitlePreset } from '../types';
import { SUBTITLE_PRESETS } from '../lib/subtitlePresets';
import { CanvasVideoRecorder } from '../lib/canvasVideoRecorder';

interface PlayerViewProps {
  clip: CuratedClip;
  videoSrc: string;
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  onClipUpdate: (updatedClip: CuratedClip) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  clip,
  videoSrc,
  selectedPresetId,
  onPresetChange,
  onClipUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.startTime);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [layoutType, setLayoutType] = useState<FramingLayoutType>(clip.layoutType || 'speaker_center');
  const [showHookBanner, setShowHookBanner] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Trimming State
  const [trimStart, setTrimStart] = useState(clip.startTime);
  const [trimEnd, setTrimEnd] = useState(clip.endTime);

  const activePreset = SUBTITLE_PRESETS.find((p) => p.id === selectedPresetId) || SUBTITLE_PRESETS[0];

  // Sync state when clip changes
  useEffect(() => {
    setTrimStart(clip.startTime);
    setTrimEnd(clip.endTime);
    setCurrentTime(clip.startTime);
    setLayoutType(clip.layoutType || 'speaker_center');
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [clip]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Determine canvas resolution based on aspect ratio
      let targetWidth = 1080;
      let targetHeight = 1920; // 9:16 default
      if (aspectRatio === '1:1') {
        targetWidth = 1080;
        targetHeight = 1080;
      } else if (aspectRatio === '16:9') {
        targetWidth = 1920;
        targetHeight = 1080;
      }

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video.readyState >= 2) {
        const vw = video.videoWidth || 1920;
        const vh = video.videoHeight || 1080;

        // Render Background / Framing based on layoutType
        if (aspectRatio === '9:16') {
          if (layoutType === 'speaker_center') {
            // Center crop 9:16
            const cropWidth = vh * (9 / 16);
            const cropX = Math.max(0, (vw - cropWidth) / 2);
            ctx.drawImage(video, cropX, 0, cropWidth, vh, 0, 0, canvas.width, canvas.height);
          } else if (layoutType === 'split_screen') {
            // Two-speaker stacked split screen (top speaker & bottom speaker)
            const halfHeight = canvas.height / 2;
            // Top half: left third of video
            ctx.drawImage(video, 0, 0, vw * 0.5, vh, 0, 0, canvas.width, halfHeight);
            // Bottom half: right third of video
            ctx.drawImage(video, vw * 0.5, 0, vw * 0.5, vh, 0, halfHeight, canvas.width, halfHeight);

            // Divider line
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, halfHeight);
            ctx.lineTo(canvas.width, halfHeight);
            ctx.stroke();
          } else {
            // Blur Fit: blurred stretched backdrop + fitted center 16:9
            ctx.save();
            ctx.filter = 'blur(30px) brightness(0.6)';
            ctx.drawImage(video, 0, 0, vw, vh, -100, -100, canvas.width + 200, canvas.height + 200);
            ctx.restore();

            // Draw crisp centered video
            const fitH = canvas.width * (vh / vw);
            const fitY = (canvas.height - fitH) / 2;
            ctx.drawImage(video, 0, 0, vw, vh, 0, fitY, canvas.width, fitH);
          }
        } else {
          // 1:1 or 16:9
          ctx.drawImage(video, 0, 0, vw, vh, 0, 0, canvas.width, canvas.height);
        }

        // Render Hook Headline Banner (at top)
        if (showHookBanner && clip.hookHeadline) {
          ctx.save();
          const bannerY = aspectRatio === '9:16' ? 140 : 50;
          ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          const text = clip.hookHeadline.toUpperCase();
          const textWidth = ctx.measureText(text).width;

          // Background pill
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
          ctx.lineWidth = 3;
          const padX = 28;
          const padY = 16;
          roundRect(
            ctx,
            (canvas.width - textWidth) / 2 - padX,
            bannerY - 36,
            textWidth + padX * 2,
            56,
            16
          );
          ctx.fill();
          ctx.stroke();

          // Text
          ctx.fillStyle = '#FACC15';
          ctx.fillText(text, canvas.width / 2, bannerY + 4);
          ctx.restore();
        }

        // Render Dynamic Karaoke Subtitles
        const now = video.currentTime;
        const words = clip.words || [];

        // Find current subtitle block (around current time)
        const currentWordIdx = words.findIndex((w) => now >= w.start && now <= w.end);
        if (currentWordIdx !== -1) {
          // Display window of 4 words around current
          const windowStart = Math.max(0, currentWordIdx - 1);
          const windowEnd = Math.min(words.length, windowStart + 4);
          const currentWindow = words.slice(windowStart, windowEnd);

          ctx.save();
          const subY =
            activePreset.position === 'top'
              ? 260
              : activePreset.position === 'middle'
              ? canvas.height / 2 + 100
              : canvas.height - 300;

          ctx.font = `900 ${activePreset.fontSize * 2}px ${activePreset.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.lineJoin = 'round';

          // Measure words
          const measured = currentWindow.map((w) => {
            const rawText = activePreset.uppercase ? w.word.toUpperCase() : w.word;
            return {
              text: rawText,
              width: ctx.measureText(rawText).width,
              isActive: now >= w.start && now <= w.end
            };
          });

          const totalWidth = measured.reduce((acc, m) => acc + m.width + 16, 0) - 16;
          let startX = (canvas.width - totalWidth) / 2;

          measured.forEach((item) => {
            const wordCenterX = startX + item.width / 2;

            // Stroke / Outline
            ctx.strokeStyle = activePreset.strokeColor;
            ctx.lineWidth = activePreset.strokeWidth * 2;
            ctx.strokeText(item.text, wordCenterX, subY);

            // Fill color
            ctx.fillStyle = item.isActive ? activePreset.activeColor : activePreset.normalColor;

            // Scale bounce effect for active word
            if (item.isActive && activePreset.animation === 'pop') {
              ctx.save();
              ctx.translate(wordCenterX, subY);
              ctx.scale(1.08, 1.08);
              ctx.fillText(item.text, 0, 0);
              ctx.restore();
            } else {
              ctx.fillText(item.text, wordCenterX, subY);
            }

            startX += item.width + 16;
          });

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [aspectRatio, layoutType, showHookBanner, activePreset, clip]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Loop back to start if reached trimEnd
    if (time >= trimEnd) {
      videoRef.current.currentTime = trimStart;
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = trimStart;
    videoRef.current.play();
    setIsPlaying(true);
  };

  // Export 9:16 Video
  const handleExport = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const recorder = new CanvasVideoRecorder(canvasRef.current, videoRef.current, clip, activePreset);
      const videoBlob = await recorder.recordClip((progress) => {
        setExportProgress(Math.round(progress));
      });

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Short.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed: ' + (err as any).message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
      {/* Hidden Video Source Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        crossOrigin="anonymous"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* Left: 9:16 Canvas Phone Frame */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative rounded-3xl p-3 bg-slate-900 border-2 border-slate-800 shadow-2xl ring-1 ring-white/10 max-w-[340px] w-full">
          {/* Phone Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 border border-slate-800"></div>

          {/* Screen Canvas */}
          <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-black flex items-center justify-center">
            <canvas ref={canvasRef} className="size-full object-contain" />

            {/* Play Overlay Button if paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto size-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer"
              >
                <Play className="size-7 ml-1 fill-white" />
              </button>
            )}

            {/* Exporting Overlay */}
            {isExporting && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4"></div>
                <h4 className="font-bold text-white text-sm mb-1">Rendering Viral Short...</h4>
                <p className="text-xs text-indigo-400 font-mono mb-3">{exportProgress}%</p>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">Recording canvas frames & karaoke subtitles</p>
              </div>
            )}
          </div>
        </div>

        {/* Video Playback Bar */}
        <div className="w-full max-w-[340px] mt-4 flex items-center justify-between gap-3 px-2">
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            title="Restart clip"
          >
            <RotateCcw className="size-4" />
          </button>

          <div className="flex-1 text-center font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 py-2 rounded-xl">
            {formatSec(currentTime)} / {formatSec(trimEnd)}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="size-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Right: Studio Controls (Framing, Captions, Trimming) */}
      <div className="flex-[1.2] space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <span>{clip.title}</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Rank #{clip.rank}
            </span>
          </div>
          <p className="text-xs text-slate-400">{clip.hookHeadline}</p>
        </div>

        {/* 1. Aspect Ratio & Dynamic Reframing */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Crop className="size-3.5 text-indigo-400" />
              <span>Aspect Ratio</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {aspectRatio === '9:16' && (
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-200 block mb-2">Smart Framing Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'speaker_center', label: 'Speaker Center', desc: 'Focus 16:9 on speaker' },
                  { id: 'split_screen', label: 'Split Screen', desc: 'Stacked 2-speaker view' },
                  { id: 'blur_fit', label: 'Blurred Fit', desc: 'Fit video + blur backdrop' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setLayoutType(mode.id as FramingLayoutType);
                      onClipUpdate({ ...clip, layoutType: mode.id as FramingLayoutType });
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      layoutType === mode.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">{mode.label}</div>
                    <div className="text-[10px] text-slate-400">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Subtitle Style & Karaoke Preset */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Type className="size-3.5 text-amber-400" />
              <span>Animated Subtitle Style</span>
            </label>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Word-level sync</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUBTITLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                  {selectedPresetId === preset.id && <Check className="size-3.5 text-indigo-400" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: preset.activeColor }}></span>
                  <span>Active highlight color</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-300">Show Viral Hook Banner at Top</span>
            <input
              type="checkbox"
              checked={showHookBanner}
              onChange={(e) => setShowHookBanner(e.target.checked)}
              className="size-4 rounded accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Clip Trimming Controls */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="size-3.5 text-emerald-400" />
            <span>Fine-Tune Trim Bounds</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Start Time: {formatSec(trimStart)}</span>
              <input
                type="range"
                min={Math.max(0, clip.startTime - 10)}
                max={trimEnd - 3}
                step={0.5}
                value={trimStart}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrimStart(val);
                  onClipUpdate({ ...clip, startTime: val, duration: trimEnd - val });
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">End Time: {formatSec(trimEnd)}</span>
              <input
                type="range"
                min={trimStart + 3}
                max={clip.endTime + 10}
                step={0.5}
                value={trimEnd}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTrimEnd(val);
                  onClipUpdate({ ...clip, endTime: val, duration: val - trimStart });
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
