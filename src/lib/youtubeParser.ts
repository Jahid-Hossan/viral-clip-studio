import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function parseVttToCleanTranscript(vttPath: string): string {
  if (!fs.existsSync(vttPath)) return '';
  const content = fs.readFileSync(vttPath, 'utf8');
  const lines = content.split('\n');
  const textLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('WEBVTT') || trimmed.includes('-->') || trimmed.startsWith('NOTE') || /^\d+$/.test(trimmed)) {
      continue;
    }
    // Remove HTML-like tags (e.g. <c>, </c>, <00:01:23.000>)
    const cleaned = trimmed.replace(/<[^>]+>/g, '').trim();
    if (cleaned && !textLines.includes(cleaned)) {
      textLines.push(cleaned);
    }
  }

  return textLines.join(' ');
}

// Test with RE3_PGwDwhw.en.vtt that we just downloaded!
const vttFile = 'c:/Users/Jahid/Desktop/ANTIGRAVITY/viral-clip-studio/uploads/RE3_PGwDwhw.en.vtt';
const transcript = parseVttToCleanTranscript(vttFile);
console.log('Transcript length:', transcript.length);
console.log('Transcript preview:', transcript.substring(0, 300));
