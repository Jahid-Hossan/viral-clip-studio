import React from 'react';
import { Sparkles, Video, Flame, Film, Settings, Cpu } from 'lucide-react';
import { AIProviderConfig } from '../types';
import { DEFAULT_PROVIDER_CONFIGS } from '../lib/providerDefaults';

interface NavbarProps {
  onNewVideo: () => void;
  onLoadDemo: () => void;
  onOpenSettings: () => void;
  providerConfig: AIProviderConfig;
  clipCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewVideo,
  onLoadDemo,
  onOpenSettings,
  providerConfig,
  clipCount
}) => {
  const providerInfo = DEFAULT_PROVIDER_CONFIGS[providerConfig.provider] || DEFAULT_PROVIDER_CONFIGS.gemini;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Flame className="size-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ViralClip
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Studio AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              OpusClip REA Architecture & Virality Judge
            </p>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
            title="Configure AI Provider & Model"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              AI: <strong className="text-indigo-400">{providerInfo.name}</strong> ({providerConfig.modelName || 'default'})
            </span>
            <Settings className="size-3.5 text-slate-400 ml-1" />
          </button>

          {clipCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-xs text-indigo-300">
              <Film className="size-3.5 text-indigo-400" />
              <span><strong>{clipCount}</strong> Viral Clips Ready</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-700 transition-colors border border-slate-700/50 cursor-pointer md:hidden"
            title="AI Provider Settings"
          >
            <Settings className="size-4" />
          </button>

          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-slate-300 bg-slate-800/70 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/50 cursor-pointer"
          >
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Load Demo Clips</span>
          </button>
          
          <button
            onClick={onNewVideo}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Video className="size-3.5" />
            <span>New Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
