import React, { useState, useEffect, useMemo } from 'react';
import { Upload, X, Sparkles, Link, Sliders, Film, Wand2, FileVideo, Settings, Server, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { CurationPref, AIProviderConfig } from '../types';
import { DEFAULT_PROVIDER_CONFIGS } from '../lib/providerDefaults';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File | null, url: string, pref: CurationPref) => void;
  onLoadDemo: () => void;
  onOpenSettings: () => void;
  providerConfig: AIProviderConfig;
  isLoading: boolean;
}

const GENERATION_STAGES = [
  { title: '1. Ingest', label: '📥 Demuxing media streams and preparing audio...' },
  { title: '2. Transcribe', label: '🎙️ Auto-transcribing speech & calculating word timestamps...' },
  { title: '3. Virality AI', label: '🧠 AI Judge: Scoring hooks, coherence & retention curves...' },
  { title: '4. 9:16 Synthesis', label: '⚡ Synthesizing 9:16 vertical crop & dynamic karaoke...' }
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onLoadDemo,
  onOpenSettings,
  providerConfig,
  isLoading
}) => {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [viralityProfile, setViralityProfile] = useState<CurationPref['viralityProfile']>('podcast_story');
  const [targetDuration, setTargetDuration] = useState<CurationPref['targetDuration']>('30-60s');
  const [enableAutoHook, setEnableAutoHook] = useState(true);
  const [enableAiBroll, setEnableAiBroll] = useState(true);

  // Live Progress Simulation States
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const providerInfo = DEFAULT_PROVIDER_CONFIGS[providerConfig.provider] || DEFAULT_PROVIDER_CONFIGS.gemini;

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(elapsed);

      // Smooth progression curve through the stages
      if (elapsed < 3) {
        setProgress(Math.min(25, (elapsed / 3) * 25));
      } else if (elapsed < 8) {
        setProgress(25 + Math.min(35, ((elapsed - 3) / 5) * 35));
      } else if (elapsed < 16) {
        setProgress(60 + Math.min(28, ((elapsed - 8) / 8) * 28));
      } else {
        // Asymptotically approach 97% until server response completes
        setProgress(88 + Math.min(9, (1 - Math.exp(-(elapsed - 16) / 10)) * 9));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const currentStageIndex = useMemo(() => {
    if (progress < 25) return 0;
    if (progress < 60) return 1;
    if (progress < 88) return 2;
    return 3;
  }, [progress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !videoUrl.trim()) {
      alert('Please select a video file or paste a video link');
      return;
    }

    const pref: CurationPref = {
      viralityProfile,
      targetDuration,
      customPrompt: customPrompt.trim() || undefined,
      enableAutoHook,
      enableAiBroll,
      model: providerConfig.modelName || 'default',
      providerConfig
    };

    onSubmit(selectedFile, videoUrl.trim(), pref);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Upload className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Viral Clips</h3>
              <p className="text-xs text-slate-400">Repurpose long-form video into high-retention shorts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Quick Demo Action Bar */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-amber-400" />
              <span className="text-xs font-semibold text-indigo-200">
                Want to test immediately without uploading?
              </span>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                onClose();
                onLoadDemo();
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              Load Demo Project
            </button>
          </div>

          {/* Video Source Picker */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-300 block">Choose Video Source</label>

            {/* Drag & Drop File Area */}
            <div className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-950/40 hover:bg-indigo-950/10 transition-all cursor-pointer relative group">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-slate-800/80 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors">
                  <Film className="size-6 text-indigo-400" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-indigo-300">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ready</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      Drop MP4/MOV file here, or <span className="text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Podcasts, talks, or long gameplay up to 500MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube URL Fallback */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link className="size-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Or Paste YouTube / Web Video URL</span>
              </div>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {/* Curation Preferences (REA Opus Virality Engine Config) */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="size-3.5 text-indigo-400" />
                <span>Virality & Pacing Preferences</span>
              </label>
            </div>

            {/* Profile Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Virality Style Target</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'podcast_story', label: '🎙️ Podcast Storytelling', desc: 'Narrative arcs & personal revelations' },
                  { id: 'high_energy_tiktok', label: '⚡ High Energy TikTok', desc: 'Explosive hooks & fast-paced cuts' },
                  { id: 'educational', label: '🧠 Educational & Insight', desc: 'Mental models, advice & key lessons' },
                  { id: 'comedy_punchline', label: '😂 Punchline & Humor', desc: 'Banter, comedic timing & reactions' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setViralityProfile(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      viralityProfile === item.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Bracket */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Target Clip Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {(['<30s', '30-60s', '60-90s'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setTargetDuration(dur)}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      targetDuration === dur
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Guidance */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Custom AI Prompt (Optional Topic Steering)
              </label>
              <input
                type="text"
                placeholder="e.g. Find moments discussing AI agent frameworks or startup failures"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoHook}
                  onChange={(e) => setEnableAutoHook(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">Auto Hook Title Banner</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAiBroll}
                  onChange={(e) => setEnableAiBroll(e.target.checked)}
                  disabled={isLoading}
                  className="size-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">Auto AI B-Roll Suggestions</span>
              </label>
            </div>
          </div>

          {/* Active AI Provider Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="size-4 text-indigo-400" />
              <span>
                Engine: <strong className="text-white">{providerInfo.name}</strong> ({providerConfig.modelName})
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              disabled={isLoading}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Settings className="size-3.5" />
              <span>Change Provider</span>
            </button>
          </div>

          {/* Live Progress Bar Section While Generating */}
          {isLoading && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4 shadow-2xl shadow-indigo-950/40 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Loader2 className="size-5 text-white animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      Generating Viral Clips
                      <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                        <Clock className="size-3" />
                        {elapsedSeconds.toFixed(0)}s elapsed
                      </span>
                    </h4>
                    <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
                      {GENERATION_STAGES[currentStageIndex].label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 font-mono">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {/* Glowing Gradient Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 relative shadow-lg shadow-indigo-500/50"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>

              {/* Multi-Step Indicator Pills */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {GENERATION_STAGES.map((s, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                      idx < currentStageIndex
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                        : idx === currentStageIndex
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider">{s.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing ({Math.round(progress)}%)...</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-4" />
                  <span>Generate Viral Clips</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
