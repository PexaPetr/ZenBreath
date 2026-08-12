import type { Language } from "../types";
import { ttsService } from "./ttsService";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private voiceGainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.voiceGainNode = this.ctx.createGain();

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;

    this.voiceGainNode.connect(filter);
    filter.connect(this.ctx.destination);
  }

  async loadAssets(lang: Language, onProgress: (msg: string) => void) {
    if (!this.ctx) await this.init();

    this.stopAll();
    this.buffers.clear();

    const isEn = lang === "en";
    const assets = [
      {
        key: "inhale",
        text: isEn ? "Inhale... 1... 2... 3... 4." : "Nádech... jedna... dva... tři... čtyři.",
      },
      {
        key: "hold",
        text: isEn
          ? "Hold... 1... 2... 3... 4... 5... 6... 7."
          : "Zadržet... jedna... dva... tři... čtyři... pět... šest... sedm.",
      },
      {
        key: "exhale",
        text: isEn
          ? "Exhale... 1... 2... 3... 4... 5... 6... 7... 8."
          : "Výdech... jedna... dva... tři... čtyři... pět... šest... sedm... osm.",
      },
      {
        key: "outro",
        text: isEn ? "The session is complete. Rest deeply." : "Cvičení je u konce. Odpočívejte.",
      },
    ];

    onProgress(isEn ? "Syncing voice..." : "Synchronizace hlasu...");

    for (const asset of assets) {
      const audioData = await ttsService.generateSpeech(asset.text);
      const buffer = await ttsService.decodeToAudioBuffer(audioData, this.ctx!);
      this.buffers.set(asset.key, buffer);
    }
  }

  async playVoice(key: string): Promise<void> {
    if (!this.ctx || !this.buffers.has(key) || !this.voiceGainNode) return;

    this.stopAll();

    return new Promise((resolve) => {
      if (!this.ctx) return resolve();

      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers.get(key)!;
      source.connect(this.voiceGainNode!);

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

  getBufferDuration(key: string): number {
    return this.buffers.get(key)?.duration || 0;
  }

  stopAll() {
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

export const audioEngine = new AudioEngine();
