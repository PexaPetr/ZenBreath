import type { Language } from "../types";
import type { LoadedVoiceBackend, VoiceBackendId } from "../voice/types";
import { resolveVoiceBackend } from "../voice/resolveVoiceBackend";

export type VoiceLoadMode = "tts" | "silent";

const SILENT_SECONDS: Record<string, number> = {
  inhale: 4,
  hold: 7,
  exhale: 8,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private voiceGainNode: GainNode | null = null;
  private voiceBackend: LoadedVoiceBackend | null = null;
  private loadMode: VoiceLoadMode = "tts";
  private muted = false;
  private silentTimer: number | null = null;
  private silentTimerResolve: (() => void) | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.voiceGainNode = this.ctx.createGain();
    this.voiceGainNode.gain.value = this.muted ? 0 : 1;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;

    this.voiceGainNode.connect(filter);
    filter.connect(this.ctx.destination);
  }

  /** Instantly mutes/unmutes voice playback (short fade to avoid clicks). */
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.voiceGainNode) {
      this.voiceGainNode.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Active voiced backend id, or `silent`, or `null` before load. */
  getActiveVoiceBackendId(): VoiceBackendId | "silent" | null {
    if (this.loadMode === "silent") return "silent";
    return this.voiceBackend?.id ?? null;
  }

  async loadAssets(lang: Language, onProgress: (msg: string) => void, mode: VoiceLoadMode = "tts") {
    if (!this.ctx) await this.init();

    this.stopAll();
    this.voiceBackend = null;
    this.loadMode = mode;

    if (mode === "silent") {
      onProgress(lang === "en" ? "Voiceless mode (4-7-8)…" : "Režim bez hlasu (4-7-8)…");
      return;
    }

    this.voiceBackend = await resolveVoiceBackend(this.ctx!, lang, onProgress);
  }

  isSilentMode(): boolean {
    return this.loadMode === "silent";
  }

  async playVoice(key: string): Promise<void> {
    if (this.loadMode === "silent") {
      const sec = SILENT_SECONDS[key] ?? 4;
      return new Promise((resolve) => {
        this.clearSilentTimer();
        this.silentTimerResolve = resolve;
        this.silentTimer = window.setTimeout(() => {
          this.silentTimer = null;
          this.silentTimerResolve = null;
          resolve();
        }, sec * 1000);
      });
    }

    if (!this.ctx || !this.voiceGainNode || !this.voiceBackend) return;

    return this.voiceBackend.play(key, this.ctx, this.voiceGainNode);
  }

  getBufferDuration(key: string): number {
    if (this.loadMode === "silent") {
      return SILENT_SECONDS[key] ?? 4;
    }
    const d = this.voiceBackend?.getDurationSec(key) ?? 0;
    return d > 0 ? d : 0;
  }

  private clearSilentTimer() {
    if (this.silentTimer !== null) {
      window.clearTimeout(this.silentTimer);
      this.silentTimer = null;
    }
    if (this.silentTimerResolve) {
      const r = this.silentTimerResolve;
      this.silentTimerResolve = null;
      r();
    }
  }

  stopAll() {
    this.clearSilentTimer();
    this.voiceBackend?.stopPlayback();
  }
}

export const audioEngine = new AudioEngine();
