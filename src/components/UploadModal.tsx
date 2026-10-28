import React, { useState } from 'react';
import { Upload, X, Sparkles, Link, Sliders, Film, Wand2, FileVideo, Settings, Server } from 'lucide-react';
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

  const providerInfo = DEFAULT_PROVIDER_CONFIGS[providerConfig.provider] || DEFAULT_PROVIDER_CONFIGS.gemini;

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
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
              onClick={() => {
                onClose();
                onLoadDemo();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Load Demo Video
            </button>
          </div>

          {/* Video Input: Dropzone or URL */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block">Select Video Source</label>
            
            {/* File Drag & Drop Box */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-6 text-center bg-slate-950/50 transition-colors group cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="size-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:scale-105 transition-all">
                  <FileVideo className="size-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-indigo-400">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Drag and drop your video file here, or <span className="text-indigo-400">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">MP4, WebM, MOV supported (up to 500MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Or Video URL */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span>OR PASTE VIDEO LINK</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Link className="size-4 text-slate-500" />
              <input
                type="url"
                placeholder="https://commondatastorage.googleapis.com/.../video.mp4 or YouTube link"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-transparent text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none flex-1"
              />
            </div>
          </div>

          {/* Curation Preferences (OpusClip Engine) */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="size-3.5 text-indigo-400" />
              <span>AI Curation Preferences (curationPref)</span>
            </h4>

            {/* Virality Profile */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Target Content Genre & Virality Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'podcast_story', label: 'Podcast Storytelling', desc: 'Focus on narrative arc & epiphanies' },
                  { id: 'high_energy_tiktok', label: 'High-Energy Hook', desc: 'Fast-paced, hook score > 90' },
                  { id: 'educational', label: 'Tech & Educational', desc: 'Step-by-step insight & clarity' },
                  { id: 'comedy_punchline', label: 'Humor & Punchline', desc: 'Comic timing & reaction beats' }
                ].map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setViralityProfile(prof.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      viralityProfile === prof.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{prof.label}</div>
                    <div className="text-[10px] text-slate-500">{prof.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Duration */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Target Clip Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['<30s', '30-60s', '60-90s'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoHook}
                  onChange={(e) => setEnableAutoHook(e.target.checked)}
                  className="size-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">Auto Hook Title Banner</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAiBroll}
                  onChange={(e) => setEnableAiBroll(e.target.checked)}
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
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="size-3.5" />
              <span>Change Provider</span>
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
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
                  <div className="size-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Ingesting & Analyzing with AI...</span>
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
