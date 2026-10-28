import React from 'react';
import { X, Flame, Anchor, Brain, Heart, TrendingUp, DollarSign, Sparkles } from 'lucide-react';
import { CuratedClip } from '../types';

interface ScoreBreakdownModalProps {
  clip: CuratedClip | null;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({ clip, onClose }) => {
  if (!clip) return null;

  const { judgeResult } = clip;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 80) return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-400';
    if (score >= 80) return 'from-purple-500 to-indigo-400';
    return 'from-blue-500 to-cyan-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="size-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Virality Judge Breakdown</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Opus Model v2
                </span>
              </div>
              <p className="text-xs text-slate-400">Deep-dive metric analysis for "{clip.title.substring(0, 45)}..."</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Score Hero */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Overall Virality Index</span>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                Rank #{clip.rank} Viral Candidate
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Based on predictive audience retention curves across TikTok, Reels, and Shorts.
              </p>
            </div>
            <div className="text-center">
              <div className={`size-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg ${getScoreColor(judgeResult.score)}`}>
                <span className="text-3xl font-black">{judgeResult.score}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">/ 100</span>
              </div>
            </div>
          </div>

          {/* Metric Dimensions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hook Impact */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Anchor className="size-4 text-amber-400" />
                  <span>Hook Strength (0-3s)</span>
                </div>
                <span className="text-sm font-extrabold text-amber-400">{judgeResult.hookScore}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${judgeResult.hookScore}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {judgeResult.hookExplanation}
              </p>
            </div>

            {/* Narrative Coherence */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Brain className="size-4 text-indigo-400" />
                  <span>Narrative Coherence</span>
                </div>
                <span className="text-sm font-extrabold text-indigo-400">{judgeResult.coherenceScore}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${judgeResult.coherenceScore}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {judgeResult.coherenceExplanation}
              </p>
            </div>

            {/* Emotional Connection */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Heart className="size-4 text-pink-400" />
                  <span>Audience Connection</span>
                </div>
                <span className="text-sm font-extrabold text-pink-400">{judgeResult.connectionScore}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full transition-all duration-500" style={{ width: `${judgeResult.connectionScore}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Relatability index and trigger for shares, comments, and saves.
              </p>
            </div>

            {/* Social Trend Match */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <TrendingUp className="size-4 text-emerald-400" />
                  <span>Social Algorithm Fit</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-400">{judgeResult.trendScore}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${judgeResult.trendScore}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Keyword density matches current high-velocity FYP search patterns.
              </p>
            </div>
          </div>

          {/* AI Strategic Synthesis */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Sparkles className="size-4 text-indigo-400" />
              <span>AI Repurposing Verdict</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {judgeResult.viralReasoning}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
