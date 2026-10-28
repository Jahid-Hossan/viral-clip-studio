import React from 'react';
import { Play, Sparkles, Download, FileCode, Subtitles, BarChart3, Clock, Check } from 'lucide-react';
import { CuratedClip } from '../types';
import { generateAdobePremiereXml, generateSrtSubtitles } from '../lib/adobeXmlExporter';

interface ClipCardProps {
  clip: CuratedClip;
  isSelected: boolean;
  onSelect: () => void;
  onInspectScore: () => void;
  videoUrl: string;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  isSelected,
  onSelect,
  onInspectScore,
  videoUrl
}) => {
  const { judgeResult } = clip;

  const handleDownloadXml = (e: React.MouseEvent) => {
    e.stopPropagation();
    const xmlContent = generateAdobePremiereXml(clip, videoUrl);
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Premiere.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSrt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const srtContent = generateSrtSubtitles(clip);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 80) return 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30';
    return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
      }`}
    >
      {/* Top Bar: Rank & Virality Score */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center size-7 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">
            #{clip.rank}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-medium">
            <Clock className="size-3 text-slate-400" />
            <span>{formatSec(clip.startTime)} - {formatSec(clip.endTime)} ({Math.round(clip.duration)}s)</span>
          </div>
        </div>

        {/* Score Badge */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onInspectScore();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border bg-gradient-to-r font-extrabold text-xs shadow-sm hover:scale-105 transition-transform ${getScoreColor(
            judgeResult.score
          )}`}
          title="Click to view AI Virality Judge breakdown"
        >
          <Sparkles className="size-3.5" />
          <span>Score: {judgeResult.score}</span>
        </div>
      </div>

      {/* Title & Hook Headline */}
      <div className="space-y-1.5 mb-3">
        <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
          {clip.title}
        </h4>
        <div className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          <span className="uppercase text-[9px] font-black tracking-wider text-amber-500">Hook:</span>
          <span className="truncate">{clip.hookHeadline}</span>
        </div>
      </div>

      {/* Transcript Excerpt */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
        "{clip.transcript}"
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {clip.tags.slice(0, 3).map((tag, i) => (
          <span key={i} className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspectScore();
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <BarChart3 className="size-3.5" />
          <span>Metric Breakdown</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadSrt}
            className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
            title="Download SRT Subtitles"
          >
            <Subtitles className="size-3.5" />
          </button>
          
          <button
            onClick={handleDownloadXml}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 text-[11px] font-medium transition-colors"
            title="Export Adobe Premiere Pro XML Sequence"
          >
            <FileCode className="size-3.5 text-indigo-400" />
            <span>Premiere XML</span>
          </button>
        </div>
      </div>
    </div>
  );
};
