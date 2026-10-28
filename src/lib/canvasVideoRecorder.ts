import { CuratedClip, SubtitlePreset } from '../types';

export class CanvasVideoRecorder {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private clip: CuratedClip;
  private preset: SubtitlePreset;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement, clip: CuratedClip, preset: SubtitlePreset) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.video = video;
    this.clip = clip;
    this.preset = preset;
  }

  public async recordClip(onProgress?: (progress: number) => void): Promise<Blob> {
    this.recordedChunks = [];
    this.isRecording = true;

    // Reset video to clip start time
    this.video.currentTime = this.clip.startTime;
    await new Promise((resolve) => {
      this.video.onseeked = () => resolve(true);
    });

    const stream = this.canvas.captureStream(30);

    // Capture audio if video has an audio track
    try {
      // @ts-ignore
      const audioStream = this.video.captureStream ? this.video.captureStream() : (this.video as any).mozCaptureStream ? (this.video as any).mozCaptureStream() : null;
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
      }
    } catch (e) {
      console.warn('Audio track capture fallback:', e);
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm';

    this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    return new Promise(async (resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('MediaRecorder initialization failed'));

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        resolve(blob);
      };

      this.mediaRecorder.start(100);
      try {
        await this.video.play();
      } catch (err) {
        return reject(err);
      }

      const totalDuration = this.clip.endTime - this.clip.startTime;

      const checkTime = () => {
        if (!this.isRecording) return;
        const elapsed = this.video.currentTime - this.clip.startTime;
        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        if (onProgress) onProgress(progress);

        if (this.video.currentTime >= this.clip.endTime || this.video.ended) {
          this.video.pause();
          this.mediaRecorder?.stop();
        } else {
          requestAnimationFrame(checkTime);
        }
      };

      requestAnimationFrame(checkTime);
    });
  }
}
