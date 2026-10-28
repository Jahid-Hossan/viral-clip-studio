export type AIProviderType = 'gemini' | 'openrouter' | 'omniroute' | 'nvidia' | 'opencode' | 'custom';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export interface CurationPref {
  customPrompt?: string;
  viralityProfile: 'high_energy_tiktok' | 'podcast_story' | 'educational' | 'comedy_punchline';
  targetDuration: '<30s' | '30-60s' | '60-90s';
  enableAutoHook: boolean;
  enableAiBroll: boolean;
  model: string;
  providerConfig?: AIProviderConfig;
}

export interface JudgeResult {
  score: number;             // 0-100 overall virality rating
  hookScore: number;         // 0-100 first 3 seconds hook impact
  coherenceScore: number;    // 0-100 narrative clarity & self-contained punch
  connectionScore: number;   // 0-100 emotional connection / audience engagement
  trendScore: number;        // 0-100 social algorithm alignment
  sponsorshipScore: number;  // 0-100 brand safety & commercial potential
  hookExplanation: string;
  coherenceExplanation: string;
  viralReasoning: string;
}

export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export type FramingLayoutType = 'speaker_center' | 'split_screen' | 'blur_fit';

export interface CuratedClip {
  clipId: string;
  rank: number;
  title: string;
  hookHeadline: string;
  startTime: number;
  endTime: number;
  duration: number;
  judgeResult: JudgeResult;
  transcript: string;
  words: WordTimestamp[];
  suggestedBrollKeywords: string[];
  layoutType: FramingLayoutType;
  cropCoordinates?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number;
    height: number;
  };
  tags: string[];
}

export interface SubtitlePreset {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  activeColor: string; // Color when word is active (e.g. #FACC15 yellow)
  normalColor: string; // Color of regular words (#FFFFFF)
  strokeColor: string;
  strokeWidth: number;
  position: 'top' | 'middle' | 'bottom';
  animation: 'karaoke' | 'pop' | 'glow';
  uppercase: boolean;
}

export interface ProjectState {
  projectId: string;
  title: string;
  sourceType: 'file' | 'url';
  videoUrl: string;
  duration: number;
  status: 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  statusMessage: string;
  clips: CuratedClip[];
  curationPref: CurationPref;
  selectedClipId?: string;
  selectedSubtitlePresetId: string;
}
