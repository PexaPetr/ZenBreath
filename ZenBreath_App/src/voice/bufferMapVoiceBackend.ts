import type { LoadedVoiceBackend, VoiceBackendId } from "./types";

/** Web Audio playback from decoded buffers (static files or OpenAI TTS). */
export class BufferMapVoiceBackend implements LoadedVoiceBackend {
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(
    readonly id: VoiceBackendId,
    private readonly buffers: Map<string, AudioBuffer>,
  ) {}

  getDurationSec(key: string): number {
    return this.buffers.get(key)?.duration ?? 0;
  }

  play(key: string, ctx: AudioContext, gain: GainNode): Promise<void> {
    const buf = this.buffers.get(key);
    if (!buf) return Promise.resolve();

    this.stopPlayback();

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.connect(gain);
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        resolve();
      };
      this.currentSource = source;
      source.start();
    });
  }

  stopPlayback(): void {
    if (this.currentSource) {
      try {
        this.currentSource.onended = null;
        this.currentSource.stop();
      } catch {
        /* already stopped */
      }
      this.currentSource = null;
    }
  }
}
