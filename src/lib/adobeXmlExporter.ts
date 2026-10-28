import { CuratedClip } from '../types';

/**
 * Generates an Adobe Premiere Pro / Final Cut Pro XML sequence (xmeml v4)
 * Reverse-engineered from OpusClip's renderAsAdobeXml pipeline.
 */
export function generateAdobePremiereXml(clip: CuratedClip, videoSrcUrl: string, fps: number = 30): string {
  const timebase = fps;
  const inFrames = Math.round(clip.startTime * timebase);
  const outFrames = Math.round(clip.endTime * timebase);
  const durationFrames = outFrames - inFrames;

  // Generate markers for each subtitle word
  const markersXml = clip.words.map((w, idx) => {
    const wordInFrames = Math.round(w.start * timebase);
    const wordOutFrames = Math.round(w.end * timebase);
    return `
      <marker>
        <comment>${escapeXml(w.word)}</comment>
        <name>Word_${idx + 1}</name>
        <in>${wordInFrames}</in>
        <out>${wordOutFrames}</out>
      </marker>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="sequence-1">
    <name>${escapeXml(clip.title)} [Virality: ${clip.judgeResult.score}]</name>
    <duration>${durationFrames}</duration>
    <rate>
      <timebase>${timebase}</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <timecode>
      <rate>
        <timebase>${timebase}</timebase>
        <ntsc>FALSE</ntsc>
      </rate>
      <string>00:00:00:00</string>
      <frame>0</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <rate>
              <timebase>${timebase}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
            <width>1080</width>
            <height>1920</height>
            <pixelaspectratio>square</pixelaspectratio>
            <fielddominance>none</fielddominance>
          </samplecharacteristics>
        </format>
        <track>
          <clipitem id="clipitem-1">
            <masterclipid>masterclip-1</masterclipid>
            <name>${escapeXml(clip.title)}</name>
            <enabled>TRUE</enabled>
            <duration>${durationFrames}</duration>
            <rate>
              <timebase>${timebase}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
            <start>0</start>
            <end>${durationFrames}</end>
            <in>${inFrames}</in>
            <out>${outFrames}</out>
            <file id="file-1">
              <name>SourceVideo</name>
              <pathurl>${escapeXml(videoSrcUrl)}</pathurl>
              <rate>
                <timebase>${timebase}</timebase>
                <ntsc>FALSE</ntsc>
              </rate>
              <duration>${outFrames + 100}</duration>
              <media>
                <video>
                  <samplecharacteristics>
                    <width>1920</width>
                    <height>1080</height>
                  </samplecharacteristics>
                </video>
              </media>
            </file>
          </clipitem>
        </track>
      </video>
      <audio>
        <track>
          <clipitem id="audio-1">
            <masterclipid>masterclip-1</masterclipid>
            <name>${escapeXml(clip.title)} [Audio]</name>
            <enabled>TRUE</enabled>
            <duration>${durationFrames}</duration>
            <rate>
              <timebase>${timebase}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
            <start>0</start>
            <end>${durationFrames}</end>
            <in>${inFrames}</in>
            <out>${outFrames}</out>
            <file id="file-1" />
          </clipitem>
        </track>
      </audio>
    </media>
    <markers>
      <marker>
        <comment>Hook Headline: ${escapeXml(clip.hookHeadline)}</comment>
        <name>VIRAL_HOOK</name>
        <in>0</in>
        <out>${Math.min(durationFrames, 3 * timebase)}</out>
      </marker>
      ${markersXml}
    </markers>
  </sequence>
</xmeml>`;
}

export function generateSrtSubtitles(clip: CuratedClip): string {
  const clipStart = clip.startTime;
  const groups: { start: number; end: number; text: string }[] = [];
  
  // Group words into 3-4 word subtitle cards for readability
  const words = clip.words;
  const chunkSize = 4;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      groups.push({
        start: Math.max(0, chunk[0].start - clipStart),
        end: Math.max(0, chunk[chunk.length - 1].end - clipStart),
        text: chunk.map(w => w.word).join(' ')
      });
    }
  }

  return groups.map((g, idx) => {
    return `${idx + 1}\n${formatSrtTime(g.start)} --> ${formatSrtTime(g.end)}\n${g.text}\n`;
  }).join('\n');
}

function formatSrtTime(seconds: number): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
