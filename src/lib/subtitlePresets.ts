import { SubtitlePreset } from '../types';

export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: 'hormozi_green',
    name: 'Hormozi Gold & Green',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 28,
    activeColor: '#22C55E', // Vibrant Green
    normalColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    position: 'middle',
    animation: 'karaoke',
    uppercase: true
  },
  {
    id: 'beast_yellow',
    name: 'MrBeast Viral Yellow',
    fontFamily: 'Impact, sans-serif',
    fontSize: 32,
    activeColor: '#FACC15', // Bright Yellow
    normalColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 5,
    position: 'bottom',
    animation: 'pop',
    uppercase: true
  },
  {
    id: 'cyber_cyan',
    name: 'Cyberpunk Neon',
    fontFamily: 'monospace',
    fontSize: 26,
    activeColor: '#06B6D4', // Cyan
    normalColor: '#E2E8F0',
    strokeColor: '#0F172A',
    strokeWidth: 3,
    position: 'bottom',
    animation: 'glow',
    uppercase: false
  },
  {
    id: 'clean_minimal',
    name: 'Minimalist Clean',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 24,
    activeColor: '#A855F7', // Purple
    normalColor: '#F8FAFC',
    strokeColor: '#1E1B4B',
    strokeWidth: 2,
    position: 'bottom',
    animation: 'karaoke',
    uppercase: false
  }
];
